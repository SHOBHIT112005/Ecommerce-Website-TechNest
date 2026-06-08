package handlers

import (
	"math"
	"net/http"
	"strconv"
	"strings"

	"technest-backend/database"

	"github.com/gin-gonic/gin"
)

// AdminListProducts returns all products for admin management.
// GET /api/admin/products
func AdminListProducts(c *gin.Context) {
	var products []database.Product
	database.DB.Preload("Categories").Order("created_at DESC, name ASC").Find(&products)
	c.JSON(http.StatusOK, gin.H{"products": products})
}

// adminCreateProductRequest is the body for POST /api/admin/products.
type adminCreateProductRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Price       float64  `json:"price"`
	Categories  []string `json:"categories"`
	Picture     string   `json:"picture"`
}

// AdminCreateProduct creates a new product.
// POST /api/admin/products
func AdminCreateProduct(c *gin.Context) {
	var req adminCreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	cleanName := strings.TrimSpace(req.Name)
	cleanDesc := strings.TrimSpace(req.Description)
	cleanPicture := strings.TrimSpace(req.Picture)

	if cleanName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product name is required"})
		return
	}
	if cleanDesc == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product description is required"})
		return
	}
	if req.Price < 0 || math.IsNaN(req.Price) || math.IsInf(req.Price, 0) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid product price is required"})
		return
	}
	if len(req.Categories) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one category is required"})
		return
	}
	if !strings.HasPrefix(cleanPicture, "/products/") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Picture path must start with /products/"})
		return
	}

	// Find or create categories
	var categories []database.Category
	for _, catName := range req.Categories {
		catName = strings.TrimSpace(catName)
		if catName == "" {
			continue
		}
		var cat database.Category
		database.DB.Where("name = ?", catName).FirstOrCreate(&cat, database.Category{Name: catName})
		categories = append(categories, cat)
	}

	product := database.Product{
		Name:        cleanName,
		Description: cleanDesc,
		Price:       req.Price,
		Picture:     cleanPicture,
		Categories:  categories,
	}

	if err := database.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"product": product})
}

// AdminListOrders returns all orders with optional status filter.
// GET /api/admin/orders?status=pending&limit=50
func AdminListOrders(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}

	statusFilter := c.Query("status")

	query := database.DB.Preload("Items").Preload("Items.Product")

	if statusFilter != "" {
		validStatuses := map[string]bool{"pending": true, "completed": true, "cancelled": true}
		if validStatuses[statusFilter] {
			query = query.Where("status = ?", statusFilter)
		}
	}

	var orders []database.Order
	query.Order("created_at DESC").Limit(limit).Find(&orders)

	c.JSON(http.StatusOK, gin.H{"orders": orders})
}

// adminUpdateOrderRequest is the body for PATCH /api/admin/orders.
type adminUpdateOrderRequest struct {
	OrderID uint    `json:"orderId"`
	Status  string  `json:"status"`
	Paid    *int    `json:"paid"`
}

// AdminUpdateOrder updates an order's status and/or paid flag.
// PATCH /api/admin/orders
func AdminUpdateOrder(c *gin.Context) {
	var req adminUpdateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if req.OrderID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "orderId is required"})
		return
	}

	updates := make(map[string]interface{})

	if req.Status != "" {
		validStatuses := map[string]bool{"pending": true, "completed": true, "cancelled": true}
		if !validStatuses[req.Status] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status value"})
			return
		}
		updates["status"] = req.Status
		if req.Status == "completed" && req.Paid == nil {
			paidVal := 1
			req.Paid = &paidVal
		}
	}

	if req.Paid != nil {
		if *req.Paid != 0 {
			updates["paid"] = 1
		} else {
			updates["paid"] = 0
		}
	}

	result := database.DB.Model(&database.Order{}).Where("id = ?", req.OrderID).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	var order database.Order
	database.DB.Preload("Items").Preload("Items.Product").First(&order, req.OrderID)
	c.JSON(http.StatusOK, gin.H{"order": order})
}

// adminCreateOrderRequest is the body for POST /api/admin/orders.
type adminCreateOrderRequest struct {
	Name        string  `json:"name"`
	Email       string  `json:"email"`
	Address     string  `json:"address"`
	City        string  `json:"city"`
	Subtotal    float64 `json:"subtotal"`
	DeliveryFee float64 `json:"deliveryFee"`
	Status      string  `json:"status"`
	Paid        *int    `json:"paid"`
}

