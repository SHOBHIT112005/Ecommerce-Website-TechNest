package handlers

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"net/http"
	"os"
	"strings"
	"time"

	"technest-backend/database"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/scrypt"
)

const scryptKeyLen = 64

// registerRequest is the expected JSON body for POST /api/auth/register.
type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// loginRequest is the expected JSON body for POST /api/auth/login.
type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Register creates a new user account with hashed password.
// POST /api/auth/register
func Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	cleanName := strings.TrimSpace(req.Name)
	cleanEmail := strings.TrimSpace(req.Email)
	cleanPassword := req.Password

	if cleanEmail == "" || !strings.Contains(cleanEmail, "@") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid email is required"})
		return
	}
	if len(cleanPassword) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters"})
		return
	}

	emailLower := strings.ToLower(cleanEmail)

	// Check if user already exists with a password
	var existing database.User
	result := database.DB.Where("email_lower = ?", emailLower).First(&existing)
	if result.Error == nil && existing.PasswordHash != "" {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists. Please sign in."})
		return
	}

	passwordHash, err := hashPassword(cleanPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	// Determine role
	role := "user"
	if isAdminEmail(emailLower) {
		role = "admin"
	}

	now := time.Now()
	if result.Error == nil {
		// Update existing guest user
		database.DB.Model(&existing).Updates(map[string]interface{}{
			"name":          cleanName,
			"email":         cleanEmail,
			"email_lower":   emailLower,
			"password_hash": passwordHash,
			"role":          role,
			"auth_provider": "credentials",
			"is_registered": true,
			"last_login_at": now,
		})
	} else {
		// Create new user
		user := database.User{
			Name:         cleanName,
			Email:        cleanEmail,
			EmailLower:   emailLower,
			PasswordHash: passwordHash,
			Role:         role,
			AuthProvider: "credentials",
			IsRegistered: true,
			LastLoginAt:  &now,
		}
		if err := database.DB.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{"success": true})
}

// Login verifies credentials and returns user info (used by NextAuth authorize callback).
// POST /api/auth/login
func Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	cleanEmail := strings.TrimSpace(req.Email)
	if cleanEmail == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email and password are required"})
		return
	}

	emailLower := strings.ToLower(cleanEmail)

	var user database.User
	result := database.DB.Where("email_lower = ? AND password_hash != ''", emailLower).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !verifyPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Update last login
	now := time.Now()
	database.DB.Model(&user).Update("last_login_at", now)

	c.JSON(http.StatusOK, gin.H{
		"id":    user.ID,
		"email": user.Email,
		"name":  user.Name,
		"role":  user.Role,
		"image": user.Image,
	})
}

// hashPassword creates a scrypt hash compatible with the JS implementation.
// Format: hex(salt):hex(derivedKey)
func hashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	dk, err := scrypt.Key([]byte(password), salt, 32768, 8, 1, scryptKeyLen)
	if err != nil {
		return "", err
	}

	return hex.EncodeToString(salt) + ":" + hex.EncodeToString(dk), nil
}

// verifyPassword checks a password against a stored scrypt hash.
func verifyPassword(password, storedHash string) bool {
	parts := strings.SplitN(storedHash, ":", 2)
	if len(parts) != 2 {
		return false
	}

	salt, err := hex.DecodeString(parts[0])
	if err != nil {
		return false
	}
	originalKey, err := hex.DecodeString(parts[1])
	if err != nil {
		return false
	}

	dk, err := scrypt.Key([]byte(password), salt, 32768, 8, 1, scryptKeyLen)
	if err != nil {
		return false
	}

	return subtle.ConstantTimeCompare(dk, originalKey) == 1
}

// isAdminEmail checks if the email is in the ADMIN_EMAILS env var.
func isAdminEmail(emailLower string) bool {
	adminEmails := strings.TrimSpace(os.Getenv("ADMIN_EMAILS"))
	if adminEmails == "" {
		return false
	}
	for _, e := range strings.Split(adminEmails, ",") {
		if strings.TrimSpace(strings.ToLower(e)) == emailLower {
			return true
		}
	}
	return false
}
