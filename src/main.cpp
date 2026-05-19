#include <algorithm>
#include <mutex>
#include <string>
#include <string_view>
#include <vector>

#include <userver/components/minimal_server_component_list.hpp>
#include <userver/formats/json.hpp>
#include <userver/http/content_type.hpp>
#include <userver/server/handlers/http_handler_base.hpp>
#include <userver/server/http/http_status.hpp>
#include <userver/utils/daemon_run.hpp>

namespace ridesharing {

namespace {

struct User {
    int id;
    std::string login;
    std::string password;
    std::string first_name;
    std::string last_name;
    std::string token;
};

struct Route {
    int id;
    int user_id;
    std::string from_city;
    std::string to_city;
    int distance_km;
};

struct Trip {
    int id;
    int driver_id;
    int route_id;
    std::string departure_time;
    int available_seats;
    int price;
    std::vector<int> passenger_ids;
};

std::mutex g_mutex;
std::vector<User> g_users;
std::vector<Route> g_routes;
std::vector<Trip> g_trips;

int g_next_user_id = 1;
int g_next_route_id = 1;
int g_next_trip_id = 1;

std::string MakeToken(const User& user) {
    return "token-" + std::to_string(user.id) + "-" + user.login;
}

void SetJsonContentType(const userver::server::http::HttpRequest& request) {
    request.GetHttpResponse().SetContentType(
        userver::http::content_type::kApplicationJson
    );
}

std::string BuildError(
    const userver::server::http::HttpRequest& request,
    userver::server::http::HttpStatus status,
    const std::string& message
) {
    request.GetHttpResponse().SetStatus(status);
    SetJsonContentType(request);

    userver::formats::json::ValueBuilder response;
    response["error"] = message;
    return userver::formats::json::ToString(response.ExtractValue());
}

userver::formats::json::Value BuildUserJson(const User& user) {
    userver::formats::json::ValueBuilder response;
    response["id"] = user.id;
    response["login"] = user.login;
    response["first_name"] = user.first_name;
    response["last_name"] = user.last_name;
    return response.ExtractValue();
}

userver::formats::json::Value BuildRouteJson(const Route& route) {
    userver::formats::json::ValueBuilder response;
    response["id"] = route.id;
    response["user_id"] = route.user_id;
    response["from_city"] = route.from_city;
    response["to_city"] = route.to_city;
    response["distance_km"] = route.distance_km;
    return response.ExtractValue();
}

userver::formats::json::Value BuildTripJson(const Trip& trip) {
    userver::formats::json::ValueBuilder response;
    response["id"] = trip.id;
    response["driver_id"] = trip.driver_id;
    response["route_id"] = trip.route_id;
    response["departure_time"] = trip.departure_time;
    response["available_seats"] = trip.available_seats;
    response["price"] = trip.price;

    auto passengers = response["passenger_ids"];
    for (const auto passenger_id : trip.passenger_ids) {
        passengers.PushBack(passenger_id);
    }

    return response.ExtractValue();
}

bool ContainsIgnoreCase(std::string text, std::string mask) {
    std::transform(text.begin(), text.end(), text.begin(), ::tolower);
    std::transform(mask.begin(), mask.end(), mask.begin(), ::tolower);
    return text.find(mask) != std::string::npos;
}

bool UserExists(int user_id) {
    return std::any_of(
        g_users.begin(),
        g_users.end(),
        [user_id](const User& user) {
            return user.id == user_id;
        }
    );
}

bool RouteExists(int route_id) {
    return std::any_of(
        g_routes.begin(),
        g_routes.end(),
        [route_id](const Route& route) {
            return route.id == route_id;
        }
    );
}

bool IsAuthorized(const userver::server::http::HttpRequest& request) {
    const auto auth_header = request.GetHeader("Authorization");

    const std::string prefix = "Bearer ";

    if (auth_header.size() <= prefix.size()) {
        return false;
    }

    if (auth_header.substr(0, prefix.size()) != prefix) {
        return false;
    }

    const std::string token = std::string(auth_header.substr(prefix.size()));

    return std::any_of(
        g_users.begin(),
        g_users.end(),
        [&](const User& user) {
            return user.token == token;
        }
    );
}

}  // namespace

class PingHandler final : public userver::server::handlers::HttpHandlerBase {
public:
    static constexpr std::string_view kName = "handler-ping";
    using HttpHandlerBase::HttpHandlerBase;

