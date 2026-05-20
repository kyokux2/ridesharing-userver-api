

db = db.getSiblingDB("ridesharing_mongo_db");

// Clean previous data
db.users.drop();
db.routes.drop();
db.trips.drop();


// Indexes


db.users.createIndex({ login: 1 }, { unique: true });
db.users.createIndex({ first_name: 1, last_name: 1 });

db.routes.createIndex({ user_id: 1 });
db.routes.createIndex({ from_city: 1, to_city: 1 });

db.trips.createIndex({ driver_id: 1 });
db.trips.createIndex({ route_id: 1 });
db.trips.createIndex({ status: 1, departure_time: 1 });
db.trips.createIndex({ "passengers.user_id": 1 });


// USERS: 10 documents


const users = [
  {
    _id: ObjectId("665000000000000000000001"),
    login: "driver1",
    password_hash: "hash_123456",
    first_name: "Ivan",
    last_name: "Petrov",
    role: "DRIVER",
    rating: 4.8,
    phone: "+79990000001",
    created_at: ISODate("2026-05-20T10:00:00Z")
  },
  {
    _id: ObjectId("665000000000000000000002"),
    login: "driver2",
    password_hash: "hash_123456",
    first_name: "Sergey",
    last_name: "Ivanov",
    role: "DRIVER",
    rating: 4.7,
    phone: "+79990000002",
    created_at: ISODate("2026-05-20T10:05:00Z")
  },
  {
    _id: ObjectId("665000000000000000000003"),
    login: "driver3",
    password_hash: "hash_123456",
    first_name: "Alexey",
    last_name: "Sidorov",
    role: "DRIVER",
    rating: 4.6,
    phone: "+79990000003",
    created_at: ISODate("2026-05-20T10:10:00Z")
  },
  {
    _id: ObjectId("665000000000000000000004"),
    login: "passenger1",
    password_hash: "hash_123456",
    first_name: "Anna",
    last_name: "Smirnova",
    role: "PASSENGER",
    rating: 4.9,
    phone: "+79990000004",
    created_at: ISODate("2026-05-20T10:15:00Z")
  },
  {
    _id: ObjectId("665000000000000000000005"),
    login: "passenger2",
    password_hash: "hash_123456",
    first_name: "Maria",
    last_name: "Kuznetsova",
    role: "PASSENGER",
    rating: 4.5,
    phone: "+79990000005",
    created_at: ISODate("2026-05-20T10:20:00Z")
  },
  {
    _id: ObjectId("665000000000000000000006"),
    login: "passenger3",
    password_hash: "hash_123456",
    first_name: "Dmitry",
    last_name: "Volkov",
    role: "PASSENGER",
    rating: 4.4,
    phone: "+79990000006",
    created_at: ISODate("2026-05-20T10:25:00Z")
  },
  {
    _id: ObjectId("665000000000000000000007"),
    login: "passenger4",
    password_hash: "hash_123456",
    first_name: "Olga",
    last_name: "Sokolova",
    role: "PASSENGER",
    rating: 4.3,
    phone: "+79990000007",
    created_at: ISODate("2026-05-20T10:30:00Z")
  },
  {
    _id: ObjectId("665000000000000000000008"),
    login: "passenger5",
    password_hash: "hash_123456",
    first_name: "Nikolay",
    last_name: "Morozov",
    role: "PASSENGER",
    rating: 4.2,
    phone: "+79990000008",
    created_at: ISODate("2026-05-20T10:35:00Z")
  },
  {
    _id: ObjectId("665000000000000000000009"),
    login: "passenger6",
    password_hash: "hash_123456",
    first_name: "Elena",
    last_name: "Fedorova",
    role: "PASSENGER",
    rating: 4.1,
    phone: "+79990000009",
    created_at: ISODate("2026-05-20T10:40:00Z")
  },
  {
    _id: ObjectId("665000000000000000000010"),
    login: "passenger7",
    password_hash: "hash_123456",
    first_name: "Pavel",
    last_name: "Lebedev",
    role: "PASSENGER",
    rating: 4.0,
    phone: "+79990000010",
    created_at: ISODate("2026-05-20T10:45:00Z")
  }
];

db.users.insertMany(users);

// ============================================================
// ROUTES: 10 documents
// ============================================================

