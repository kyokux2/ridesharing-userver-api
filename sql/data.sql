
-- USERS: 10 records


INSERT INTO users (login, password_hash, first_name, last_name) VALUES
('driver1', 'hash_123456', 'Ivan', 'Petrov'),
('driver2', 'hash_123456', 'Sergey', 'Ivanov'),
('driver3', 'hash_123456', 'Alexey', 'Sidorov'),
('passenger1', 'hash_123456', 'Anna', 'Smirnova'),
('passenger2', 'hash_123456', 'Maria', 'Kuznetsova'),
('passenger3', 'hash_123456', 'Dmitry', 'Volkov'),
('passenger4', 'hash_123456', 'Olga', 'Sokolova'),
('passenger5', 'hash_123456', 'Nikolay', 'Morozov'),
('passenger6', 'hash_123456', 'Elena', 'Fedorova'),
('passenger7', 'hash_123456', 'Pavel', 'Lebedev');


-- ROUTES: 10 records


INSERT INTO routes (user_id, from_city, to_city, distance_km) VALUES
(1, 'Moscow', 'Tver', 180),
(1, 'Moscow', 'Vladimir', 190),
(2, 'Saint Petersburg', 'Novgorod', 200),
(2, 'Moscow', 'Kaluga', 180),
(3, 'Kazan', 'Naberezhnye Chelny', 240),
(3, 'Moscow', 'Ryazan', 200),
(1, 'Tula', 'Moscow', 195),
(2, 'Yaroslavl', 'Moscow', 270),
(3, 'Voronezh', 'Moscow', 520),
(1, 'Moscow', 'Smolensk', 400);


-- TRIPS: 10 records


INSERT INTO trips (driver_id, route_id, departure_time, available_seats, price, status) VALUES
(1, 1, '2026-05-20 10:00:00', 3, 1200.00, 'ACTIVE'),
(1, 2, '2026-05-21 09:30:00', 2, 1500.00, 'ACTIVE'),
(2, 3, '2026-05-22 08:00:00', 4, 1300.00, 'ACTIVE'),
(2, 4, '2026-05-23 12:00:00', 1, 900.00, 'ACTIVE'),
(3, 5, '2026-05-24 15:30:00', 3, 1700.00, 'ACTIVE'),
(3, 6, '2026-05-25 07:45:00', 2, 1100.00, 'ACTIVE'),
(1, 7, '2026-05-26 18:00:00', 3, 1000.00, 'ACTIVE'),
(2, 8, '2026-05-27 11:15:00', 2, 1600.00, 'ACTIVE'),
(3, 9, '2026-05-28 06:30:00', 4, 2500.00, 'ACTIVE'),
(1, 10, '2026-05-29 14:00:00', 1, 2200.00, 'ACTIVE');

-- TRIP_PASSENGERS: 10 records


INSERT INTO trip_passengers (trip_id, user_id) VALUES
(1, 4),
(1, 5),
(2, 6),
(3, 7),
(3, 8),
(4, 9),
(5, 10),
(6, 4),
(7, 5),
(8, 6);