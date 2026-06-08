package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"technest-backend/database"

	"github.com/gin-gonic/gin"
)

// ListProducts returns all products or specific products by IDs.
// GET /api/products           → all products with categories
// GET /api/products?ids=1,2,3 → specific products by ID
func ListProducts(c *gin.Context) {
	idsParam := c.Query("ids")

	if idsParam != "" {
		// Fetch specific products by IDs
		idStrs := strings.Split(idsParam, ",")
		var ids []uint
		for _, s := range idStrs {
			s = strings.TrimSpace(s)
			if s == "" {
				continue
			}
			id, err := strconv.ParseUint(s, 10, 64)
			if err != nil {
				continue
			}
			ids = append(ids, uint(id))
		}

		if len(ids) == 0 {
			c.JSON(http.StatusOK, []database.Product{})
			return
		}

		var products []database.Product
		if err := database.DB.Preload("Categories").Where("id IN ?", ids).Find(&products).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
			return
		}
		c.JSON(http.StatusOK, products)
		return
	}

	// Fetch all products
	var products []database.Product
	if err := database.DB.Preload("Categories").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}
	c.JSON(http.StatusOK, products)
}

// GetProduct returns a single product by ID.
// GET /api/products/:id
func GetProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var product database.Product
	if err := database.DB.Preload("Categories").First(&product, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	c.JSON(http.StatusOK, product)
}
