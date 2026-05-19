
-- PostgreSQL schema for users, routes, trips and passengers


DROP TABLE IF EXISTS trip_passengers;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS users;


-- USERS

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_login_not_empty CHECK (length(trim(login)) > 0),
    CONSTRAINT users_first_name_not_empty CHECK (length(trim(first_name)) > 0),
    CONSTRAINT users_last_name_not_empty CHECK (length(trim(last_name)) > 0)
);


-- ROUTES



CREATE TABLE routes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    from_city VARCHAR(100) NOT NULL,
    to_city VARCHAR(100) NOT NULL,
    distance_km INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_routes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT routes_from_city_not_empty CHECK (length(trim(from_city)) > 0),
    CONSTRAINT routes_to_city_not_empty CHECK (length(trim(to_city)) > 0),
    CONSTRAINT routes_distance_positive CHECK (distance_km > 0),
    CONSTRAINT routes_different_cities CHECK (lower(from_city) <> lower(to_city))
);


-- TRIPS


CREATE TABLE trips (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL,
    route_id BIGINT NOT NULL,
    departure_time TIMESTAMP NOT NULL,
    available_seats INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_trips_driver
        FOREIGN KEY (driver_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_trips_route
        FOREIGN KEY (route_id)
        REFERENCES routes(id)
        ON DELETE CASCADE,

    CONSTRAINT trips_available_seats_non_negative CHECK (available_seats >= 0),
    CONSTRAINT trips_price_non_negative CHECK (price >= 0),
    CONSTRAINT trips_status_valid CHECK (status IN ('ACTIVE', 'CANCELLED', 'COMPLETED'))
);


-- TRIP_PASSENGERS
-- Many-to-many: user can join many trips, trip can have many passengers

CREATE TABLE trip_passengers (
    trip_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (trip_id, user_id),

    CONSTRAINT fk_trip_passengers_trip
        FOREIGN KEY (trip_id)
        REFERENCES trips(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_trip_passengers_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- INDEXES


-- 1. Search user by login.
-- UNIQUE automatically creates an index, but this line documents the optimization.
-- users.login already has UNIQUE index.

-- 2. Search users by first_name and last_name masks.
CREATE INDEX idx_users_first_name_lower
    ON users (lower(first_name));

CREATE INDEX idx_users_last_name_lower
    ON users (lower(last_name));

-- 3. Get routes by user_id.
CREATE INDEX idx_routes_user_id
    ON routes (user_id);

-- 4. Search routes by cities.
CREATE INDEX idx_routes_from_city_lower
    ON routes (lower(from_city));

CREATE INDEX idx_routes_to_city_lower
    ON routes (lower(to_city));

-- 5. Get trips by driver_id.
CREATE INDEX idx_trips_driver_id
    ON trips (driver_id);

-- 6. Join trips with routes.
CREATE INDEX idx_trips_route_id
    ON trips (route_id);

-- 7. Search active trips by departure time.
CREATE INDEX idx_trips_status_departure_time
    ON trips (status, departure_time);

-- 8. Get passengers by trip_id.
CREATE INDEX idx_trip_passengers_trip_id
    ON trip_passengers (trip_id);

-- 9. Get trips joined by user_id.
CREATE INDEX idx_trip_passengers_user_id
    ON trip_passengers (user_id);