package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"technest-backend/database"

	"github.com/gin-gonic/gin"
)

// ListUserOrders returns orders for the authenticated user.
// GET /api/user/orders
func ListUserOrders(c *gin.Context) {
	email := c.GetString("userEmail")
	if email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please sign in to view your orders"})
		return
	}

	emailLower := strings.ToLower(email)

	var user database.User
	if err := database.DB.Where("email_lower = ?", emailLower).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var orders []database.Order
	database.DB.Where("user_id = ?", user.ID).
		Preload("Items").
		Preload("Items.Product").
		Order("created_at DESC").
		Find(&orders)

	c.JSON(http.StatusOK, gin.H{"orders": orders})
}

// CancelOrder cancels a pending, unpaid order for the authenticated user.
// DELETE /api/user/orders/:id
func CancelOrder(c *gin.Context) {
	email := c.GetString("userEmail")
	if email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please sign in to manage orders"})
		return
	}

	orderIDStr := c.Param("id")
	orderID, err := strconv.ParseUint(orderIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	// Find the order
	var order database.Order
	if err := database.DB.First(&order, uint(orderID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Verify ownership
	emailLower := strings.ToLower(email)
	var user database.User
	if err := database.DB.Where("email_lower = ?", emailLower).First(&user).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to cancel this order"})
		return
	}

	if order.UserID == nil || *order.UserID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to cancel this order"})
		return
	}

	// Only allow cancellation if not paid
	if order.Paid != 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot cancel a paid order"})
		return
	}

	// Update status to cancelled
	database.DB.Model(&order).Update("status", "cancelled")

	// Reload order
	database.DB.First(&order, order.ID)

	c.JSON(http.StatusOK, gin.H{"order": order})
}
