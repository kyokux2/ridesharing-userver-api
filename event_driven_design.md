# Домашнее задание 06: Event-Driven Architecture

Проект: **RideSharing REST API**  
Вариант: **7 — Сервис поиска попутчиков**

## 1. Цель работы

Цель работы — спроектировать событийно-ориентированную архитектуру для сервиса поиска попутчиков, определить команды и события системы, выбрать брокер сообщений, описать взаимодействие сервисов через события и применить паттерн CQRS.

Система содержит основные сущности:

- Пользователь
- Маршрут
- Поездка

Основные операции:

- создание нового пользователя;
- поиск пользователя по login;
- поиск пользователя по маске имени и фамилии;
- создание маршрута;
- получение маршрутов пользователя;
- создание поездки;
- подключение пользователя к поездке;
- получение информации о поездке.

---

## 2. Почему Event-Driven Architecture подходит для сервиса

В сервисе поиска попутчиков есть много действий, после которых нужно уведомить другие части системы.

Например:

- пользователь зарегистрировался;
- водитель создал маршрут;
- водитель создал поездку;
- пассажир подключился к поездке;
- поездка была отменена.

После этих действий могут быть заинтересованы разные сервисы:

- Notification Service;
- Analytics Service;
- Read Model Service;
- Audit Service.

Если вызывать все сервисы напрямую из основного API, система станет сильно связанной. Event-Driven Architecture позволяет уменьшить связанность: основной сервис публикует событие, а другие сервисы сами решают, как на него реагировать.

---

## 3. Команды и события

Команда — это намерение изменить состояние системы.  
Событие — это факт, что изменение уже произошло.

| Command | Event |
|---|---|
| `RegisterUserCommand` | `UserRegistered` |
| `CreateRouteCommand` | `RouteCreated` |
| `CreateTripCommand` | `TripCreated` |
| `JoinTripCommand` | `PassengerJoinedTrip` |
| `CancelTripCommand` | `TripCancelled` |

Пример:

