package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type rateBucket struct {
	count   int
	resetAt time.Time
}

var (
	rateMu    sync.Mutex
	rateStore = make(map[string]*rateBucket)
	lastClean time.Time
)

// RateLimit returns a Gin middleware that limits requests per IP.
// maxRequests: maximum allowed in the window. windowMs: window in milliseconds.
func RateLimit(maxRequests int, windowMs int64) gin.HandlerFunc {
	window := time.Duration(windowMs) * time.Millisecond

	return func(c *gin.Context) {
		ip := c.ClientIP()
		key := c.FullPath() + ":" + ip

		rateMu.Lock()
		now := time.Now()

		// Cleanup stale entries every 60 seconds
		if now.Sub(lastClean) > 60*time.Second {
			for k, b := range rateStore {
				if now.After(b.resetAt) {
					delete(rateStore, k)
				}
			}
			lastClean = now
		}

		bucket, exists := rateStore[key]
		if !exists || now.After(bucket.resetAt) {
			bucket = &rateBucket{count: 0, resetAt: now.Add(window)}
			rateStore[key] = bucket
		}
		bucket.count++
		count := bucket.count
		resetAt := bucket.resetAt
		rateMu.Unlock()

		remaining := maxRequests - count
		if remaining < 0 {
			remaining = 0
		}

		c.Header("X-RateLimit-Limit", strconv.Itoa(maxRequests))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(resetAt.Unix(), 10))

		if count > maxRequests {
			retryAfter := int(time.Until(resetAt).Seconds())
			if retryAfter < 1 {
				retryAfter = 1
			}
			c.Header("Retry-After", strconv.Itoa(retryAfter))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests. Please try again later.",
			})
			return
		}

		c.Next()
	}
}
