

db = db.getSiblingDB("ridesharing_mongo_db");


// 1. Create validation for users collection


db.runCommand({
  collMod: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "login",
        "password_hash",
        "first_name",
        "last_name",
        "role",
        "rating",
        "phone",
        "created_at"
      ],
      properties: {
        login: {
          bsonType: "string",
          description: "login must be a string and is required",
          pattern: "^[a-zA-Z0-9_]{3,50}$"
        },
        password_hash: {
          bsonType: "string",
          description: "password_hash must be a string and is required",
          minLength: 6
        },
        first_name: {
          bsonType: "string",
          description: "first_name must be a string and is required",
          minLength: 1,
          maxLength: 100
        },
        last_name: {
          bsonType: "string",
          description: "last_name must be a string and is required",
          minLength: 1,
          maxLength: 100
        },
        role: {
          enum: ["DRIVER", "PASSENGER"],
          description: "role must be either DRIVER or PASSENGER"
        },
        rating: {
          bsonType: ["double", "int"],
          minimum: 0,
          maximum: 5,
          description: "rating must be a number between 0 and 5"
        },
        phone: {
          bsonType: "string",
          description: "phone must be a string and is required",
          pattern: "^\\+?[0-9]{10,15}$"
        },
        created_at: {
          bsonType: "date",
          description: "created_at must be a date and is required"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

print("Validation schema for users collection has been applied.");


// 2. Valid document test


print("Trying to insert a valid user...");

db.users.insertOne({
  login: "valid_user",
  password_hash: "hash_123456",
  first_name: "Valid",
  last_name: "User",
  role: "PASSENGER",
  rating: 4.5,
  phone: "+79990000111",
  created_at: new Date()
});

print("Valid user inserted successfully.");


// 3. Invalid document test
// This insert should fail because:
// - login is too short
// - role is invalid
// - rating is greater than 5
// - phone has invalid format
// - created_at is missing


print("Trying to insert an invalid user. This operation should fail...");

try {
  db.users.insertOne({
    login: "ab",
    password_hash: "123",
    first_name: "",
    last_name: "Invalid",
    role: "ADMIN",
    rating: 9,
    phone: "bad-phone"
  });

  print("ERROR: invalid user was inserted, validation did not work.");
} catch (e) {
  print("Validation works correctly. Invalid user was rejected.");
  print(e.message);
}


// 4. Clean valid test user


db.users.deleteOne({
  login: "valid_user"
});

print("Validation test finished.");