    std::string HandleRequestThrow(
        const userver::server::http::HttpRequest& request,
        userver::server::request::RequestContext&
    ) const override {
        SetJsonContentType(request);
        return R"({"status":"ok","service":"ridesharing-userver","variant":7})";
    }
};

class RegisterHandler final : public userver::server::handlers::HttpHandlerBase {
public:
    static constexpr std::string_view kName = "handler-register";
    using HttpHandlerBase::HttpHandlerBase;

    std::string HandleRequestThrow(
        const userver::server::http::HttpRequest& request,
        userver::server::request::RequestContext&
    ) const override {
        try {
            const auto body = userver::formats::json::FromString(request.RequestBody());

            const auto login = body["login"].As<std::string>();
            const auto password = body["password"].As<std::string>();
            const auto first_name = body["first_name"].As<std::string>();
            const auto last_name = body["last_name"].As<std::string>();

            if (login.empty() || password.empty() || first_name.empty() || last_name.empty()) {
                return BuildError(request, userver::server::http::HttpStatus::kBadRequest,
                                  "login, password, first_name and last_name are required");
            }

            std::lock_guard<std::mutex> lock(g_mutex);

            const auto exists = std::any_of(g_users.begin(), g_users.end(), [&](const User& user) {
                return user.login == login;
            });

            if (exists) {
                return BuildError(request, userver::server::http::HttpStatus::kConflict,
                                  "user with this login already exists");
            }

            User user;
            user.id = g_next_user_id++;
            user.login = login;
            user.password = password;
            user.first_name = first_name;
            user.last_name = last_name;
            user.token = MakeToken(user);

            g_users.push_back(user);

            request.GetHttpResponse().SetStatus(userver::server::http::HttpStatus::kCreated);
            SetJsonContentType(request);

            userver::formats::json::ValueBuilder response;
            response["user"] = BuildUserJson(user);
            response["message"] = "user registered successfully";

            return userver::formats::json::ToString(response.ExtractValue());
        } catch (const std::exception&) {
            return BuildError(request, userver::server::http::HttpStatus::kBadRequest,
                              "invalid request body");
        }
    }
};

class LoginHandler final : public userver::server::handlers::HttpHandlerBase {
public:
    static constexpr std::string_view kName = "handler-login";
    using HttpHandlerBase::HttpHandlerBase;

    std::string HandleRequestThrow(
        const userver::server::http::HttpRequest& request,
        userver::server::request::RequestContext&
    ) const override {
        try {
            const auto body = userver::formats::json::FromString(request.RequestBody());

            const auto login = body["login"].As<std::string>();
            const auto password = body["password"].As<std::string>();

            std::lock_guard<std::mutex> lock(g_mutex);

            for (const auto& user : g_users) {
                if (user.login == login && user.password == password) {
                    SetJsonContentType(request);

                    userver::formats::json::ValueBuilder response;
                    response["access_token"] = user.token;
                    response["token_type"] = "Bearer";
                    response["user"] = BuildUserJson(user);

                    return userver::formats::json::ToString(response.ExtractValue());
                }
            }

            return BuildError(request, userver::server::http::HttpStatus::kUnauthorized,
                              "invalid login or password");
        } catch (const std::exception&) {
            return BuildError(request, userver::server::http::HttpStatus::kBadRequest,
                              "invalid request body");
        }
    }
};

class GetUserByLoginHandler final : public userver::server::handlers::HttpHandlerBase {
public:
    static constexpr std::string_view kName = "handler-user-by-login";
    using HttpHandlerBase::HttpHandlerBase;

