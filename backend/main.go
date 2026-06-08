package main

import (
	"log"
	"net/http"
	"os"

	"technest-backend/database"
	"technest-backend/handlers"
	"technest-backend/middleware"
	"technest-backend/services"

	"github.com/gin-gonic/gin"
)

func main() {
	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize database connection and run migrations
	database.Connect()
	database.Seed()

	// Initialize Redis
	services.ConnectRedis()

	// Initialize Stripe
	services.InitStripe()

	r := gin.Default()

	// CORS middleware
	r.Use(corsMiddleware())

	// ── Health check ────────────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		dbStatus := "connected"
		if err := database.Ping(); err != nil {
			dbStatus = "disconnected"
		}

		redisStatus := "connected"
		if err := services.PingRedis(); err != nil {
			redisStatus = "disconnected"
		}

		c.JSON(http.StatusOK, gin.H{
			"status":   "ok",
			"service":  "technest-backend",
			"database": dbStatus,
			"redis":    redisStatus,
		})
	})

	// ── Public routes ───────────────────────────────────────────────
	api := r.Group("/api")
	{
		// Products (public, rate-limited)
		api.GET("/products", middleware.RateLimit(120, 60000), handlers.ListProducts)
		api.GET("/products/:id", middleware.RateLimit(120, 60000), handlers.GetProduct)

		// Auth (public, rate-limited)
		api.POST("/auth/register", middleware.RateLimit(10, 900000), handlers.Register)
		api.POST("/auth/login", middleware.RateLimit(20, 900000), handlers.Login)

		// Stripe webhook (public, raw body needed, no auth)
		api.POST("/webhook", handlers.StripeWebhook)

		// Chat (public, rate-limited)
		api.POST("/chat", middleware.RateLimit(30, 60000), handlers.Chat)
	}

	// ── Cart routes (session-based, no auth required) ───────────────
	cart := r.Group("/api/cart")
	cart.Use(middleware.RateLimit(120, 60000))
	{
		cart.GET("", handlers.GetCart)
		cart.POST("", handlers.AddToCart)
		cart.PUT("", handlers.UpdateCart)
		cart.DELETE("/:productId", handlers.RemoveFromCart)
		cart.DELETE("", handlers.ClearCart)
	}

	// ── Authenticated routes ────────────────────────────────────────
	auth := r.Group("/api")
	auth.Use(middleware.RequireAuth())
	{
		auth.POST("/checkout", middleware.RateLimit(20, 60000), handlers.Checkout)
		auth.GET("/user/orders", handlers.ListUserOrders)
		auth.DELETE("/user/orders/:id", handlers.CancelOrder)
	}

	// ── Admin routes (auth + admin role) ────────────────────────────
	admin := r.Group("/api/admin")
	admin.Use(middleware.RequireAuth(), middleware.RequireAdmin())
	admin.Use(middleware.RateLimit(120, 60000))
	{
		admin.GET("/products", handlers.AdminListProducts)
		admin.POST("/products", handlers.AdminCreateProduct)
		admin.GET("/orders", handlers.AdminListOrders)
		admin.PATCH("/orders", handlers.AdminUpdateOrder)
		admin.POST("/orders", handlers.AdminCreateOrder)
		admin.DELETE("/orders", handlers.AdminDeleteOrder)
		admin.GET("/stats", handlers.AdminStats)
	}

	log.Printf("TechNest Backend starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "" {
			origin = "*"
		}

		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
