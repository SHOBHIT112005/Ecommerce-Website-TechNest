package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// jwtClaims represents the decoded payload of a NextAuth JWT.
type jwtClaims struct {
	Sub    string `json:"sub"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	Role   string `json:"role"`
	UserID string `json:"userId"`
}

// RequireAuth validates either:
// 1. X-User-Email header (from trusted Next.js proxy), OR
// 2. Authorization: Bearer <jwt> header (direct API calls)
//
// On success it sets "userId", "userEmail", "userName", and "userRole" in the Gin context.
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Option 1: Trusted proxy headers from Next.js API routes
		proxyEmail := c.GetHeader("X-User-Email")
		if proxyEmail != "" {
			c.Set("userEmail", proxyEmail)
			c.Set("userName", c.GetHeader("X-User-Name"))
			c.Set("userRole", c.GetHeader("X-User-Role"))
			c.Set("userId", c.GetHeader("X-User-Id"))
			c.Next()
			return
		}

		// Option 2: Bearer JWT token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			return
		}

		token := parts[1]
		claims, err := verifyJWT(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// Set user context
		userID := claims.UserID
		if userID == "" {
			userID = claims.Sub
		}
		c.Set("userId", userID)
		c.Set("userEmail", claims.Email)
		c.Set("userName", claims.Name)
		c.Set("userRole", claims.Role)

		c.Next()
	}
}

// verifyJWT verifies a HS256 JWT signed with NEXTAUTH_SECRET.
func verifyJWT(tokenStr string) (*jwtClaims, error) {
	secret := os.Getenv("NEXTAUTH_SECRET")
	if secret == "" {
		return nil, ErrNoSecret
	}

	parts := strings.Split(tokenStr, ".")
	if len(parts) != 3 {
		return nil, ErrInvalidToken
	}

	// Decode and verify signature
	headerPayload := parts[0] + "." + parts[1]
	signature, err := base64URLDecode(parts[2])
	if err != nil {
		return nil, ErrInvalidToken
	}

	// Derive signing key (NextAuth uses HMAC-SHA256 with the secret)
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(headerPayload))
	expectedSig := mac.Sum(nil)

	if !hmac.Equal(signature, expectedSig) {
		return nil, ErrInvalidSignature
	}

	// Decode payload
	payload, err := base64URLDecode(parts[1])
	if err != nil {
		return nil, ErrInvalidToken
	}

	var claims jwtClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, ErrInvalidToken
	}

	return &claims, nil
}

// base64URLDecode decodes base64url-encoded data (no padding).
func base64URLDecode(s string) ([]byte, error) {
	// Add padding if needed
	switch len(s) % 4 {
	case 2:
		s += "=="
	case 3:
		s += "="
	}
	return base64.URLEncoding.DecodeString(s)
}

// Sentinel errors for JWT validation.
var (
	ErrNoSecret         = errString("NEXTAUTH_SECRET not configured")
	ErrInvalidToken     = errString("invalid token format")
	ErrInvalidSignature = errString("invalid token signature")
)

type errString string

func (e errString) Error() string { return string(e) }
