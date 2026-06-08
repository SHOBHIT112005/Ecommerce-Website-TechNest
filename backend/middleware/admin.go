package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireAdmin checks that the authenticated user has the "admin" role.
// Must be used AFTER RequireAuth() middleware.
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("userRole")
		if role != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
			return
		}
		c.Next()
	}
}
