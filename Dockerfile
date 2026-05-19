FROM ghcr.io/userver-framework/ubuntu-22.04-userver:latest

WORKDIR /app

COPY . .

RUN cmake -B build -S . -DCMAKE_BUILD_TYPE=Release
RUN cmake --build build -j$(nproc)

EXPOSE 8080

CMD ["./build/ridesharing_userver", "--config", "configs/static_config.yaml"]