# Stage 1.1: Build Backend
# alpine doesn't work because it uses musl instead of libc
FROM golang:1.25 AS builder-be

WORKDIR /app

COPY ../backend/go.mod ../backend/go.sum ./
RUN go mod download

COPY ../backend/. .

# CGO is required for kuzu as it is simply a wrapper for underlying C libraries that cannot be statically linked
# Build DB generator
RUN CGO_ENABLED=1 go build -o db-setup ./cmd/dbsetup
# Build webserver
RUN CGO_ENABLED=1 go generate ./...
RUN CGO_ENABLED=1 go build -o webserver ./cmd/webserver

# Stage 1.2: Build Frontend
FROM node:22 AS builder-fe

WORKDIR /app

COPY ../frontend/package*.json ./

RUN npm install

COPY ../frontend/. .

RUN npm run build

# Stage 2.1: db-setup runtime
# We need libc available, thus all the smallest images are not viable
FROM debian:bookworm-slim as db-setup

WORKDIR /app

COPY --from=builder-be /app/db-setup .
COPY --from=builder-be "/app/cmd/dbsetup/migrations" ./migrations

# As we are not statically linking, we need to copy the underlying C library...
COPY --from=builder-be /go/pkg/mod/github.com/kuzudb/go-kuzu@v0.11.2/lib/dynamic/linux-amd64/libkuzu.so /usr/local/lib/
# ...and make it available for linking
ENV LD_LIBRARY_PATH=/usr/local/lib

COPY ../data ./data

# Default command: run webserver
ENTRYPOINT ["./db-setup", "--db-kuzu-path", "./db/family-tree.kuzu", "--db-sqlite-path", "./db/family-tree.sqlite", "--data-path-prefix", "./data"]

# Stage 2.2: webserver runtime
FROM debian:bookworm-slim as webserver

WORKDIR /app

COPY --from=builder-be /app/webserver .

COPY --from=builder-be /go/pkg/mod/github.com/kuzudb/go-kuzu@v0.11.2/lib/dynamic/linux-amd64/libkuzu.so /usr/local/lib/
ENV LD_LIBRARY_PATH=/usr/local/lib

# Copy frontend static files
COPY --from=builder-fe /app/dist ./frontend

# Expose port
EXPOSE 8080

# Default command: run webserver
ENTRYPOINT ["./webserver", "--db-kuzu-path", "./db/family-tree.kuzu", "--db-sqlite-path", "./db/family-tree.sqlite"]