const routes = [
  {
    _id: ObjectId("666000000000000000000001"),
    user_id: ObjectId("665000000000000000000001"),
    from_city: "Moscow",
    to_city: "Tver",
    distance_km: 180,
    tags: ["intercity", "popular"],
    created_at: ISODate("2026-05-21T10:00:00Z")
  },
  {
    _id: ObjectId("666000000000000000000002"),
    user_id: ObjectId("665000000000000000000001"),
    from_city: "Moscow",
    to_city: "Vladimir",
    distance_km: 190,
    tags: ["intercity"],
    created_at: ISODate("2026-05-21T10:10:00Z")
  },
  {
    _id: ObjectId("666000000000000000000003"),
    user_id: ObjectId("665000000000000000000002"),
    from_city: "Saint Petersburg",
    to_city: "Novgorod",
    distance_km: 200,
    tags: ["weekend"],
    created_at: ISODate("2026-05-21T10:20:00Z")
  },
  {
    _id: ObjectId("666000000000000000000004"),
    user_id: ObjectId("665000000000000000000002"),
    from_city: "Moscow",
    to_city: "Kaluga",
    distance_km: 180,
    tags: ["business"],
    created_at: ISODate("2026-05-21T10:30:00Z")
  },
  {
    _id: ObjectId("666000000000000000000005"),
    user_id: ObjectId("665000000000000000000003"),
    from_city: "Kazan",
    to_city: "Naberezhnye Chelny",
    distance_km: 240,
    tags: ["regional"],
    created_at: ISODate("2026-05-21T10:40:00Z")
  },
  {
    _id: ObjectId("666000000000000000000006"),
    user_id: ObjectId("665000000000000000000003"),
    from_city: "Moscow",
    to_city: "Ryazan",
    distance_km: 200,
    tags: ["intercity"],
    created_at: ISODate("2026-05-21T10:50:00Z")
  },
  {
    _id: ObjectId("666000000000000000000007"),
    user_id: ObjectId("665000000000000000000001"),
    from_city: "Tula",
    to_city: "Moscow",
    distance_km: 195,
    tags: ["return"],
    created_at: ISODate("2026-05-21T11:00:00Z")
  },
  {
    _id: ObjectId("666000000000000000000008"),
    user_id: ObjectId("665000000000000000000002"),
    from_city: "Yaroslavl",
    to_city: "Moscow",
    distance_km: 270,
    tags: ["morning"],
    created_at: ISODate("2026-05-21T11:10:00Z")
  },
  {
    _id: ObjectId("666000000000000000000009"),
    user_id: ObjectId("665000000000000000000003"),
    from_city: "Voronezh",
    to_city: "Moscow",
    distance_km: 520,
    tags: ["long-distance"],
    created_at: ISODate("2026-05-21T11:20:00Z")
  },
  {
    _id: ObjectId("666000000000000000000010"),
    user_id: ObjectId("665000000000000000000001"),
    from_city: "Moscow",
    to_city: "Smolensk",
    distance_km: 400,
    tags: ["long-distance"],
    created_at: ISODate("2026-05-21T11:30:00Z")
  }
];

db.routes.insertMany(routes);


// TRIPS: 10 documents
// Passengers are embedded documents


