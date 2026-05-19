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