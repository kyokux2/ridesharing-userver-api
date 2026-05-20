import json
import pika


RABBITMQ_HOST = "localhost"
RABBITMQ_PORT = 5672
RABBITMQ_USER = "ridesharing"
RABBITMQ_PASSWORD = "ridesharing_password"

EXCHANGE_NAME = "ridesharing.events"
EXCHANGE_TYPE = "topic"

QUEUE_NAME = "notification-service.events"


def create_connection():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
    parameters = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        credentials=credentials,
    )
    return pika.BlockingConnection(parameters)


def handle_event(channel, method, properties, body):
    try:
        event = json.loads(body)

        print("\nReceived event")
        print(f"Routing key: {method.routing_key}")
        print(f"Event type: {event.get('event_type')}")
        print(json.dumps(event, indent=2, ensure_ascii=False))

        event_type = event.get("event_type")

        if event_type == "UserRegistered":
            print("Notification Service: send welcome notification")
        elif event_type == "RouteCreated":
            print("Analytics Service: update route statistics")
        elif event_type == "TripCreated":
            print("Read Model Service: update trip read model")
        elif event_type == "PassengerJoinedTrip":
            print("Notification Service: notify driver about new passenger")
            print("Read Model Service: update available seats")
        else:
            print("Unknown event type")

        channel.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as exc:
        print(f"Error while processing message: {exc}")
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def main():
    connection = create_connection()
    channel = connection.channel()

    channel.exchange_declare(
        exchange=EXCHANGE_NAME,
        exchange_type=EXCHANGE_TYPE,
        durable=True,
    )

    channel.queue_declare(
        queue=QUEUE_NAME,
        durable=True,
    )

    channel.queue_bind(
        exchange=EXCHANGE_NAME,
        queue=QUEUE_NAME,
        routing_key="user.*",
    )

    channel.queue_bind(
        exchange=EXCHANGE_NAME,
        queue=QUEUE_NAME,
        routing_key="route.*",
    )

    channel.queue_bind(
        exchange=EXCHANGE_NAME,
        queue=QUEUE_NAME,
        routing_key="trip.*",
    )

    channel.basic_qos(prefetch_count=1)

    channel.basic_consume(
        queue=QUEUE_NAME,
        on_message_callback=handle_event,
    )

    print("Consumer started. Waiting for events...")
    print("Press Ctrl+C to stop.")

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print("Consumer stopped.")
        channel.stop_consuming()

    connection.close()


if __name__ == "__main__":
    main()