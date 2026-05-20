import json
import uuid
from datetime import datetime, timezone

import pika


RABBITMQ_HOST = "localhost"
RABBITMQ_PORT = 5672
RABBITMQ_USER = "ridesharing"
RABBITMQ_PASSWORD = "ridesharing_password"

EXCHANGE_NAME = "ridesharing.events"
EXCHANGE_TYPE = "topic"


def create_connection():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
    parameters = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        credentials=credentials,
    )
    return pika.BlockingConnection(parameters)


def publish_event(channel, routing_key: str, event_type: str, payload: dict):
    event = {
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "version": 1,
        "producer": "ridesharing-api",
        "payload": payload,
    }

    channel.basic_publish(
        exchange=EXCHANGE_NAME,
        routing_key=routing_key,
        body=json.dumps(event, ensure_ascii=False),
        properties=pika.BasicProperties(
            content_type="application/json",
            delivery_mode=2,
        ),
    )

    print(f"Published event: {event_type}")
    print(json.dumps(event, indent=2, ensure_ascii=False))


def main():
    connection = create_connection()
    channel = connection.channel()

    channel.exchange_declare(
        exchange=EXCHANGE_NAME,
        exchange_type=EXCHANGE_TYPE,
        durable=True,
    )

    publish_event(
        channel,
        routing_key="user.registered",
        event_type="UserRegistered",
        payload={
            "user_id": 1,
            "login": "driver1",
            "first_name": "Ivan",
            "last_name": "Petrov",
        },
    )

    publish_event(
        channel,
        routing_key="route.created",
        event_type="RouteCreated",
        payload={
            "route_id": 1,
            "user_id": 1,
            "from_city": "Moscow",
            "to_city": "Tver",
            "distance_km": 180,
        },
    )

    publish_event(
        channel,
        routing_key="trip.created",
        event_type="TripCreated",
        payload={
            "trip_id": 1,
            "driver_id": 1,
            "route_id": 1,
            "departure_time": "2026-05-25T10:00:00Z",
            "available_seats": 3,
            "price": 1200,
        },
    )

    publish_event(
        channel,
        routing_key="trip.passenger_joined",
        event_type="PassengerJoinedTrip",
        payload={
            "trip_id": 1,
            "user_id": 2,
            "joined_at": "2026-05-20T12:00:00Z",
            "available_seats_after_join": 2,
        },
    )

    connection.close()


if __name__ == "__main__":
    main()