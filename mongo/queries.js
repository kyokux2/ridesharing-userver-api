
db = db.getSiblingDB("ridesharing_mongo_db");


// 1. CREATE


db.users.insertOne({
  login: "new_user",
  password_hash: "hash_123456",
  first_name: "New",
  last_name: "User",
  role: "PASSENGER",
  rating: 4.2,
  phone: "+79990000099",
  created_at: new Date()
});


// 2. READ: Поиск пользователя по login



db.users.findOne({
  login: { $eq: "driver1" }
});


// 3. READ
// Uses regular expressions


db.users.find({
  first_name: { $regex: "^Iv", $options: "i" },
  last_name: { $regex: "^Pet", $options: "i" }
});


// 4. READ: Поиск пользователей с рейтингом больше 4.5



db.users.find({
  rating: { $gt: 4.5 }
});


// 5. READ: Поиск пользователей с рейтингом меньше 4.5



db.users.find({
  rating: { $lt: 4.5 }
});


// 6. READ: Поиск пользователей, кроме роли DRIVER


db.users.find({
  role: { $ne: "DRIVER" }
});


// 7. READ: Поиск пользователей по списку login


db.users.find({
  login: { $in: ["driver1", "passenger1", "passenger2"] }
});


// 8. READ: Поиск пользователей через $and


db.users.find({
  $and: [
    { role: "PASSENGER" },
    { rating: { $gte: 4.5 } }
  ]
});


// 9. READ: Поиск пользователей через $or


db.users.find({
  $or: [
    { first_name: "Ivan" },
    { last_name: "Smirnova" }
  ]
});

// 10. CREATE: Создание маршрута


db.routes.insertOne({
  user_id: ObjectId("665000000000000000000001"),
  from_city: "Moscow",
  to_city: "Klin",
  distance_km: 90,
  tags: ["short-distance", "business"],
  created_at: new Date()
});


// 11. READ: Получение маршрутов пользователя


db.routes.find({
  user_id: ObjectId("665000000000000000000001")
}).sort({
  created_at: -1
});


// 12. READ: Поиск маршрутов по направлению


db.routes.find({
  $and: [
    { from_city: "Moscow" },
    { to_city: "Tver" }
  ]
});


// 13. READ: Поиск маршрутов по расстоянию



db.routes.find({
  distance_km: {
    $gt: 100,
    $lt: 250
  }
});


// 14. UPDATE: Добавить тег маршруту


db.routes.updateOne(
  { _id: ObjectId("666000000000000000000001") },
  {
    $addToSet: {
      tags: "verified"
    }
  }
);


// 15. UPDATE: Изменить расстояние маршрута


db.routes.updateOne(
  { _id: ObjectId("666000000000000000000001") },
  {
    $set: {
      distance_km: 185
    }
  }
);


// 16. CREATE: Создание поездки


db.trips.insertOne({
  driver_id: ObjectId("665000000000000000000001"),
  route_id: ObjectId("666000000000000000000001"),
  departure_time: ISODate("2026-06-10T10:00:00Z"),
  available_seats: 3,
  price: 1300,
  status: "ACTIVE",
  passengers: [],
  created_at: new Date()
});


// 17. UPDATE: Подключение пользователя к поездке
// Array operator: $addToSet


db.trips.updateOne(
  {
    _id: ObjectId("667000000000000000000001"),
    available_seats: { $gt: 0 },
    "passengers.user_id": { $ne: ObjectId("665000000000000000000005") }
  },
  {
    $addToSet: {
      passengers: {
        user_id: ObjectId("665000000000000000000005"),
        joined_at: new Date()
      }
    },
    $inc: {
      available_seats: -1
    }
  }
);


// 18. UPDATE: Альтернативное подключение пользователя через $push


db.trips.updateOne(
  {
    _id: ObjectId("667000000000000000000002"),
    available_seats: { $gt: 0 }
  },
  {
    $push: {
      passengers: {
        user_id: ObjectId("665000000000000000000006"),
        joined_at: new Date()
      }
    },
    $inc: {
      available_seats: -1
    }
  }
);


// 19. UPDATE: Удаление пассажира из поездки


db.trips.updateOne(
  { _id: ObjectId("667000000000000000000002") },
  {
    $pull: {
      passengers: {
        user_id: ObjectId("665000000000000000000006")
      }
    },
    $inc: {
      available_seats: 1
    }
  }
);


// 20. READ: Получение информации о поездке


db.trips.findOne({
  _id: ObjectId("667000000000000000000001")
});


// 21. READ: Поиск активных поездок


db.trips.find({
  status: "ACTIVE",
  departure_time: {
    $gte: ISODate("2026-05-25T00:00:00Z")
  }
}).sort({
  departure_time: 1
});


// 22. READ: Поиск поездок с доступными местами


db.trips.find({
  available_seats: { $gt: 0 }
});


// 23. READ: Поиск поездок, где пользователь является пассажиром
// Embedded array query


db.trips.find({
  "passengers.user_id": ObjectId("665000000000000000000004")
});


// 24. UPDATE: Отмена поездки


db.trips.updateOne(
  { _id: ObjectId("667000000000000000000003") },
  {
    $set: {
      status: "CANCELLED"
    }
  }
);


// 25. DELETE: Удаление маршрута

db.routes.deleteOne({
  from_city: "Moscow",
  to_city: "Klin"
});


// 26. DELETE: Удаление тестового пользователя


db.users.deleteOne({
  login: "new_user"
});


// 27. AGGREGATION: Статистика поездок по водителям
// Optional aggregation pipeline


db.trips.aggregate([
  {
    $match: {
      status: "ACTIVE"
    }
  },
  {
    $group: {
      _id: "$driver_id",
      total_trips: { $sum: 1 },
      average_price: { $avg: "$price" },
      total_available_seats: { $sum: "$available_seats" }
    }
  },
  {
    $sort: {
      total_trips: -1
    }
  },
  {
    $project: {
      _id: 0,
      driver_id: "$_id",
      total_trips: 1,
      average_price: 1,
      total_available_seats: 1
    }
  }
]);


// 28. AGGREGATION: Информация о поездке с маршрутом через $lookup


db.trips.aggregate([
  {
    $match: {
      _id: ObjectId("667000000000000000000001")
    }
  },
  {
    $lookup: {
      from: "routes",
      localField: "route_id",
      foreignField: "_id",
      as: "route"
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "driver_id",
      foreignField: "_id",
      as: "driver"
    }
  },
  {
    $project: {
      _id: 1,
      departure_time: 1,
      available_seats: 1,
      price: 1,
      status: 1,
      passengers: 1,
      route: { $arrayElemAt: ["$route", 0] },
      driver: { $arrayElemAt: ["$driver", 0] }
    }
  }
]);