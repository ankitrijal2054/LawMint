#!/bin/bash

###############################################################################
# LawMint Build Script
# Builds all microservices and frontend for production deployment
# Usage: bash scripts/build-all.sh
###############################################################################

set -e  # Exit on error

echo "📦 LawMint Build Script"
echo "======================="
echo ""

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
SERVICES=(
  "auth-service"
  "template-service"
  "document-service"
  "ai-service"
  "export-service"
)
FAILED_BUILDS=()
SUCCESSFUL_BUILDS=()

###############################################################################
# Helper Functions
###############################################################################

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

###############################################################################
# Build Microservices
###############################################################################

echo -e "${YELLOW}Step 1: Building Microservices${NC}"
echo "─────────────────────────────────────"

for SERVICE in "${SERVICES[@]}"; do
  log_info "Building $SERVICE..."
  
  SERVICE_PATH="services/$SERVICE"
  
  if [ ! -d "$SERVICE_PATH" ]; then
    log_error "$SERVICE not found at $SERVICE_PATH"
    FAILED_BUILDS+=("$SERVICE")
    continue
  fi
  
  cd "$SERVICE_PATH"
  
  # Install dependencies
  if [ ! -d "node_modules" ]; then
    log_info "  Installing dependencies for $SERVICE..."
    npm install
  fi
  
  # Compile TypeScript
  if ! npm run build; then
    log_error "$SERVICE build failed"
    FAILED_BUILDS+=("$SERVICE")
    cd "$PROJECT_ROOT"
    continue
  fi
  
  # Verify output
  if [ ! -f "lib/index.js" ]; then
    log_error "$SERVICE build succeeded but lib/index.js not found"
    FAILED_BUILDS+=("$SERVICE")
    cd "$PROJECT_ROOT"
    continue
  fi
  
  log_success "$SERVICE built successfully"
  SUCCESSFUL_BUILDS+=("$SERVICE")
  
  cd "$PROJECT_ROOT"
done

echo ""

###############################################################################
# Build Frontend
###############################################################################

echo -e "${YELLOW}Step 2: Building Frontend${NC}"
echo "─────────────────────────────────────"

cd "frontend"

# Install dependencies
if [ ! -d "node_modules" ]; then
  log_info "Installing frontend dependencies..."
  npm install
fi

# Build frontend
if ! npm run build; then
  log_error "Frontend build failed"
  FAILED_BUILDS+=("frontend")
  cd "$PROJECT_ROOT"
else
  if [ ! -d "dist" ]; then
    log_error "Frontend build succeeded but dist/ not found"
    FAILED_BUILDS+=("frontend")
  else
    log_success "Frontend built successfully"
    SUCCESSFUL_BUILDS+=("frontend")
    
    # Show dist folder size
    DIST_SIZE=$(du -sh dist | cut -f1)
    log_info "Frontend dist/ size: $DIST_SIZE"
  fi
fi

cd "$PROJECT_ROOT"

echo ""

###############################################################################
# Summary
###############################################################################

echo -e "${YELLOW}Build Summary${NC}"
echo "─────────────────────────────────────"

if [ ${#SUCCESSFUL_BUILDS[@]} -gt 0 ]; then
  echo -e "${GREEN}Successful builds (${#SUCCESSFUL_BUILDS[@]}):${NC}"
  for item in "${SUCCESSFUL_BUILDS[@]}"; do
    echo "  ✓ $item"
  done
  echo ""
fi

if [ ${#FAILED_BUILDS[@]} -gt 0 ]; then
  echo -e "${RED}Failed builds (${#FAILED_BUILDS[@]}):${NC}"
  for item in "${FAILED_BUILDS[@]}"; do
    echo "  ✗ $item"
  done
  echo ""
  log_error "Build failed. Fix errors above and try again."
  exit 1
else
  echo -e "${GREEN}All builds successful! ✓${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Update frontend/.env.production with Firebase credentials"
  echo "  2. Set Firebase Functions config: firebase functions:config:set openai.api_key='sk-...'"
  echo "  3. Deploy: firebase deploy"
fi

echo ""

