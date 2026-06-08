package handlers

import (
	"net/http"
	"strconv"

	"technest-backend/database"
	"technest-backend/services"

	"github.com/gin-gonic/gin"
)

// getCartSession returns the session ID for cart operations.
// Uses authenticated user ID if available, otherwise a cookie-based guest session.
func getCartSession(c *gin.Context) string {
	// If user is authenticated, use their user ID
	if userID := c.GetString("userId"); userID != "" {
		return "user:" + userID
	}

	// Otherwise, use a guest session cookie
	sessionID, err := c.Cookie("cart_session")
	if err != nil || sessionID == "" {
		sessionID = services.GenerateSessionID()
		c.SetCookie("cart_session", sessionID, 86400, "/", "", false, true)
	}
	return "guest:" + sessionID
}

// cartItemResponse is a single item in the cart response.
type cartItemResponse struct {
	ProductID uint             `json:"product_id"`
	Quantity  int              `json:"quantity"`
	Product   *database.Product `json:"product,omitempty"`
}

// GetCart returns the current cart contents with product details.
// GET /api/cart
func GetCart(c *gin.Context) {
	sessionID := getCartSession(c)
	ctx := c.Request.Context()

	cartMap, err := services.GetCart(ctx, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get cart"})
		return
	}

	if len(cartMap) == 0 {
		c.JSON(http.StatusOK, gin.H{"items": []cartItemResponse{}, "count": 0})
		return
	}

	// Fetch product details
	var productIDs []uint
	for pid := range cartMap {
		productIDs = append(productIDs, pid)
	}

	var products []database.Product
	database.DB.Preload("Categories").Where("id IN ?", productIDs).Find(&products)

	productMap := make(map[uint]*database.Product)
	for i := range products {
		productMap[products[i].ID] = &products[i]
	}

	var items []cartItemResponse
	totalCount := 0
	for pid, qty := range cartMap {
		item := cartItemResponse{
			ProductID: pid,
			Quantity:  qty,
			Product:   productMap[pid],
		}
		items = append(items, item)
		totalCount += qty
	}

	c.JSON(http.StatusOK, gin.H{"items": items, "count": totalCount})
}

// addToCartRequest is the expected JSON body for POST /api/cart.
type addToCartRequest struct {
	ProductID uint `json:"product_id" binding:"required"`
}

// AddToCart adds a product to the cart (increments quantity by 1).
// POST /api/cart
func AddToCart(c *gin.Context) {
	var req addToCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product_id is required"})
		return
	}

	// Verify product exists
	var product database.Product
	if err := database.DB.First(&product, req.ProductID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	sessionID := getCartSession(c)
	qty, err := services.AddToCart(c.Request.Context(), sessionID, req.ProductID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Added to cart",
		"product_id": req.ProductID,
		"quantity":   qty,
	})
}

// updateCartRequest is the expected JSON body for PUT /api/cart.
type updateCartRequest struct {
	ProductID uint `json:"product_id" binding:"required"`
	Quantity  int  `json:"quantity"`
}

// UpdateCart sets the exact quantity for a product in the cart.
// PUT /api/cart
func UpdateCart(c *gin.Context) {
	var req updateCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product_id is required"})
		return
	}

	sessionID := getCartSession(c)
	if err := services.UpdateCartItem(c.Request.Context(), sessionID, req.ProductID, req.Quantity); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Cart updated",
		"product_id": req.ProductID,
		"quantity":   req.Quantity,
	})
}

// RemoveFromCart removes one unit of a product from the cart.
// DELETE /api/cart/:productId
func RemoveFromCart(c *gin.Context) {
	pidStr := c.Param("productId")
	pid, err := strconv.ParseUint(pidStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	sessionID := getCartSession(c)
	if err := services.RemoveFromCart(c.Request.Context(), sessionID, uint(pid)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from cart", "product_id": pid})
}

// ClearCart removes all items from the cart.
// DELETE /api/cart
func ClearCart(c *gin.Context) {
	sessionID := getCartSession(c)
	if err := services.ClearCart(c.Request.Context(), sessionID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart cleared"})
}
