package database

import (
	"time"
)

// User represents a registered or guest user in the system.
// Replaces the Mongoose User model.
// Relationships: User has many Orders (1:N via UserID foreign key on Order).
type User struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	Name         string     `gorm:"type:varchar(255);default:''" json:"name"`
	Email        string     `gorm:"type:varchar(255);not null" json:"email"`
	EmailLower   string     `gorm:"type:varchar(255);not null;uniqueIndex" json:"email_lower"`
	Image        string     `gorm:"type:varchar(512);default:''" json:"image"`
	PasswordHash string     `gorm:"type:varchar(255);default:''" json:"-"`
	Role         string     `gorm:"type:varchar(20);default:'user';not null" json:"role"`
	AuthProvider string     `gorm:"type:varchar(50);default:'guest'" json:"auth_provider"`
	IsRegistered bool       `gorm:"default:false" json:"is_registered"`
	LastLoginAt  *time.Time `json:"last_login_at"`
	Orders       []Order    `gorm:"foreignKey:UserID" json:"orders,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// Product represents a product in the catalog.
// Replaces the Mongoose Product model.
// Relationships: Product has many Categories (M:N via product_categories join table).
type Product struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Name        string     `gorm:"type:varchar(255);not null" json:"name"`
	Description string     `gorm:"type:text" json:"description"`
	Price       float64    `gorm:"type:decimal(10,2);not null" json:"price"`
	Picture     string     `gorm:"type:varchar(512)" json:"picture"`
	Categories  []Category `gorm:"many2many:product_categories;" json:"categories"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// Category represents a product category (e.g., Laptops, Phones, Accessories, Gaming).
// New table — replaces the categories: [String] array from MongoDB.
// Relationships: Category has many Products (M:N via product_categories join table).
type Category struct {
	ID       uint      `gorm:"primaryKey" json:"id"`
	Name     string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"name"`
	Products []Product `gorm:"many2many:product_categories;" json:"products,omitempty"`
}

// Order represents a customer order.
// Replaces the Mongoose Order model.
// Relationships:
//   - Order belongs to User (N:1 via UserID foreign key)
//   - Order has many OrderItems (1:N via OrderID foreign key on OrderItem)
type Order struct {
	ID          uint        `gorm:"primaryKey" json:"id"`
	UserID      *uint       `gorm:"index" json:"user_id"`
	User        *User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Name        string      `gorm:"type:varchar(255)" json:"name"`
	Email       string      `gorm:"type:varchar(255)" json:"email"`
	Address     string      `gorm:"type:varchar(500)" json:"address"`
	City        string      `gorm:"type:varchar(255)" json:"city"`
	Status      string      `gorm:"type:varchar(20);default:'pending';not null" json:"status"`
	Subtotal    float64     `gorm:"type:decimal(10,2);default:0" json:"subtotal"`
	DeliveryFee float64     `gorm:"type:decimal(10,2);default:5" json:"delivery_fee"`
	TotalAmount float64     `gorm:"type:decimal(10,2);default:0" json:"total_amount"`
	Paid        int         `gorm:"default:0" json:"paid"`
	Items       []OrderItem `gorm:"foreignKey:OrderID" json:"items"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

// OrderItem represents a line item within an order.
// New table — replaces the products: Object (embedded Stripe line_items JSON) from MongoDB.
// Relationships:
//   - OrderItem belongs to Order (N:1 via OrderID)
//   - OrderItem belongs to Product (N:1 via ProductID)
type OrderItem struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	OrderID   uint    `gorm:"not null;index" json:"order_id"`
	ProductID uint    `gorm:"not null;index" json:"product_id"`
	Product   Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Quantity  int     `gorm:"not null;default:1" json:"quantity"`
	UnitPrice float64 `gorm:"type:decimal(10,2);not null" json:"unit_price"`
}