    std::string HandleRequestThrow(
        const userver::server::http::HttpRequest& request,
        userver::server::request::RequestContext&
    ) const override {
        const auto login = request.GetPathArg("login");

        std::lock_guard<std::mutex> lock(g_mutex);

        for (const auto& user : g_users) {
            if (user.login == login) {
                SetJsonContentType(request);

                userver::formats::json::ValueBuilder response;
                response["user"] = BuildUserJson(user);

                return userver::formats::json::ToString(response.ExtractValue());
            }
        }

        return BuildError(request, userver::server::http::HttpStatus::kNotFound,
                          "user not found");
    }
};

class SearchUsersHandler final : public userver::server::handlers::HttpHandlerBase {
public:
    static constexpr std::string_view kName = "handler-users-search";
    using HttpHandlerBase::HttpHandlerBase;

    std::string HandleRequestThrow(
        const userver::server::http::HttpRequest& request,
        userver::server::request::RequestContext&
    ) const override {
        const auto first_name_mask = request.GetArg("first_name");
        const auto last_name_mask = request.GetArg("last_name");

        std::lock_guard<std::mutex> lock(g_mutex);

        userver::formats::json::ValueBuilder response;
        auto users = response["users"];

        for (const auto& user : g_users) {
            const bool first_name_matches =
                first_name_mask.empty() || ContainsIgnoreCase(user.first_name, first_name_mask);

            const bool last_name_matches =
                last_name_mask.empty() || ContainsIgnoreCase(user.last_name, last_name_mask);

            if (first_name_matches && last_name_matches) {
                users.PushBack(BuildUserJson(user));
            }
        }

        SetJsonContentType(request);
        return userver::formats::json::ToString(response.ExtractValue());
    }
};

class CreateRouteHandler final : public userver::server::handlers::HttpHandlerBase {
public:
    static constexpr std::string_view kName = "handler-create-route";
    using HttpHandlerBase::HttpHandlerBase;

    std::string HandleRequestThrow(
        const userver::server::http::HttpRequest& request,
        userver::server::request::RequestContext&
    ) const override {
                {
            std::lock_guard<std::mutex> lock(g_mutex);
            if (!IsAuthorized(request)) {
                return BuildError(
                    request,
                    userver::server::http::HttpStatus::kUnauthorized,
                    "authorization token is missing or invalid"
                );
            }
        }
        try {
            const auto body = userver::formats::json::FromString(request.RequestBody());

            const auto user_id = body["user_id"].As<int>();
            const auto from_city = body["from_city"].As<std::string>();
            const auto to_city = body["to_city"].As<std::string>();
            const auto distance_km = body["distance_km"].As<int>();

            if (from_city.empty() || to_city.empty() || distance_km <= 0) {
                return BuildError(request, userver::server::http::HttpStatus::kBadRequest,
                                  "from_city, to_city and positive distance_km are required");
            }

            std::lock_guard<std::mutex> lock(g_mutex);

            if (!UserExists(user_id)) {
                return BuildError(request, userver::server::http::HttpStatus::kNotFound,
                                  "user not found");
            }

            Route route;
            route.id = g_next_route_id++;
            route.user_id = user_id;
            route.from_city = from_city;
            route.to_city = to_city;
            route.distance_km = distance_km;

            g_routes.push_back(route);

            request.GetHttpResponse().SetStatus(userver::server::http::HttpStatus::kCreated);
            SetJsonContentType(request);

            userver::formats::json::ValueBuilder response;
            response["route"] = BuildRouteJson(route);
            response["message"] = "route created successfully";

            return userver::formats::json::ToString(response.ExtractValue());
        } catch (const std::exception&) {
            return BuildError(request, userver::server::http::HttpStatus::kBadRequest,
                              "invalid request body");
        }
    }
};

class GetUserRoutesHandler final : public userver::server::handlers::HttpHandlerBase {
public:
    static constexpr std::string_view kName = "handler-user-routes";
    using HttpHandlerBase::HttpHandlerBase;

