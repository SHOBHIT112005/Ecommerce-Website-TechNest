package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB is the global database connection instance.
var DB *gorm.DB

// Connect establishes a connection to PostgreSQL with retry logic.
// It reads the DATABASE_URL environment variable and retries up to
// maxRetries times with exponential backoff — important for Docker
// where postgres may take a few seconds to become ready.
func Connect() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	var db *gorm.DB
	var err error

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	maxRetries := 10
	for i := 0; i < maxRetries; i++ {
		db, err = gorm.Open(postgres.Open(dsn), gormConfig)
		if err == nil {
			// Verify connection is alive
			sqlDB, pingErr := db.DB()
			if pingErr == nil {
				pingErr = sqlDB.Ping()
			}
			if pingErr == nil {
				break
			}
			err = pingErr
		}

		waitTime := time.Duration(i+1) * 2 * time.Second
		log.Printf("Failed to connect to database (attempt %d/%d): %v. Retrying in %v...", i+1, maxRetries, err, waitTime)
		time.Sleep(waitTime)
	}

	if err != nil {
		log.Fatalf("Could not connect to database after %d attempts: %v", maxRetries, err)
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Failed to get underlying sql.DB: %v", err)
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)

	DB = db
	log.Println("Connected to PostgreSQL successfully")

	// Run auto-migration to create/update tables
	if err := runMigrations(); err != nil {
		log.Fatalf("Auto-migration failed: %v", err)
	}
}

// runMigrations creates or updates all database tables based on GORM model structs.
func runMigrations() error {
	log.Println("Running database migrations...")

	err := DB.AutoMigrate(
		&User{},
		&Category{},
		&Product{},
		&Order{},
		&OrderItem{},
	)
	if err != nil {
		return fmt.Errorf("auto-migrate failed: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// Ping checks if the database connection is alive.
func Ping() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}
