# RideSharing REST API

REST API сервис поиска попутчиков, разработанный в рамках домашнего задания №2 по курсу **«Архитектура программных систем»**.

Проект реализован на **C++** с использованием **Yandex Userver**.  
В качестве хранилища данных используется in-memory storage.

## Вариант задания

**Вариант 7 — Сервис поиска попутчиков**

Приложение содержит следующие сущности:

- Пользователь
- Маршрут
- Поездка

Реализованные операции:

- Создание нового пользователя
- Поиск пользователя по login
- Поиск пользователя по маске имени и фамилии
- Создание маршрута
- Получение маршрутов пользователя
- Создание поездки
- Подключение пользователя к поездке
- Получение информации о поездке

Дополнительно реализована простая аутентификация через Bearer token.

## Технологии

- C++20
- Yandex Userver
- CMake
- Docker
- Docker Compose
- OpenAPI 3.0
- Bash / curl для тестирования

## Структура проекта

```text
ridesharing-userver/
├── CMakeLists.txt
├── Dockerfile
├── docker-compose.yaml
├── openapi.yaml
├── README.md
├── configs/
│   └── static_config.yaml
├── src/
│   └── main.cpp
└── tests/
    └── test_api.sh

Запуск проекта
1. Сборка и запуск через Docker Compose
docker compose up --build

После успешного запуска сервис будет доступен по адресу:

http://localhost:8080
2. Проверка работоспособности
curl http://localhost:8080/ping

Ожидаемый ответ:

{
  "status": "ok",
  "service": "ridesharing-userver",
  "variant": 7
}
Основные endpoints
Health check
GET /ping
Auth
POST /api/v1/auth/register
POST /api/v1/auth/login
Users
GET /api/v1/users/by-login/{login}
GET /api/v1/users/search?first_name=Iv&last_name=Pet
Routes
POST /api/v1/routes
GET /api/v1/users/{user_id}/routes
Trips
POST /api/v1/trips
POST /api/v1/trips/{trip_id}/join
GET /api/v1/trips/{trip_id}
Аутентификация

Для защищённых endpoints используется заголовок:

Authorization: Bearer <token>

Пример:

Authorization: Bearer token-1-driver

Защищённые endpoints:

POST /api/v1/routes
POST /api/v1/trips
POST /api/v1/trips/{trip_id}/join

Если токен отсутствует или неверный, сервис возвращает:

{
  "error": "authorization token is missing or invalid"
}

Со статусом:

401 Unauthorized
Примеры запросов
Регистрация водителя
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"login":"driver","password":"123456","first_name":"Ivan","last_name":"Petrov"}'
Регистрация пассажира
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"login":"passenger","password":"123456","first_name":"Anna","last_name":"Smirnova"}'
Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"driver","password":"123456"}'

Пример ответа:

{
  "access_token": "token-1-driver",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "login": "driver",
    "first_name": "Ivan",
    "last_name": "Petrov"
  }
}
Создание маршрута
curl -X POST http://localhost:8080/api/v1/routes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token-1-driver" \
  -d '{"user_id":1,"from_city":"Moscow","to_city":"Tver","distance_km":180}'
Получение маршрутов пользователя
curl http://localhost:8080/api/v1/users/1/routes
Создание поездки
curl -X POST http://localhost:8080/api/v1/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token-1-driver" \
  -d '{"driver_id":1,"route_id":1,"departure_time":"2026-05-20T10:00:00","available_seats":3,"price":1200}'
Подключение пассажира к поездке
curl -X POST http://localhost:8080/api/v1/trips/1/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token-2-passenger" \
  -d '{"user_id":2}'
Получение информации о поездке
curl http://localhost:8080/api/v1/trips/1

Ожидаемый ответ:

{
  "trip": {
    "id": 1,
    "driver_id": 1,
    "route_id": 1,
    "departure_time": "2026-05-20T10:00:00",
    "available_seats": 2,
    "price": 1200,
    "passenger_ids": [2]
  }
}
Тестирование

Для проверки основных сценариев используется bash-скрипт:

./tests/test_api.sh

Перед запуском тестов необходимо запустить сервис:

docker compose up --build

Тесты проверяют:

работоспособность сервиса
регистрацию пользователей
авторизацию
поиск пользователей
создание маршрута
проверку защищённого endpoint без токена
создание поездки
подключение пользователя к поездке
получение информации о поездке
Обработка ошибок

В сервисе реализована обработка основных ошибок:

Ситуация	HTTP статус
Некорректное тело запроса	400 Bad Request
Отсутствует или неверный токен	401 Unauthorized
Ресурс не найден	404 Not Found
Конфликт данных	409 Conflict
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Домашнее задание 03: Проектирование и оптимизация реляционной базы данных

## Цель работы

Целью домашнего задания является проектирование реляционной базы данных PostgreSQL для сервиса поиска попутчиков, создание таблиц, добавление тестовых данных, создание индексов и анализ планов выполнения SQL-запросов.

## Файлы базы данных

```text
sql/
├── schema.sql
├── data.sql
└── queries.sql

