package services

import (
	"log"
	"os"

	"github.com/stripe/stripe-go/v82"
)

// InitStripe configures the Stripe SDK with the secret key from environment.
func InitStripe() {
	key := os.Getenv("STRIPE_SECRET_KEY")
	if key == "" {
		log.Println("WARNING: STRIPE_SECRET_KEY not set — Stripe payments will not work")
		return
	}
	stripe.Key = key
	log.Println("Stripe SDK initialized")
}