const trips = [
  {
    _id: ObjectId("667000000000000000000001"),
    driver_id: ObjectId("665000000000000000000001"),
    route_id: ObjectId("666000000000000000000001"),
    departure_time: ISODate("2026-05-25T10:00:00Z"),
    available_seats: 2,
    price: 1200,
    status: "ACTIVE",
    passengers: [
      {
        user_id: ObjectId("665000000000000000000004"),
        joined_at: ISODate("2026-05-22T12:00:00Z")
      }
    ],
    created_at: ISODate("2026-05-22T10:00:00Z")
  },
  {
    _id: ObjectId("667000000000000000000002"),
    driver_id: ObjectId("665000000000000000000001"),
    route_id: ObjectId("666000000000000000000002"),
    departure_time: ISODate("2026-05-26T09:30:00Z"),
    available_seats: 2,
    price: 1500,
    status: "ACTIVE",
    passengers: [
      {
        user_id: ObjectId("665000000000000000000005"),
        joined_at: ISODate("2026-05-22T12:10:00Z")
      }
    ],
    created_at: ISODate("2026-05-22T10:10:00Z")
  },
  {
    _id: ObjectId("667000000000000000000003"),
    driver_id: ObjectId("665000000000000000000002"),
    route_id: ObjectId("666000000000000000000003"),
    departure_time: ISODate("2026-05-27T08:00:00Z"),
    available_seats: 3,
    price: 1300,
    status: "ACTIVE",
    passengers: [
      {
        user_id: ObjectId("665000000000000000000006"),
        joined_at: ISODate("2026-05-22T12:20:00Z")
      }
    ],
    created_at: ISODate("2026-05-22T10:20:00Z")
  },
  {
    _id: ObjectId("667000000000000000000004"),
    driver_id: ObjectId("665000000000000000000002"),
    route_id: ObjectId("666000000000000000000004"),
    departure_time: ISODate("2026-05-28T12:00:00Z"),
    available_seats: 1,
    price: 900,
    status: "ACTIVE",
    passengers: [
      {
        user_id: ObjectId("665000000000000000000007"),
        joined_at: ISODate("2026-05-22T12:30:00Z")
      }
    ],
    created_at: ISODate("2026-05-22T10:30:00Z")
  },
  {
    _id: ObjectId("667000000000000000000005"),
    driver_id: ObjectId("665000000000000000000003"),
    route_id: ObjectId("666000000000000000000005"),
    departure_time: ISODate("2026-05-29T15:30:00Z"),
    available_seats: 2,
    price: 1700,
    status: "ACTIVE",
    passengers: [
      {
        user_id: ObjectId("665000000000000000000008"),
        joined_at: ISODate("2026-05-22T12:40:00Z")
      }
    ],
    created_at: ISODate("2026-05-22T10:40:00Z")
  },
  {
    _id: ObjectId("667000000000000000000006"),
    driver_id: ObjectId("665000000000000000000003"),
    route_id: ObjectId("666000000000000000000006"),
    departure_time: ISODate("2026-05-30T07:45:00Z"),
    available_seats: 1,
    price: 1100,
    status: "ACTIVE",
    passengers: [
      {
        user_id: ObjectId("665000000000000000000009"),
        joined_at: ISODate("2026-05-22T12:50:00Z")
      }
    ],
    created_at: ISODate("2026-05-22T10:50:00Z")
  },
  {
    _id: ObjectId("667000000000000000000007"),
    driver_id: ObjectId("665000000000000000000001"),
    route_id: ObjectId("666000000000000000000007"),
    departure_time: ISODate("2026-05-31T18:00:00Z"),
    available_seats: 2,
    price: 1000,
    status: "ACTIVE",
    passengers: [
      {
        user_id: ObjectId("665000000000000000000010"),
        joined_at: ISODate("2026-05-22T13:00:00Z")
      }
    ],
    created_at: ISODate("2026-05-22T11:00:00Z")
  },
  {
    _id: ObjectId("667000000000000000000008"),
    driver_id: ObjectId("665000000000000000000002"),
    route_id: ObjectId("666000000000000000000008"),
    departure_time: ISODate("2026-06-01T11:15:00Z"),
    available_seats: 2,
    price: 1600,
    status: "ACTIVE",
    passengers: [],
    created_at: ISODate("2026-05-22T11:10:00Z")
  },
  {
    _id: ObjectId("667000000000000000000009"),
    driver_id: ObjectId("665000000000000000000003"),
    route_id: ObjectId("666000000000000000000009"),
    departure_time: ISODate("2026-06-02T06:30:00Z"),
    available_seats: 4,
    price: 2500,
    status: "ACTIVE",
    passengers: [],
    created_at: ISODate("2026-05-22T11:20:00Z")
  },
  {
    _id: ObjectId("667000000000000000000010"),
    driver_id: ObjectId("665000000000000000000001"),
    route_id: ObjectId("666000000000000000000010"),
    departure_time: ISODate("2026-06-03T14:00:00Z"),
    available_seats: 1,
    price: 2200,
    status: "ACTIVE",
    passengers: [],
    created_at: ISODate("2026-05-22T11:30:00Z")
  }
];

db.trips.insertMany(trips);


// Check counts


print("Users count: " + db.users.countDocuments());
print("Routes count: " + db.routes.countDocuments());
print("Trips count: " + db.trips.countDocuments());