optimization.md
schema.sql

Файл sql/schema.sql содержит:

создание таблиц;
первичные ключи;
внешние ключи;
ограничения NOT NULL, UNIQUE, CHECK;
индексы для оптимизации частых запросов.
data.sql

Файл sql/data.sql содержит тестовые данные:

10 пользователей;
10 маршрутов;
10 поездок;
10 записей подключения пассажиров к поездкам.
queries.sql

Файл sql/queries.sql содержит SQL-запросы для всех операций варианта:

создание нового пользователя;
поиск пользователя по login;
поиск пользователя по маске имени и фамилии;
создание маршрута;
получение маршрутов пользователя;
создание поездки;
подключение пользователя к поездке;
получение информации о поездке;
дополнительные запросы с EXPLAIN и EXPLAIN ANALYZE.
optimization.md

Файл optimization.md содержит описание созданных индексов и анализ планов выполнения запросов.

Схема базы данных

В проекте используются следующие таблицы:

users
routes
trips
trip_passengers
users

Таблица пользователей.

Основные поля:

id
login
password_hash
first_name
last_name
created_at

Колонка login имеет ограничение UNIQUE, поэтому PostgreSQL автоматически создаёт индекс для быстрого поиска пользователя по login.

routes

Таблица маршрутов.

Основные поля:

id
user_id
from_city
to_city
distance_km
created_at

user_id является внешним ключом на таблицу users.

trips

Таблица поездок.

Основные поля:

id
driver_id
route_id
departure_time
available_seats
price
status
created_at

driver_id связан с таблицей users, а route_id связан с таблицей routes.

trip_passengers

Таблица связи пользователей и поездок.

Она нужна для реализации связи many-to-many:

одна поездка может иметь много пассажиров
один пользователь может участвовать в разных поездках

Составной первичный ключ:

PRIMARY KEY (trip_id, user_id)
Запуск PostgreSQL через Docker Compose

Для запуска API и PostgreSQL используется:

docker compose up --build

PostgreSQL запускается с параметрами:

database: ridesharing_db
user: ridesharing_user
password: ridesharing_password
port: 5432

При первом запуске Docker автоматически выполняет:

sql/schema.sql
sql/data.sql
Подключение к PostgreSQL
docker exec -it ridesharing-postgres psql -U ridesharing_user -d ridesharing_db

Проверка таблиц:

\dt

Ожидаемые таблицы:

users
routes
trips
trip_passengers

Проверка количества данных:

SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM routes;
SELECT COUNT(*) FROM trips;
SELECT COUNT(*) FROM trip_passengers;

Ожидаемый результат для каждой таблицы:

10
Выполнение SQL-запросов

Файл queries.sql можно выполнить командой:

docker exec -i ridesharing-postgres psql -U ridesharing_user -d ridesharing_db < sql/queries.sql
Индексы

В проекте созданы индексы для частых запросов:

CREATE INDEX idx_users_first_name_lower ON users (lower(first_name));
CREATE INDEX idx_users_last_name_lower ON users (lower(last_name));
CREATE INDEX idx_routes_user_id ON routes (user_id);
CREATE INDEX idx_routes_from_city_lower ON routes (lower(from_city));
CREATE INDEX idx_routes_to_city_lower ON routes (lower(to_city));
CREATE INDEX idx_trips_driver_id ON trips (driver_id);
CREATE INDEX idx_trips_route_id ON trips (route_id);
CREATE INDEX idx_trips_status_departure_time ON trips (status, departure_time);
CREATE INDEX idx_trip_passengers_trip_id ON trip_passengers (trip_id);
CREATE INDEX idx_trip_passengers_user_id ON trip_passengers (user_id);
Пример EXPLAIN

Запрос:

EXPLAIN
SELECT id, login, first_name, last_name
FROM users
WHERE login = 'driver1';

Результат:

Index Scan using users_login_key on users
Index Cond: ((login)::text = 'driver1'::text)

Это означает, что PostgreSQL использует индекс users_login_key, который был создан автоматически из-за ограничения UNIQUE на колонке login.

Вывод

В рамках домашнего задания была спроектирована реляционная база данных PostgreSQL для сервиса поиска попутчиков. Были созданы таблицы, связи между ними, ограничения целостности, индексы для оптимизации частых запросов, тестовые данные и SQL-запросы для операций варианта 7.

Использование EXPLAIN и EXPLAIN ANALYZE показало, что PostgreSQL применяет индексы для ускорения поиска пользователей, маршрутов, поездок и пассажиров.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

---

# Домашнее задание 04: Проектирование и работа с MongoDB

## Цель работы

Цель домашнего задания — спроектировать документную модель MongoDB для сервиса поиска попутчиков, создать коллекции, добавить тестовые данные, реализовать CRUD-запросы, настроить валидацию схемы и выполнить aggregation pipeline.

## Файлы MongoDB

```text
mongo/
├── schema_design.md
├── data.js
├── queries.js
└── validation.js
In schema_design.md is all explain