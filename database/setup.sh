#!/bin/bash
# Database Setup Script for Project Management Application
# This script creates the database and applies the schema

set -e  # Exit on error

# Configuration
DB_NAME="${DB_NAME:-project_manager}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Project Management Database Setup"
echo "=========================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL is not installed or not in PATH${NC}"
    exit 1
fi

# Check if database exists
DB_EXISTS=$(psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -lqt | cut -d \| -f 1 | grep -w "$DB_NAME" | wc -l)

if [ "$DB_EXISTS" -eq 0 ]; then
    echo -e "${YELLOW}Database '$DB_NAME' does not exist. Creating...${NC}"
    createdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME"
    echo -e "${GREEN}Database created successfully!${NC}"
else
    echo -e "${YELLOW}Database '$DB_NAME' already exists.${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Dropping existing database...${NC}"
        dropdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME"
        createdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME"
        echo -e "${GREEN}Database recreated successfully!${NC}"
    else
        echo -e "${YELLOW}Keeping existing database. Schema will be updated.${NC}"
    fi
fi

echo ""
echo "=========================================="
echo "Installing Schema"
echo "=========================================="
echo ""

# Determine script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Option 1: Use complete schema file
if [ -f "$SCRIPT_DIR/schema.sql" ]; then
    echo -e "${GREEN}Installing complete schema...${NC}"
    psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "$SCRIPT_DIR/schema.sql"
    echo -e "${GREEN}Schema installed successfully!${NC}"
else
    # Option 2: Run individual migrations
    if [ -d "$SCRIPT_DIR/migrations" ]; then
        echo -e "${GREEN}Running individual migrations...${NC}"
        for migration in "$SCRIPT_DIR/migrations"/*.sql; do
            if [ -f "$migration" ]; then
                echo "Running $(basename "$migration")..."
                psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "$migration"
            fi
        done
        echo -e "${GREEN}All migrations completed!${NC}"
    else
        echo -e "${RED}Error: Neither schema.sql nor migrations directory found${NC}"
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "Verifying Installation"
echo "=========================================="
echo ""

# Count tables
TABLE_COUNT=$(psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
echo -e "${GREEN}Tables created: $TABLE_COUNT${NC}"

# List tables
echo ""
echo "Tables in database:"
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "\dt"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Database Name: $DB_NAME"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "User: $DB_USER"
echo ""
echo "Connection string:"
echo "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "To connect to the database:"
echo "psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME"
echo ""
