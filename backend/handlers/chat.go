package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"technest-backend/database"

	"github.com/gin-gonic/gin"
)

// chatRequest is the expected JSON body for POST /api/chat.
type chatRequest struct {
	Message          string `json:"message"`
	CurrentProductID string `json:"currentProductId"`
}

// compactProduct is a lightweight product representation for chat context.
type compactProduct struct {
	ID          uint     `json:"id"`
	Name        string   `json:"name"`
	Price       float64  `json:"price"`
	Categories  []string `json:"categories"`
	Description string   `json:"description"`
}

// Chat handles AI-powered product recommendations.
// POST /api/chat
func Chat(c *gin.Context) {
	var req chatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	message := strings.TrimSpace(req.Message)
	if message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message is required"})
		return
	}

	// Fetch products for context
	var products []database.Product
	database.DB.Preload("Categories").Limit(80).Find(&products)

	compact := make([]compactProduct, len(products))
	for i, p := range products {
		var catNames []string
		for _, cat := range p.Categories {
			catNames = append(catNames, cat.Name)
		}
		compact[i] = compactProduct{
			ID:          p.ID,
			Name:        p.Name,
			Price:       p.Price,
			Categories:  catNames,
			Description: p.Description,
		}
	}

	// Try OpenRouter first
	answer, err := callOpenRouter(message, compact, req.CurrentProductID)
	if err != nil {
		log.Printf("OpenRouter error: %v", err)
	}

	// Fall back to local matching
	if answer == "" {
		answer = findLocalMatches(message, compact, req.CurrentProductID)
	}

	c.JSON(http.StatusOK, gin.H{"answer": answer})
}

// callOpenRouter calls the OpenRouter API for AI-powered responses.
func callOpenRouter(message string, products []compactProduct, currentProductID string) (string, error) {
	apiKey := os.Getenv("OPENROUTER_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("OPENROUTER_API_KEY not set")
	}

	// Find current product
	currentProductName := "none"
	for _, p := range products {
		if fmt.Sprintf("%d", p.ID) == currentProductID {
			currentProductName = p.Name
			break
		}
	}

	// Build catalog string
	var catalog strings.Builder
	for _, p := range products {
		cats := strings.Join(p.Categories, ", ")
		fmt.Fprintf(&catalog, "- %s | $%.0f | %s\n", p.Name, p.Price, cats)
	}

	model := os.Getenv("OPENROUTER_MODEL")
	if model == "" {
		model = "openrouter/free"
	}

	reqBody := map[string]interface{}{
		"model":       model,
		"max_tokens":  320,
		"temperature": 0.3,
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "You are Technest's shopping assistant. Answer only from the provided catalog. Help users find listed products and recommend compatible catalog products when a current product is provided. Do not invent products. If asked about stock availability, say live stock tracking is not enabled.",
			},
			{
				"role":    "user",
				"content": fmt.Sprintf("Catalog:\n%s\nCurrent product: %s\n\nCustomer question: %s", catalog.String(), currentProductName, message),
			},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	referer := os.Getenv("NEXTAUTH_URL")
	if referer == "" {
		referer = "http://localhost:3000"
	}

	httpReq, err := http.NewRequest("POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewReader(jsonBody))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("HTTP-Referer", referer)
	httpReq.Header.Set("X-Title", "Technest Ecommerce")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("OpenRouter returned %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if len(result.Choices) > 0 {
		return result.Choices[0].Message.Content, nil
	}

	return "", nil
}

// findLocalMatches provides a fallback product search when OpenRouter is unavailable.
func findLocalMatches(message string, products []compactProduct, currentProductID string) string {
	query := strings.ToLower(message)

	// Check for recommendation-type queries with a current product
	var currentProduct *compactProduct
	for i, p := range products {
		if fmt.Sprintf("%d", p.ID) == currentProductID {
			currentProduct = &products[i]
			break
		}
	}

	if currentProduct != nil {
		keywords := []string{"recommend", "pair", "with", "accessor", "setup", "bundle", "match"}
		isRecommendation := false
		for _, kw := range keywords {
			if strings.Contains(query, kw) {
				isRecommendation = true
				break
			}
		}

		if isRecommendation {
			currentCats := make(map[string]bool)
			for _, cat := range currentProduct.Categories {
				currentCats[cat] = true
			}

			type scored struct {
				product compactProduct
				score   int
			}

			var recommendations []scored
			for _, p := range products {
				if fmt.Sprintf("%d", p.ID) == currentProductID {
					continue
				}
				score := 0
				for _, cat := range p.Categories {
					if currentCats[cat] {
						score++
					}
					if cat == "Accessories" {
						score++
					}
					if currentCats["Gaming"] && cat == "Gaming" {
						score++
					}
				}
				if score > 0 {
					recommendations = append(recommendations, scored{product: p, score: score})
				}
			}

			// Sort by score descending
			for i := 0; i < len(recommendations); i++ {
				for j := i + 1; j < len(recommendations); j++ {
					if recommendations[j].score > recommendations[i].score ||
						(recommendations[j].score == recommendations[i].score && recommendations[j].product.Price < recommendations[i].product.Price) {
						recommendations[i], recommendations[j] = recommendations[j], recommendations[i]
					}
				}
			}

			if len(recommendations) > 4 {
				recommendations = recommendations[:4]
			}

			if len(recommendations) > 0 {
				var names []string
				for _, r := range recommendations {
					names = append(names, fmt.Sprintf("%s ($%.0f)", r.product.Name, r.product.Price))
				}
				return fmt.Sprintf("For %s, these pair well: %s.", currentProduct.Name, strings.Join(names, "; "))
			}
		}
	}

	// General product search
	words := strings.Fields(query)
	var matches []compactProduct
	for _, p := range products {
		text := strings.ToLower(fmt.Sprintf("%s %s %s", p.Name, p.Description, strings.Join(p.Categories, " ")))
		for _, word := range words {
			if strings.Contains(text, word) {
				matches = append(matches, p)
				break
			}
		}
	}

	if len(matches) == 0 {
		return "I could not find a matching listed product. Try a product name, category, or use words like gaming, laptop, phone, mouse, watch, or monitor."
	}

	if len(matches) > 5 {
		matches = matches[:5]
	}

	var lines []string
	for _, p := range matches {
		lines = append(lines, fmt.Sprintf("%s: $%.0f.", p.Name, p.Price))
	}
	return strings.Join(lines, "\n")
}