// AdminCreateOrder creates a manual order (admin-only).
// POST /api/admin/orders
func AdminCreateOrder(c *gin.Context) {
	var req adminCreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	name := strings.TrimSpace(req.Name)
	email := strings.TrimSpace(req.Email)
	if name == "" || email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name and email are required"})
		return
	}
	if !strings.Contains(email, "@") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid email is required"})
		return
	}

	subtotal := math.Max(0, req.Subtotal)
	delFee := math.Max(0, req.DeliveryFee)

	status := req.Status
	validStatuses := map[string]bool{"pending": true, "completed": true, "cancelled": true}
	if !validStatuses[status] {
		status = "pending"
	}

	paid := 0
	if req.Paid != nil {
		if *req.Paid != 0 {
			paid = 1
		}
	} else if status == "completed" {
		paid = 1
	}

	// Find or create user
	emailLower := strings.ToLower(email)
	var user database.User
	result := database.DB.Where("email_lower = ?", emailLower).First(&user)
	if result.Error != nil {
		user = database.User{
			Name:         name,
			Email:        email,
			EmailLower:   emailLower,
			AuthProvider: "admin",
			IsRegistered: false,
			Role:         "user",
		}
		database.DB.Create(&user)
	}

	order := database.Order{
		UserID:      &user.ID,
		Name:        name,
		Email:       email,
		Address:     strings.TrimSpace(req.Address),
		City:        strings.TrimSpace(req.City),
		Status:      status,
		Subtotal:    subtotal,
		DeliveryFee: delFee,
		TotalAmount: subtotal + delFee,
		Paid:        paid,
	}

	if err := database.DB.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"order": order})
}

// AdminDeleteOrder deletes an order.
// DELETE /api/admin/orders?orderId=123
func AdminDeleteOrder(c *gin.Context) {
	orderIDStr := c.Query("orderId")
	if orderIDStr == "" {
		// Also check body
		var body struct {
			OrderID uint `json:"orderId"`
		}
		if err := c.ShouldBindJSON(&body); err == nil && body.OrderID > 0 {
			orderIDStr = strconv.FormatUint(uint64(body.OrderID), 10)
		}
	}

	if orderIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "orderId is required"})
		return
	}

	orderID, err := strconv.ParseUint(orderIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid orderId"})
		return
	}

	result := database.DB.Delete(&database.Order{}, uint(orderID))
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete order"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Also delete related order items
	database.DB.Where("order_id = ?", uint(orderID)).Delete(&database.OrderItem{})

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// statsResponse represents the admin dashboard statistics.
type statsResponse struct {
	Summary      statsSummary       `json:"summary"`
	Users        statsUsers         `json:"users"`
	MonthlySales []monthlySaleEntry `json:"monthlySales"`
	RecentOrders []database.Order   `json:"recentOrders"`
}

type statsSummary struct {
	TotalOrders     int64   `json:"totalOrders"`
	PaidOrders      int64   `json:"paidOrders"`
	PendingOrders   int64   `json:"pendingOrders"`
	CompletedOrders int64   `json:"completedOrders"`
	CancelledOrders int64   `json:"cancelledOrders"`
	TotalRevenue    float64 `json:"totalRevenue"`
	AvgOrderValue   float64 `json:"averageOrderValue"`
}

type statsUsers struct {
	TotalUsers      int64 `json:"totalUsers"`
	RegisteredUsers int64 `json:"registeredUsers"`
	GuestUsers      int64 `json:"guestUsers"`
}

type monthlySaleEntry struct {
	Year    int     `json:"year"`
	Month   int     `json:"month"`
	Revenue float64 `json:"revenue"`
	Orders  int64   `json:"orders"`
}

// AdminStats returns dashboard analytics.
// GET /api/admin/stats
func AdminStats(c *gin.Context) {
	var summary statsSummary

	// Total orders
	database.DB.Model(&database.Order{}).Count(&summary.TotalOrders)
	database.DB.Model(&database.Order{}).Where("paid = 1").Count(&summary.PaidOrders)
	database.DB.Model(&database.Order{}).Where("status = 'pending'").Count(&summary.PendingOrders)
	database.DB.Model(&database.Order{}).Where("status = 'completed'").Count(&summary.CompletedOrders)
	database.DB.Model(&database.Order{}).Where("status = 'cancelled'").Count(&summary.CancelledOrders)

	// Revenue
	var revenue struct{ Total float64 }
	database.DB.Model(&database.Order{}).
		Where("paid = 1").
		Select("COALESCE(SUM(total_amount), 0) as total").
		Scan(&revenue)
	summary.TotalRevenue = revenue.Total

	// Average order value
	var avg struct{ Avg float64 }
	database.DB.Model(&database.Order{}).
		Select("COALESCE(AVG(total_amount), 0) as avg").
		Scan(&avg)
	summary.AvgOrderValue = avg.Avg

	// User stats
	var users statsUsers
	database.DB.Model(&database.User{}).Count(&users.TotalUsers)
	database.DB.Model(&database.User{}).Where("is_registered = true").Count(&users.RegisteredUsers)
	users.GuestUsers = users.TotalUsers - users.RegisteredUsers

	// Monthly sales (last 6 months)
	var monthlySales []monthlySaleEntry
	database.DB.Model(&database.Order{}).
		Where("paid = 1").
		Select("EXTRACT(YEAR FROM created_at) as year, EXTRACT(MONTH FROM created_at) as month, SUM(total_amount) as revenue, COUNT(*) as orders").
		Group("year, month").
		Order("year DESC, month DESC").
		Limit(6).
		Scan(&monthlySales)

	// Recent orders
	var recentOrders []database.Order
	database.DB.Preload("Items").Preload("Items.Product").
		Order("created_at DESC").
		Limit(10).
		Find(&recentOrders)

	c.JSON(http.StatusOK, statsResponse{
		Summary:      summary,
		Users:        users,
		MonthlySales: monthlySales,
		RecentOrders: recentOrders,
	})
}
