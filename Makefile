# =============================================================================
# DIETER PRO - Makefile
# Developer convenience commands
# Usage: make <target>
# =============================================================================

.PHONY: help install dev build start stop clean logs
.PHONY: db-migrate db-seed db-reset db-shell
.PHONY: docker-up docker-down docker-build docker-logs docker-shell
.PHONY: lint type-check test format
.PHONY: deploy-staging deploy-prod

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE  := \033[0;34m
GREEN := \033[0;32m
YELLOW:= \033[1;33m
RED   := \033[0;31m
NC    := \033[0m # No Color

# ============================================================================
# HELP
# ============================================================================

help: ## Show this help message
	@echo ""
	@echo "$(BLUE)DIETER PRO - Development Commands$(NC)"
	@echo "$(BLUE)====================================$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ============================================================================
# SETUP
# ============================================================================

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	pnpm install
	@echo "$(GREEN)Done!$(NC)"

setup: install ## Full first-time setup
	@echo "$(BLUE)Setting up environment...$(NC)"
	@cp -n .env.example .env || true
	@echo "$(YELLOW)Don't forget to fill in your .env file!$(NC)"
	$(MAKE) docker-up
	@sleep 5
	$(MAKE) db-migrate
	$(MAKE) db-seed
	@echo "$(GREEN)Setup complete! Run 'make dev' to start.$(NC)"

# ============================================================================
# DEVELOPMENT
# ============================================================================

dev: ## Start all services in development mode
	@echo "$(BLUE)Starting DIETER PRO in development mode...$(NC)"
	pnpm dev

dev-web: ## Start only the Next.js web app
	pnpm --filter @dieter-pro/web dev

dev-api: ## Start only the Fastify API
	pnpm --filter @dieter-pro/api dev

dev-dsp: ## Start only the Python DSP worker
	cd apps/audio-dsp && uvicorn main:app --reload --port 8000

# ============================================================================
# BUILD
# ============================================================================

build: ## Build all apps for production
	@echo "$(BLUE)Building all apps...$(NC)"
	pnpm build
	@echo "$(GREEN)Build complete!$(NC)"

build-web: ## Build only the Next.js web app
	pnpm --filter @dieter-pro/web build

build-api: ## Build only the Fastify API
	pnpm --filter @dieter-pro/api build

# ============================================================================
# DOCKER
# ============================================================================

docker-up: ## Start all Docker services
	@echo "$(BLUE)Starting Docker services...$(NC)"
	docker compose up -d
	@echo "$(GREEN)Services running!$(NC)"


docker-down: ## Stop all Docker services
	@echo "$(YELLOW)Stopping Docker services...$(NC)"
	docker compose down

docker-build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker compose build

docker-logs: ## Follow Docker logs
	docker compose logs -f

docker-restart: ## Restart all Docker services
	docker compose restart

docker-clean: ## Remove all Docker containers, volumes, images
	@echo "$(RED)WARNING: This will delete all Docker data!$(NC)"
	docker compose down -v --rmi all --remove-orphans

docker-shell-db: ## Open PostgreSQL shell
	docker exec -it dieter-postgres psql -U dieter -d dieter_pro_db

docker-shell-redis: ## Open Redis CLI
	docker exec -it dieter-redis redis-cli

# ============================================================================
# DATABASE
# ============================================================================

db-migrate: ## Run database migrations
	@echo "$(BLUE)Running migrations...$(NC)"
	pnpm --filter @dieter-pro/api db:migrate
	@echo "$(GREEN)Migrations complete!$(NC)"

db-migrate-down: ## Rollback last migration
	pnpm --filter @dieter-pro/api db:migrate:down

db-seed: ## Seed the database with sample data
	@echo "$(BLUE)Seeding database...$(NC)"
	pnpm --filter @dieter-pro/api db:seed
	@echo "$(GREEN)Seeding complete!$(NC)"

db-reset: ## Reset database (drop + migrate + seed)
	@echo "$(RED)Resetting database...$(NC)"
	docker exec -it dieter-postgres psql -U dieter -c "DROP DATABASE IF EXISTS dieter_pro_db;"
	docker exec -it dieter-postgres psql -U dieter -c "CREATE DATABASE dieter_pro_db;"
	$(MAKE) db-migrate
	$(MAKE) db-seed
	@echo "$(GREEN)Database reset!$(NC)"

db-schema: ## Apply schema.sql directly
	docker exec -i dieter-postgres psql -U dieter -d dieter_pro_db < db/schema.sql

# ============================================================================
# CODE QUALITY
# ============================================================================

lint: ## Run ESLint on all packages
	@echo "$(BLUE)Linting...$(NC)"
	pnpm lint

format: ## Format all code with Prettier
	@echo "$(BLUE)Formatting...$(NC)"
	pnpm format

type-check: ## Run TypeScript type checking
	@echo "$(BLUE)Type checking...$(NC)"
	pnpm type-check

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	pnpm test

check: lint type-check ## Run lint + type-check
	@echo "$(GREEN)All checks passed!$(NC)"

# ============================================================================
# CLEANUP
# ============================================================================

clean: ## Clean all build artifacts
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	pnpm clean
	@echo "$(GREEN)Clean!$(NC)"

clean-all: clean ## Clean builds AND node_modules
	@echo "$(RED)Removing node_modules...$(NC)"
	find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +
	@echo "$(GREEN)All clean!$(NC)"

# ============================================================================
# UTILITY
# ============================================================================

status: ## Show status of all running services
	docker compose ps

logs-api: ## Follow API logs
	docker compose logs -f api

logs-web: ## Follow web app logs
	docker compose logs -f web

logs-dsp: ## Follow DSP worker logs
	docker compose logs -f audio-dsp

env-check: ## Validate required env vars are set
	@echo "$(BLUE)Checking environment variables...$(NC)"
	@test -f .env || (echo "$(RED).env file missing! Copy .env.example to .env$(NC)" && exit 1)
	@echo "$(GREEN).env file exists$(NC)"