    std::string HandleRequestThrow(
        const userver::server::http::HttpRequest& request,
        userver::server::request::RequestContext&
    ) const override {
        try {
            const int user_id = std::stoi(std::string(request.GetPathArg("user_id")));

            std::lock_guard<std::mutex> lock(g_mutex);

            if (!UserExists(user_id)) {
                return BuildError(request, userver::server::http::HttpStatus::kNotFound,
                                  "user not found");
            }

            userver::formats::json::ValueBuilder response;
            auto routes = response["routes"];

            for (const auto& route : g_routes) {
                if (route.user_id == user_id) {
                    routes.PushBack(BuildRouteJson(route));
                }
            }

            SetJsonContentType(request);
            return userver::formats::json::ToString(response.ExtractValue());
        } catch (const std::exception&) {
            return BuildError(request, userver::server::http::HttpStatus::kBadRequest,
                              "invalid user_id");
        }
    }
};

class CreateTripHandler final : public userver::server::handlers::HttpHandlerBase {
public:
    static constexpr std::string_view kName = "handler-create-trip";
    using HttpHandlerBase::HttpHandlerBase;

    std::string HandleRequestThrow(
        const userver::server::http::HttpRequest& request,
        userver::server::request::RequestContext&
    ) const override {
                {
            std::lock_guard<std::mutex> lock(g_mutex);
            if (!IsAuthorized(request)) {
                return BuildError(
                    request,
                    userver::server::http::HttpStatus::kUnauthorized,
                    "authorization token is missing or invalid"
                );
            }
        }
        try {
            const auto body = userver::formats::json::FromString(request.RequestBody());

            const auto driver_id = body["driver_id"].As<int>();
            const auto route_id = body["route_id"].As<int>();
            const auto departure_time = body["departure_time"].As<std::string>();
            const auto available_seats = body["available_seats"].As<int>();
            const auto price = body["price"].As<int>();

            if (departure_time.empty() || available_seats <= 0 || price < 0) {
                return BuildError(request, userver::server::http::HttpStatus::kBadRequest,
                                  "departure_time, positive available_seats and non-negative price are required");
            }

            std::lock_guard<std::mutex> lock(g_mutex);

            if (!UserExists(driver_id)) {
                return BuildError(request, userver::server::http::HttpStatus::kNotFound,
                                  "driver not found");
            }

            if (!RouteExists(route_id)) {
                return BuildError(request, userver::server::http::HttpStatus::kNotFound,
                                  "route not found");
            }

            Trip trip;
            trip.id = g_next_trip_id++;
            trip.driver_id = driver_id;
            trip.route_id = route_id;
            trip.departure_time = departure_time;
            trip.available_seats = available_seats;
            trip.price = price;

            g_trips.push_back(trip);

            request.GetHttpResponse().SetStatus(userver::server::http::HttpStatus::kCreated);
            SetJsonContentType(request);

            userver::formats::json::ValueBuilder response;
            response["trip"] = BuildTripJson(trip);
            response["message"] = "trip created successfully";

            return userver::formats::json::ToString(response.ExtractValue());
        } catch (const std::exception&) {
            return BuildError(request, userver::server::http::HttpStatus::kBadRequest,
                              "invalid request body");
        }
    }
};

class JoinTripHandler final : public userver::server::handlers::HttpHandlerBase {
public:
    static constexpr std::string_view kName = "handler-join-trip";
    using HttpHandlerBase::HttpHandlerBase;

