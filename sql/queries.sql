
-- Create new user


INSERT INTO users (login, password_hash, first_name, last_name)
VALUES ('new_user', 'hash_123456', 'New', 'User')
RETURNING id, login, first_name, last_name, created_at;


-- Search user by login
-- Uses UNIQUE index on users.login


SELECT id, login, first_name, last_name, created_at
FROM users
WHERE login = 'driver1';


-- Search user by first_name and last_name masks


SELECT id, login, first_name, last_name, created_at
FROM users
WHERE lower(first_name) LIKE lower('Iv%')
  AND lower(last_name) LIKE lower('Pet%');


-- Create route


INSERT INTO routes (user_id, from_city, to_city, distance_km)
VALUES (1, 'Moscow', 'Tver', 180)
RETURNING id, user_id, from_city, to_city, distance_km, created_at;



-- Get routes by user
-- Uses index idx_routes_user_id


SELECT id, user_id, from_city, to_city, distance_km, created_at
FROM routes
WHERE user_id = 1
ORDER BY created_at DESC;



-- Create trip

INSERT INTO trips (
    driver_id,
    route_id,
    departure_time,
    available_seats,
    price,
    status
)
VALUES (
    1,
    1,
    '2026-06-01 10:00:00',
    3,
    1200.00,
    'ACTIVE'
)
RETURNING id, driver_id, route_id, departure_time, available_seats, price, status;



-- Join user to trip
-- Transaction is used to keep data consistent


BEGIN;

INSERT INTO trip_passengers (trip_id, user_id)
VALUES (1, 6);

UPDATE trips
SET available_seats = available_seats - 1
WHERE id = 1
  AND available_seats > 0;

COMMIT;



-- Get trip information
-- Uses joins between trips, routes, users, trip_passengers


SELECT
    t.id AS trip_id,
    t.departure_time,
    t.available_seats,
    t.price,
    t.status,

    driver.id AS driver_id,
    driver.login AS driver_login,
    driver.first_name AS driver_first_name,
    driver.last_name AS driver_last_name,

    r.id AS route_id,
    r.from_city,
    r.to_city,
    r.distance_km,

    passenger.id AS passenger_id,
    passenger.login AS passenger_login,
    passenger.first_name AS passenger_first_name,
    passenger.last_name AS passenger_last_name

FROM trips t
JOIN users driver
    ON driver.id = t.driver_id
JOIN routes r
    ON r.id = t.route_id
LEFT JOIN trip_passengers tp
    ON tp.trip_id = t.id
LEFT JOIN users passenger
    ON passenger.id = tp.user_id
WHERE t.id = 1;



-- Additional frequent query for optimization


SELECT
    t.id,
    r.from_city,
    r.to_city,
    t.departure_time,
    t.available_seats,
    t.price
FROM trips t
JOIN routes r
    ON r.id = t.route_id
WHERE t.status = 'ACTIVE'
  AND t.departure_time >= '2026-05-20 00:00:00'
  AND lower(r.from_city) = lower('Moscow')
  AND lower(r.to_city) = lower('Tver')
ORDER BY t.departure_time ASC;



-- Get all trips joined by user


SELECT
    t.id AS trip_id,
    r.from_city,
    r.to_city,
    t.departure_time,
    t.price,
    t.status
FROM trip_passengers tp
JOIN trips t
    ON t.id = tp.trip_id
JOIN routes r
    ON r.id = t.route_id
WHERE tp.user_id = 4
ORDER BY t.departure_time DESC;



--EXPLAIN: search user by login


EXPLAIN
SELECT id, login, first_name, last_name, created_at
FROM users
WHERE login = 'driver1';



--EXPLAIN: get user routes


EXPLAIN
SELECT id, user_id, from_city, to_city, distance_km, created_at
FROM routes
WHERE user_id = 1
ORDER BY created_at DESC;



-- EXPLAIN: get trip information


EXPLAIN
SELECT
    t.id AS trip_id,
    t.departure_time,
    t.available_seats,
    t.price,
    t.status,
    driver.login AS driver_login,
    r.from_city,
    r.to_city,
    passenger.login AS passenger_login
FROM trips t
JOIN users driver
    ON driver.id = t.driver_id
JOIN routes r
    ON r.id = t.route_id
LEFT JOIN trip_passengers tp
    ON tp.trip_id = t.id
LEFT JOIN users passenger
    ON passenger.id = tp.user_id
WHERE t.id = 1;



--EXPLAIN ANALYZE: active trips search

EXPLAIN ANALYZE
SELECT
    t.id,
    r.from_city,
    r.to_city,
    t.departure_time,
    t.available_seats,
    t.price
FROM trips t
JOIN routes r
    ON r.id = t.route_id
WHERE t.status = 'ACTIVE'
  AND t.departure_time >= '2026-05-20 00:00:00'
  AND lower(r.from_city) = lower('Moscow')
  AND lower(r.to_city) = lower('Tver')
ORDER BY t.departure_time ASC;