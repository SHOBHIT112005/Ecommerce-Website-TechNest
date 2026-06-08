package handlers

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"

	"technest-backend/database"

	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/checkout/session"
)

const deliveryFee = 5.0

// checkoutRequest is the expected JSON body for POST /api/checkout.
type checkoutRequest struct {
	Name       string `json:"name"`
	Address    string `json:"address"`
	City       string `json:"city"`
	ProductIDs string `json:"products"` // comma-separated product IDs
}

// Checkout creates a Stripe checkout session and an Order.
// POST /api/checkout
func Checkout(c *gin.Context) {
	var req checkoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	email := c.GetString("userEmail")
	if email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please sign in to place an order"})
		return
	}

	name := strings.TrimSpace(req.Name)
	address := strings.TrimSpace(req.Address)
	city := strings.TrimSpace(req.City)

	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Address is required"})
		return
	}
	if city == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "City is required"})
		return
	}

	// Parse product IDs
	productIDStrs := strings.Split(req.ProductIDs, ",")
	var productIDs []uint
	for _, s := range productIDStrs {
		s = strings.TrimSpace(s)
		if s == "" {
			continue
		}
		id, err := strconv.ParseUint(s, 10, 64)
		if err != nil {
			continue
		}
		productIDs = append(productIDs, uint(id))
	}

	if len(productIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cart is empty"})
		return
	}

	// Get unique IDs and count quantities
	qtyMap := make(map[uint]int64)
	for _, pid := range productIDs {
		qtyMap[pid]++
	}

	var uniqIDs []uint
	for pid := range qtyMap {
		uniqIDs = append(uniqIDs, pid)
	}

	// Fetch products from DB
	var products []database.Product
	database.DB.Where("id IN ?", uniqIDs).Find(&products)

	productMap := make(map[uint]*database.Product)
	for i := range products {
		productMap[products[i].ID] = &products[i]
	}

	// Build Stripe line items and order items
	var lineItems []*stripe.CheckoutSessionLineItemParams
	var orderItems []database.OrderItem
	var subtotal float64

	for pid, qty := range qtyMap {
		product, ok := productMap[pid]
		if !ok {
			continue
		}

		subtotal += product.Price * float64(qty)

		lineItems = append(lineItems, &stripe.CheckoutSessionLineItemParams{
			Quantity: stripe.Int64(qty),
			PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
				Currency: stripe.String("usd"),
				ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
					Name: stripe.String(product.Name),
				},
				UnitAmount: stripe.Int64(int64(product.Price * 100)),
			},
		})

		orderItems = append(orderItems, database.OrderItem{
			ProductID: pid,
			Quantity:  int(qty),
			UnitPrice: product.Price,
		})
	}

	if len(lineItems) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No valid products found in cart"})
		return
	}

	totalAmount := subtotal + deliveryFee

	// Find or create user
	emailLower := strings.ToLower(email)
	var user database.User
	result := database.DB.Where("email_lower = ?", emailLower).First(&user)
	if result.Error != nil {
		// Create user
		user = database.User{
			Name:         name,
			Email:        email,
			EmailLower:   emailLower,
			AuthProvider: "credentials",
			IsRegistered: true,
			Role:         "user",
		}
		database.DB.Create(&user)
	}

	// Create order
	order := database.Order{
		UserID:      &user.ID,
		Name:        name,
		Email:       email,
		Address:     address,
		City:        city,
		Status:      "pending",
		Subtotal:    subtotal,
		DeliveryFee: deliveryFee,
		TotalAmount: totalAmount,
		Paid:        0,
		Items:       orderItems,
	}

	if err := database.DB.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	// Determine success/cancel URLs
	origin := c.GetHeader("Origin")
	if origin == "" {
		origin = os.Getenv("NEXTAUTH_URL")
	}
	if origin == "" {
		origin = "http://localhost:3000"
	}

	// Create Stripe checkout session
	params := &stripe.CheckoutSessionParams{
		LineItems:     lineItems,
		Mode:          stripe.String(string(stripe.CheckoutSessionModePayment)),
		CustomerEmail: stripe.String(email),
		SuccessURL:    stripe.String(fmt.Sprintf("%s/my-orders?refresh=orders", origin)),
		CancelURL:     stripe.String(fmt.Sprintf("%s/?canceled=true", origin)),
	}
	params.AddMetadata("orderId", strconv.FormatUint(uint64(order.ID), 10))

	sess, err := session.New(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": sess.URL})
}