    std::string HandleRequestThrow(
        const userver::server::http::HttpRequest& request,
        userver::server::request::RequestContext&
    ) const override {
                {
            std::lock_guard<std::mutex> lock(g_mutex);
            if (!IsAuthorized(request)) {
                return BuildError(
                    request,
                    userver::server::http::HttpStatus::kUnauthorized,
                    "authorization token is missing or invalid"
                );
            }
        }
        try {
            const int trip_id = std::stoi(std::string(request.GetPathArg("trip_id")));
            const auto body = userver::formats::json::FromString(request.RequestBody());
            const auto user_id = body["user_id"].As<int>();

            std::lock_guard<std::mutex> lock(g_mutex);

            if (!UserExists(user_id)) {
                return BuildError(request, userver::server::http::HttpStatus::kNotFound,
                                  "user not found");
            }

            for (auto& trip : g_trips) {
                if (trip.id == trip_id) {
                    if (trip.driver_id == user_id) {
                        return BuildError(request, userver::server::http::HttpStatus::kBadRequest,
                                          "driver cannot join own trip as passenger");
                    }

                    const bool already_joined = std::find(
                        trip.passenger_ids.begin(),
                        trip.passenger_ids.end(),
                        user_id
                    ) != trip.passenger_ids.end();

                    if (already_joined) {
                        return BuildError(request, userver::server::http::HttpStatus::kConflict,
                                          "user already joined this trip");
                    }

                    if (trip.available_seats <= 0) {
                        return BuildError(request, userver::server::http::HttpStatus::kConflict,
                                          "no available seats");
                    }

                    trip.passenger_ids.push_back(user_id);
                    trip.available_seats--;

                    SetJsonContentType(request);

                    userver::formats::json::ValueBuilder response;
                    response["trip"] = BuildTripJson(trip);
                    response["message"] = "user joined trip successfully";

                    return userver::formats::json::ToString(response.ExtractValue());
                }
            }

            return BuildError(request, userver::server::http::HttpStatus::kNotFound,
                              "trip not found");
        } catch (const std::exception&) {
            return BuildError(request, userver::server::http::HttpStatus::kBadRequest,
                              "invalid request body or trip_id");
        }
    }
};

class GetTripHandler final : public userver::server::handlers::HttpHandlerBase {
public:
    static constexpr std::string_view kName = "handler-get-trip";
    using HttpHandlerBase::HttpHandlerBase;

    std::string HandleRequestThrow(
        const userver::server::http::HttpRequest& request,
        userver::server::request::RequestContext&
    ) const override {
        try {
            const int trip_id = std::stoi(std::string(request.GetPathArg("trip_id")));

            std::lock_guard<std::mutex> lock(g_mutex);

            for (const auto& trip : g_trips) {
                if (trip.id == trip_id) {
                    SetJsonContentType(request);

                    userver::formats::json::ValueBuilder response;
                    response["trip"] = BuildTripJson(trip);

                    return userver::formats::json::ToString(response.ExtractValue());
                }
            }

            return BuildError(request, userver::server::http::HttpStatus::kNotFound,
                              "trip not found");
        } catch (const std::exception&) {
            return BuildError(request, userver::server::http::HttpStatus::kBadRequest,
                              "invalid trip_id");
        }
    }
};

}  // namespace ridesharing

int main(int argc, char* argv[]) {
    auto component_list = userver::components::MinimalServerComponentList()
        .Append<ridesharing::PingHandler>()
        .Append<ridesharing::RegisterHandler>()
        .Append<ridesharing::LoginHandler>()
        .Append<ridesharing::GetUserByLoginHandler>()
        .Append<ridesharing::SearchUsersHandler>()
        .Append<ridesharing::CreateRouteHandler>()
        .Append<ridesharing::GetUserRoutesHandler>()
        .Append<ridesharing::CreateTripHandler>()
        .Append<ridesharing::JoinTripHandler>()
        .Append<ridesharing::GetTripHandler>();

    return userver::utils::DaemonMain(argc, argv, component_list);
}