```text
Command: JoinTripCommand
Meaning: пользователь хочет подключиться к поездке

Event: PassengerJoinedTrip
Meaning: пользователь успешно подключился к поездке
4. Producers and Consumers
4.1 Event Producers

Производителями событий являются компоненты, которые изменяют состояние системы.

Producer	Events
Auth/User API	UserRegistered
Route API	RouteCreated
Trip API	TripCreated, PassengerJoinedTrip, TripCancelled
4.2 Event Consumers

Потребителями событий являются сервисы, которые должны реагировать на изменения.

Consumer	Responsibility
Notification Service	отправка уведомлений пользователям
Analytics Service	сбор статистики по маршрутам и поездкам
Read Model Service	обновление read-модели для быстрых запросов
Audit Service	сохранение истории событий
5. Выбранный брокер сообщений

Для реализации выбран RabbitMQ.

Причины выбора RabbitMQ:

простая настройка через Docker;
удобный Management UI;
поддержка exchanges, queues и routing keys;
хорошо подходит для событий между сервисами;
легко тестировать producer/consumer;
подходит для учебного проекта.

RabbitMQ Management UI доступен по адресу:

http://localhost:15672

Логин:

ridesharing

Пароль:

ridesharing_password
6. Exchange и Routing

В проекте используется topic exchange:

Exchange: ridesharing.events
Type: topic
Durable: true

Topic exchange выбран, потому что он позволяет гибко маршрутизировать события по routing key.

Примеры routing keys:

user.registered
route.created
trip.created
trip.passenger_joined
trip.cancelled

Очередь consumer-а:

notification-service.events

Bindings:

user.*
route.*
trip.*

Это означает, что consumer может получать события пользователей, маршрутов и поездок.

7. Формат сообщения

Все события передаются в формате JSON.

Общая структура события:

{
  "event_id": "uuid",
  "event_type": "TripCreated",
  "occurred_at": "2026-05-20T12:00:00Z",
  "version": 1,
  "producer": "ridesharing-api",
  "payload": {}
}

Описание полей:

Field	Description
event_id	уникальный идентификатор события
event_type	тип события
occurred_at	время возникновения события
version	версия схемы события
producer	сервис, который опубликовал событие
payload	бизнес-данные события
8. Гарантии доставки

Для проекта используется гарантия:

At-least-once delivery

Это означает, что сообщение будет доставлено как минимум один раз.

Почему не exactly-once:

exactly-once сложнее реализовать;
RabbitMQ обычно используется с acknowledgements и повторной доставкой;
для учебного проекта достаточно at-least-once;
при повторной доставке consumer должен быть идемпотентным.

Механизмы надежности:

durable exchange;
durable queue;
persistent messages;
manual ack;
basic_nack при ошибке обработки.

В producer используется:

delivery_mode=2

Это делает сообщение persistent.

В consumer используется:

channel.basic_ack(...)

После успешной обработки события.

9. Event Flow
9.1 User registration flow
1. Client sends POST /api/v1/auth/register.
2. API creates user.
3. API publishes UserRegistered event.
4. Notification Service receives event.
5. Notification Service sends welcome notification.
6. Analytics Service can update user statistics.
9.2 Route creation flow
1. Driver creates route.
2. Route API saves route.
3. Route API publishes RouteCreated event.
4. Analytics Service updates route statistics.
5. Read Model Service updates optimized read model.
9.3 Trip creation flow
1. Driver creates trip.
2. Trip API saves trip.
3. Trip API publishes TripCreated event.
4. Read Model Service updates list of available trips.
5. Notification Service can notify interested passengers.
9.4 Passenger joins trip flow
1. Passenger sends join trip request.
2. Trip API checks available seats.
3. Trip API adds passenger and decreases available seats.
4. Trip API publishes PassengerJoinedTrip event.
5. Notification Service notifies driver.
6. Read Model Service updates available seats.
7. Analytics Service updates passenger activity.
10. CQRS

CQRS means Command Query Responsibility Segregation.

В данной системе CQRS применим, потому что операции записи и чтения имеют разные требования.

10.1 Command model

Command model отвечает за изменение состояния.

Команды:

RegisterUserCommand
CreateRouteCommand
CreateTripCommand
JoinTripCommand
CancelTripCommand

Command endpoints:

POST /api/v1/auth/register
POST /api/v1/routes
POST /api/v1/trips
POST /api/v1/trips/{trip_id}/join
10.2 Query model

Query model отвечает за быстрые операции чтения.

Query endpoints:

GET /api/v1/users/by-login/{login}
GET /api/v1/users/search
GET /api/v1/users/{user_id}/routes
GET /api/v1/trips/{trip_id}
10.3 Синхронизация моделей через события

После выполнения команды публикуется событие.

Например:

CreateTripCommand → TripCreated

Read Model Service получает событие TripCreated и обновляет оптимизированное представление для чтения.

Пример read model:

{
  "trip_id": 1,
  "driver_name": "Ivan Petrov",
  "from_city": "Moscow",
  "to_city": "Tver",
  "departure_time": "2026-05-25T10:00:00Z",
  "available_seats": 3,
  "price": 1200
}

Преимущества CQRS:

read model можно оптимизировать под быстрые запросы;
write model остается простой и консистентной;
события синхронизируют изменения;
можно масштабировать read и write части отдельно.

Недостаток:

появляется eventual consistency.

То есть read model может обновиться с небольшой задержкой после события.

11. Реализация producer/consumer

В проекте добавлены файлы:

events/
├── producer.py
├── consumer.py
└── requirements.txt

Producer публикует события в RabbitMQ exchange:

ridesharing.events

Consumer слушает очередь:

notification-service.events

Producer публикует события:

UserRegistered
RouteCreated
TripCreated
PassengerJoinedTrip

Consumer обрабатывает события и выводит реакцию сервиса:

Notification Service: send welcome notification
Analytics Service: update route statistics
Read Model Service: update trip read model
Notification Service: notify driver about new passenger
12. Testing

Запуск RabbitMQ:

docker compose up --build

Установка зависимостей:

python3 -m venv .events_venv
source .events_venv/bin/activate
pip install -r events/requirements.txt

Запуск consumer:

python events/consumer.py

Запуск producer в другой terminal:

python events/producer.py

Ожидаемый результат:

Consumer started. Waiting for events...

Received event
Event type: UserRegistered
Notification Service: send welcome notification

Received event
Event type: RouteCreated
Analytics Service: update route statistics

Received event
Event type: TripCreated
Read Model Service: update trip read model

Received event
Event type: PassengerJoinedTrip
Notification Service: notify driver about new passenger
Read Model Service: update available seats
13. Итог

В рамках работы была спроектирована Event-Driven архитектура для сервиса поиска попутчиков.

Были определены:

команды;
события;
producers;
consumers;
формат сообщений;
RabbitMQ exchange и routing keys;
гарантии доставки;
CQRS-разделение команд и запросов;
producer и consumer для тестирования взаимодействия.

Такой подход уменьшает связанность сервисов, повышает масштабируемость и позволяет добавлять новые реакции на события без изменения основного API.