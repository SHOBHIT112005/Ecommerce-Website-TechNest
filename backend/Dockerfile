# ── Stage 1: Build the Go binary ──
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Cache dependency downloads
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /technest-backend .

# ── Stage 2: Minimal production image ──
FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app
COPY --from=builder /technest-backend .

EXPOSE 8080

CMD ["./technest-backend"]
