#!/bin/bash

BASE_URL="http://localhost:8080"

echo "1. Health check"
curl -s "$BASE_URL/ping"
echo -e "\n"

echo "2. Register driver"
curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"login":"driver","password":"123456","first_name":"Ivan","last_name":"Petrov"}'
echo -e "\n"

echo "3. Register passenger"
curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"login":"passenger","password":"123456","first_name":"Anna","last_name":"Smirnova"}'
echo -e "\n"

echo "4. Login driver"
curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"login":"driver","password":"123456"}'
echo -e "\n"

echo "5. Search user by login"
curl -s "$BASE_URL/api/v1/users/by-login/driver"
echo -e "\n"

echo "6. Search users by name mask"
curl -s "$BASE_URL/api/v1/users/search?first_name=Iv&last_name=Pet"
echo -e "\n"

echo "7. Try create route without token, should return 401"
curl -s -X POST "$BASE_URL/api/v1/routes" \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"from_city":"Moscow","to_city":"Tver","distance_km":180}'
echo -e "\n"

echo "8. Create route with token"
curl -s -X POST "$BASE_URL/api/v1/routes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token-1-driver" \
  -d '{"user_id":1,"from_city":"Moscow","to_city":"Tver","distance_km":180}'
echo -e "\n"

echo "9. Get user routes"
curl -s "$BASE_URL/api/v1/users/1/routes"
echo -e "\n"

echo "10. Create trip"
curl -s -X POST "$BASE_URL/api/v1/trips" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token-1-driver" \
  -d '{"driver_id":1,"route_id":1,"departure_time":"2026-05-20T10:00:00","available_seats":3,"price":1200}'
echo -e "\n"

echo "11. Join trip"
curl -s -X POST "$BASE_URL/api/v1/trips/1/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token-2-passenger" \
  -d '{"user_id":2}'
echo -e "\n"

echo "12. Get trip"
curl -s "$BASE_URL/api/v1/trips/1"
echo -e "\n"