# Event Catalog

Проект: **RideSharing REST API**  
Вариант: **7 — Сервис поиска попутчиков**

## 1. Общая информация

Данный документ описывает каталог событий для Event-Driven архитектуры сервиса поиска попутчиков.

Используемый брокер сообщений:

```text
RabbitMQ

Exchange:

ridesharing.events

Тип exchange:

topic

Формат сообщений:

JSON

Гарантия доставки:

At-least-once delivery

Общая структура события:

{
  "event_id": "uuid",
  "event_type": "EventName",
  "occurred_at": "2026-05-20T12:00:00Z",
  "version": 1,
  "producer": "ridesharing-api",
  "payload": {}
}
2. UserRegistered
Название события
UserRegistered
Описание

Событие возникает после успешной регистрации нового пользователя.

Command
RegisterUserCommand
Routing key
user.registered
Producer
Auth/User API
Consumers
Notification Service
Analytics Service
Audit Service
Read Model Service
Payload
{
  "user_id": 1,
  "login": "driver1",
  "first_name": "Ivan",
  "last_name": "Petrov"
}
Полная структура сообщения
{
  "event_id": "7cd13cb0-78f0-4cc0-8a41-4c121bd0ce94",
  "event_type": "UserRegistered",
  "occurred_at": "2026-05-20T12:00:00Z",
  "version": 1,
  "producer": "ridesharing-api",
  "payload": {
    "user_id": 1,
    "login": "driver1",
    "first_name": "Ivan",
    "last_name": "Petrov"
  }
}
Delivery guarantee
At-least-once
Consumer actions
Consumer	Action
Notification Service	Отправить приветственное уведомление
Analytics Service	Увеличить счетчик зарегистрированных пользователей
Audit Service	Сохранить событие в audit log
Read Model Service	Обновить read-модель пользователя
3. RouteCreated
Название события
RouteCreated
Описание

Событие возникает после создания маршрута пользователем.

Command
CreateRouteCommand
Routing key
route.created
Producer
Route API
Consumers
Analytics Service
Read Model Service
Audit Service
Payload
{
  "route_id": 1,
  "user_id": 1,
  "from_city": "Moscow",
  "to_city": "Tver",
  "distance_km": 180
}
Полная структура сообщения
{
  "event_id": "9a7d2d07-bbdc-4d2a-8b76-20cb9db53dcb",
  "event_type": "RouteCreated",
  "occurred_at": "2026-05-20T12:05:00Z",
  "version": 1,
  "producer": "ridesharing-api",
  "payload": {
    "route_id": 1,
    "user_id": 1,
    "from_city": "Moscow",
    "to_city": "Tver",
    "distance_km": 180
  }
}
Delivery guarantee
At-least-once
Consumer actions
Consumer	Action
Analytics Service	Обновить статистику популярных направлений
Read Model Service	Обновить read-модель маршрутов пользователя
Audit Service	Записать факт создания маршрута
4. TripCreated
Название события
TripCreated
Описание

Событие возникает после создания поездки водителем.

Command
CreateTripCommand
Routing key
trip.created
Producer
Trip API
Consumers
Notification Service
Analytics Service
Read Model Service
Audit Service
Payload
{
  "trip_id": 1,
  "driver_id": 1,
  "route_id": 1,
  "departure_time": "2026-05-25T10:00:00Z",
  "available_seats": 3,
  "price": 1200
}
Полная структура сообщения
{
  "event_id": "273191c0-e993-472e-a9a7-58568622a3fd",
  "event_type": "TripCreated",
  "occurred_at": "2026-05-20T12:10:00Z",
  "version": 1,
  "producer": "ridesharing-api",
  "payload": {
    "trip_id": 1,
    "driver_id": 1,
    "route_id": 1,
    "departure_time": "2026-05-25T10:00:00Z",
    "available_seats": 3,
    "price": 1200
  }
}
Delivery guarantee
At-least-once
Consumer actions
Consumer	Action
Notification Service	Уведомить пользователей, заинтересованных в маршруте
Analytics Service	Обновить статистику созданных поездок
Read Model Service	Добавить поездку в read-модель активных поездок
Audit Service	Записать событие в audit log
5. PassengerJoinedTrip
Название события
PassengerJoinedTrip
Описание

Событие возникает после успешного подключения пассажира к поездке.

Command
JoinTripCommand
Routing key
trip.passenger_joined
Producer
Trip API
Consumers
Notification Service
Analytics Service
Read Model Service
Audit Service
Payload
{
  "trip_id": 1,
  "user_id": 2,
  "joined_at": "2026-05-20T12:00:00Z",
  "available_seats_after_join": 2
}
Полная структура сообщения
{
  "event_id": "f24bb972-10ad-48ab-b476-fb8f9d24d53e",
  "event_type": "PassengerJoinedTrip",
  "occurred_at": "2026-05-20T12:15:00Z",
  "version": 1,
  "producer": "ridesharing-api",
  "payload": {
    "trip_id": 1,
    "user_id": 2,
    "joined_at": "2026-05-20T12:00:00Z",
    "available_seats_after_join": 2
  }
}
Delivery guarantee
At-least-once
Consumer actions
Consumer	Action
Notification Service	Уведомить водителя о новом пассажире
Notification Service	Отправить подтверждение пассажиру
Analytics Service	Обновить статистику заполненности поездок
Read Model Service	Обновить количество свободных мест в read-модели
Audit Service	Сохранить событие подключения пассажира
6. TripCancelled
Название события
TripCancelled
Описание

Событие возникает после отмены поездки.

Command
CancelTripCommand
Routing key
trip.cancelled
Producer
Trip API
Consumers
Notification Service
Analytics Service
Read Model Service
Audit Service
Payload
{
  "trip_id": 1,
  "driver_id": 1,
  "reason": "Driver cancelled the trip",
  "cancelled_at": "2026-05-20T13:00:00Z"
}
Полная структура сообщения
{
  "event_id": "473b4c83-3e41-4652-8e0a-1b3b1894ebad",
  "event_type": "TripCancelled",
  "occurred_at": "2026-05-20T13:00:00Z",
  "version": 1,
  "producer": "ridesharing-api",
  "payload": {
    "trip_id": 1,
    "driver_id": 1,
    "reason": "Driver cancelled the trip",
    "cancelled_at": "2026-05-20T13:00:00Z"
  }
}
Delivery guarantee
At-least-once
Consumer actions
Consumer	Action
Notification Service	Уведомить пассажиров об отмене
Analytics Service	Обновить статистику отмен
Read Model Service	Убрать поездку из списка активных
Audit Service	Сохранить событие отмены
7. Routing summary
Event	Routing key	Producer	Main consumers
UserRegistered	user.registered	Auth/User API	Notification, Analytics, Audit, Read Model
RouteCreated	route.created	Route API	Analytics, Audit, Read Model
TripCreated	trip.created	Trip API	Notification, Analytics, Audit, Read Model
PassengerJoinedTrip	trip.passenger_joined	Trip API	Notification, Analytics, Audit, Read Model
TripCancelled	trip.cancelled	Trip API	Notification, Analytics, Audit, Read Model
8. Idempotency

Так как используется гарантия доставки at-least-once, consumer может получить одно и то же событие больше одного раза.

Для защиты от повторной обработки consumer должен сохранять обработанные event_id.

Пример логики:

1. Consumer получает событие.
2. Проверяет, был ли event_id уже обработан.
3. Если да — пропускает событие.
4. Если нет — обрабатывает событие и сохраняет event_id.

Это делает обработку событий идемпотентной.

9. Итог

Каталог событий описывает все основные события сервиса поиска попутчиков:

регистрацию пользователя;
создание маршрута;
создание поездки;
подключение пассажира к поездке;
отмену поездки.

Для каждого события определены:

название;
command;
routing key;
producer;
consumers;
payload;
delivery guarantee;
действия consumers.