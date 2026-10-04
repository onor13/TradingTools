#!/bin/bash

# Playwright Agent Runner
# Automatically detects browser automation tasks and uses the playwright agent.
#
# Usage: ./run-playwright.sh "your task description"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_ENV="${NODE_ENV:-development}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to detect if task requires Playwright
detect_playwright_task() {
    local prompt="$1"
    local lower_prompt=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')

    # High-priority keywords that definitely indicate browser automation
    local critical_keywords=(
        "e2e"
        "end-to-end"
        "browser automation"
        "playwright test"
        "automate login"
        "test checkout"
    )

    # Medium-priority keywords
    local medium_keywords=(
        "navigate"
        "click"
        "fill"
        "login"
        "logout"
        "screenshot"
        "mobile test"
        "verify flow"
    )

    local critical_count=0
    local medium_count=0

    for keyword in "${critical_keywords[@]}"; do
        if [[ "$lower_prompt" == *"$keyword"* ]]; then
            ((critical_count++))
        fi
    done

    for keyword in "${medium_keywords[@]}"; do
        if [[ "$lower_prompt" == *"$keyword"* ]]; then
            ((medium_count++))
        fi
    done

    # Decision logic: use Playwright if critical keyword found OR 2+ medium keywords
    if [[ $critical_count -gt 0 ]] || [[ $medium_count -ge 2 ]]; then
        return 0 # Use Playwright
    else
        return 1 # Don't use Playwright
    fi
}

# Function to enhance prompt with Playwright-specific instructions
enhance_prompt() {
    local original="$1"

    # Add Playwright-specific context based on detected patterns
    if [[ "$original" == *"login"* ]] || [[ "$original" == *"auth"* ]]; then
        echo "$original | Include authentication flow with storage state persistence for session reuse."
    elif [[ "$original" == *"mobile"* ]] || [[ "$original" == *"device"* ]]; then
        echo "$original | Use mobile device emulation (iPhone SE) for testing."
    elif [[ "$original" == *"screenshot"* ]] || [[ "$original" == *"capture"* ]]; then
        echo "$original | Capture screenshots at each step for debugging and failure analysis."
    elif [[ "$original" == *"api"* ]] || [[ "$original" == *"mock"* ]]; then
        echo "$original | Mock API responses using Playwright's route() for reliable testing."
    else
        echo "$original"
    fi
}

# Main execution
main() {
    local prompt="$1"

    if [[ -z "$prompt" ]]; then
        print_error "No task description provided."
        echo ""
        echo "Usage: $0 \"your browser automation task\""
        echo ""
        echo "Examples:"
        echo "  $0 \"test the login flow\""
        echo "  $0 \"automate checkout process with payment\""
        echo "  $0 \"verify mobile responsive design on product page\""
        exit 1
    fi

    print_info "Analyzing task: $prompt"

    # Detect if Playwright should be used
    if detect_playwright_task "$prompt"; then
        print_success "Browser automation detected! Using Playwright agent."

        # Enhance the prompt
        local enhanced_prompt=$(enhance_prompt "$prompt")

        print_info "Enhanced prompt:"
        echo "  $enhanced_prompt"
        echo ""

        # Launch the playwright agent
        print_info "Launching Playwright agent..."
        echo ""

        # Use the Agent tool with playwright subagent
        local result=$(Agent description="Playwright E2E test" prompt="$enhanced_prompt")

        print_success "Playwright agent completed!"
        echo ""
        echo "$result"

    else
        print_warning "No browser automation detected."
        print_info "Task will be handled by general agent."
        echo ""

        # Could launch other agents here
    fi
}

# Run main with all arguments
main "$@"
