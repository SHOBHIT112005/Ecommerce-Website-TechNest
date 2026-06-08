package services

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// RDB is the global Redis client instance.
var RDB *redis.Client

// cartTTL is how long an idle cart lives in Redis before auto-expiring.
const cartTTL = 24 * time.Hour

// ConnectRedis establishes a connection to Redis with retry logic.
func ConnectRedis() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("Invalid REDIS_URL: %v", err)
	}

	client := redis.NewClient(opts)
	ctx := context.Background()

	// Retry connection
	maxRetries := 10
	for i := 0; i < maxRetries; i++ {
		if err := client.Ping(ctx).Err(); err == nil {
			break
		}
		if i == maxRetries-1 {
			log.Fatalf("Could not connect to Redis after %d attempts", maxRetries)
		}
		waitTime := time.Duration(i+1) * 2 * time.Second
		log.Printf("Redis connection failed (attempt %d/%d). Retrying in %v...", i+1, maxRetries, waitTime)
		time.Sleep(waitTime)
	}

	RDB = client
	log.Println("Connected to Redis successfully")
}

// PingRedis checks if the Redis connection is alive.
func PingRedis() error {
	return RDB.Ping(context.Background()).Err()
}

// cartKey returns the Redis key for a given session.
func cartKey(sessionID string) string {
	return fmt.Sprintf("cart:%s", sessionID)
}

// GenerateSessionID creates a new unique session ID for guest carts.
func GenerateSessionID() string {
	return uuid.New().String()
}

// AddToCart increments the quantity of a product in the cart.
func AddToCart(ctx context.Context, sessionID string, productID uint) (int64, error) {
	key := cartKey(sessionID)
	field := strconv.FormatUint(uint64(productID), 10)

	qty, err := RDB.HIncrBy(ctx, key, field, 1).Result()
	if err != nil {
		return 0, err
	}

	// Refresh TTL on every cart interaction
	RDB.Expire(ctx, key, cartTTL)
	return qty, nil
}

// RemoveFromCart decrements the quantity; removes the field if qty reaches 0.
func RemoveFromCart(ctx context.Context, sessionID string, productID uint) error {
	key := cartKey(sessionID)
	field := strconv.FormatUint(uint64(productID), 10)

	qty, err := RDB.HIncrBy(ctx, key, field, -1).Result()
	if err != nil {
		return err
	}

	if qty <= 0 {
		RDB.HDel(ctx, key, field)
	}

	RDB.Expire(ctx, key, cartTTL)
	return nil
}

// UpdateCartItem sets an exact quantity for a product. If qty <= 0, removes it.
func UpdateCartItem(ctx context.Context, sessionID string, productID uint, quantity int) error {
	key := cartKey(sessionID)
	field := strconv.FormatUint(uint64(productID), 10)

	if quantity <= 0 {
		RDB.HDel(ctx, key, field)
	} else {
		RDB.HSet(ctx, key, field, quantity)
	}

	RDB.Expire(ctx, key, cartTTL)
	return nil
}

// GetCart returns all items in the cart as a map of productID → quantity.
func GetCart(ctx context.Context, sessionID string) (map[uint]int, error) {
	key := cartKey(sessionID)
	result, err := RDB.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	cart := make(map[uint]int, len(result))
	for field, val := range result {
		pid, err := strconv.ParseUint(field, 10, 64)
		if err != nil {
			continue
		}
		qty, err := strconv.Atoi(val)
		if err != nil {
			continue
		}
		if qty > 0 {
			cart[uint(pid)] = qty
		}
	}

	return cart, nil
}

// ClearCart deletes the entire cart for a session.
func ClearCart(ctx context.Context, sessionID string) error {
	return RDB.Del(ctx, cartKey(sessionID)).Err()
}
