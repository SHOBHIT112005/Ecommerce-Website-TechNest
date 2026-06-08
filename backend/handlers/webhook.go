package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"

	"technest-backend/database"

	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/webhook"
)

// StripeWebhook handles Stripe payment event notifications.
// POST /api/webhook
func StripeWebhook(c *gin.Context) {
	signingSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	if signingSecret == "" {
		log.Println("WARNING: STRIPE_WEBHOOK_SECRET not set")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Webhook not configured"})
		return
	}

	// Read raw body
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	// Verify Stripe signature
	signature := c.GetHeader("Stripe-Signature")
	event, err := webhook.ConstructEvent(body, signature, signingSecret)
	if err != nil {
		log.Printf("Webhook signature verification failed: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature"})
		return
	}

	// Handle checkout.session.completed
	if event.Type == "checkout.session.completed" {
		var session stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
			log.Printf("Failed to decode checkout session: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse event"})
			return
		}

		if session.PaymentStatus == stripe.CheckoutSessionPaymentStatusPaid {
			orderIDStr, ok := session.Metadata["orderId"]
			if ok && orderIDStr != "" {
				orderID, err := strconv.ParseUint(orderIDStr, 10, 64)
				if err == nil {
					result := database.DB.Model(&database.Order{}).
						Where("id = ?", uint(orderID)).
						Updates(map[string]interface{}{
							"paid":   1,
							"status": "completed",
						})

					if result.Error != nil {
						log.Printf("Failed to update order %d: %v", orderID, result.Error)
					} else {
						log.Printf("Order %d marked as paid and completed", orderID)
					}
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}
