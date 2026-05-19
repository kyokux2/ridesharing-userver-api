# Оптимизация запросов PostgreSQL

Проект: **RideSharing REST API**  
Вариант: **7 — Сервис поиска попутчиков**

## 1. Цель оптимизации

Целью данной части работы является анализ частых SQL-запросов сервиса поиска попутчиков, создание индексов и проверка планов выполнения запросов с помощью `EXPLAIN` и `EXPLAIN ANALYZE`.

Система содержит основные сущности:

- Пользователь
- Маршрут
- Поездка
- Связь поездки и пассажиров

Для хранения связи между пользователями и поездками используется отдельная таблица `trip_passengers`, так как один пользователь может участвовать в разных поездках, а одна поездка может иметь несколько пассажиров.

---

## 2. Созданные индексы

### 2.1 Индекс для поиска пользователя по login

Колонка `login` имеет ограничение `UNIQUE`.

```sql
login VARCHAR(50) NOT NULL UNIQUE

PostgreSQL автоматически создаёт индекс:

users_login_key

Он используется для быстрого поиска пользователя по логину.

Пример запроса:

SELECT id, login, first_name, last_name, created_at
FROM users
WHERE login = 'driver1';

План выполнения:

Index Scan using users_login_key on users
Index Cond: ((login)::text = 'driver1'::text)

Вывод: PostgreSQL использует индекс users_login_key, поэтому поиск по login выполняется без полного сканирования таблицы.

2.2 Индексы для поиска пользователей по имени и фамилии

Созданы индексы:

CREATE INDEX idx_users_first_name_lower
    ON users (lower(first_name));

CREATE INDEX idx_users_last_name_lower
    ON users (lower(last_name));

Они нужны для запросов поиска пользователей по маске имени и фамилии:

SELECT id, login, first_name, last_name, created_at
FROM users
WHERE lower(first_name) LIKE lower('Iv%')
  AND lower(last_name) LIKE lower('Pet%');

Такие индексы особенно полезны, если поиск выполняется часто и таблица пользователей становится большой.

2.3 Индекс для получения маршрутов пользователя

Создан индекс:

CREATE INDEX idx_routes_user_id
    ON routes (user_id);

Он используется для запроса:

SELECT id, user_id, from_city, to_city, distance_km, created_at
FROM routes
WHERE user_id = 1
ORDER BY created_at DESC;

План выполнения:

Sort
  Sort Key: created_at DESC
  -> Index Scan using idx_routes_user_id on routes
       Index Cond: (user_id = 1)

Вывод: PostgreSQL использует индекс idx_routes_user_id для быстрого поиска маршрутов конкретного пользователя.

2.4 Индексы для поиска маршрутов по городам

Созданы индексы:

CREATE INDEX idx_routes_from_city_lower
    ON routes (lower(from_city));

CREATE INDEX idx_routes_to_city_lower
    ON routes (lower(to_city));

Они нужны для частого сценария поиска поездок по направлению:

WHERE lower(r.from_city) = lower('Moscow')
  AND lower(r.to_city) = lower('Tver')

В результате EXPLAIN ANALYZE показал использование индекса:

Index Scan using idx_routes_to_city_lower on routes r
Index Cond: (lower((to_city)::text) = 'tver'::text)
Filter: (lower((from_city)::text) = 'moscow'::text)

Вывод: PostgreSQL применяет индекс по городу назначения, а затем фильтрует город отправления.

2.5 Индексы для таблицы trips

Созданы индексы:

CREATE INDEX idx_trips_driver_id
    ON trips (driver_id);

CREATE INDEX idx_trips_route_id
    ON trips (route_id);

CREATE INDEX idx_trips_status_departure_time
    ON trips (status, departure_time);

Они нужны для:

поиска поездок водителя;
соединения поездок с маршрутами;
поиска активных поездок по времени отправления.

Запрос активных поездок:

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

План выполнения:

Index Scan using idx_trips_status_departure_time on trips t
Index Cond: (((status)::text = 'ACTIVE'::text)
AND (departure_time >= '2026-05-20 00:00:00'::timestamp without time zone))

Вывод: составной индекс (status, departure_time) ускоряет поиск активных поездок за нужный период.

2.6 Индексы для таблицы trip_passengers

Созданы индексы:

CREATE INDEX idx_trip_passengers_trip_id
    ON trip_passengers (trip_id);

CREATE INDEX idx_trip_passengers_user_id
    ON trip_passengers (user_id);

Они нужны для:

получения пассажиров поездки;
получения всех поездок пользователя как пассажира.

Фрагмент плана выполнения запроса информации о поездке:

Bitmap Index Scan on idx_trip_passengers_trip_id
Index Cond: (trip_id = 1)

Вывод: PostgreSQL использует индекс idx_trip_passengers_trip_id, чтобы быстро найти всех пассажиров конкретной поездки.

3. Анализ запроса получения информации о поездке

Запрос:

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

План выполнения показывает:

Index Scan using trips_pkey on trips t
Index Cond: (id = 1)

Index Scan using users_pkey on users driver
Index Cond: (id = t.driver_id)

Index Scan using routes_pkey on routes r
Index Cond: (id = t.route_id)

Bitmap Index Scan on idx_trip_passengers_trip_id
Index Cond: (trip_id = 1)

Вывод: запрос оптимизирован хорошо, потому что PostgreSQL использует первичные ключи и индекс по trip_id для таблицы пассажиров.

4. EXPLAIN ANALYZE активных поездок

Для запроса активных поездок PostgreSQL показал:

Planning Time: 0.094 ms
Execution Time: 0.038 ms

Это означает, что запрос выполняется быстро на тестовом наборе данных.

Использованные индексы:

idx_trips_status_departure_time
idx_routes_to_city_lower

Вывод: индексы выбраны корректно для частого сценария поиска поездок по статусу, времени и направлению.

5. Сравнение до и после оптимизации
До оптимизации

Без индексов PostgreSQL был бы вынужден чаще использовать:

Seq Scan

Это означает полное сканирование таблицы. Такой подход становится медленным при росте количества пользователей, маршрутов и поездок.

После оптимизации

После добавления индексов в планах выполнения появились:

Index Scan
Bitmap Index Scan

Это означает, что PostgreSQL использует структуры индексов и не просматривает все строки таблиц.