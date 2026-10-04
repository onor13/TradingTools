# Automated Playwright Workflow

This workflow automatically detects browser automation tasks and uses the Playwright agent without requiring explicit invocation.

## Quick Start

### Method 1: Direct Script Usage (Recommended)

```bash
# Just describe your browser automation task - the system detects it automatically!

./run-playwright.sh "test the login flow"
./run-playwright.sh "automate checkout with payment processing"
./run-playwright.sh "verify mobile responsive design on product page"
```

### Method 2: Node.js Detector

```bash
node playwright-detector.js "test the login flow"
node playwright-detector.js "automate clicking through checkout process"
```

### Method 3: Agent Tool with Auto-Detection

```bash
# The agent will auto-detect Playwright needs from your description
Agent(description="test login", prompt="automate logging into the website")

Agent(description="e2e test", prompt="verify checkout flow works end-to-end")
```

## How Auto-Detection Works

The system automatically detects Playwright tasks using keyword matching:

### High-Confidence Triggers (Critical Keywords)
These keywords **always** trigger Playwright:
- `e2e`, `end-to-end`
- `browser automation`
- `playwright test`
- `automate login`
- `test checkout`

### Medium-Confidence Triggers (Pattern Matching)
These keywords trigger Playwright when **2+ are present**:
- `navigate`, `goto`
- `click`, `fill`, `type`, `input`
- `login`, `logout`, `auth`, `session`
- `screenshot`, `capture`, `record`
- `mobile`, `device`, `responsive`
- `verify`, `assert`, `expect`, `check`

### Examples

| Input | Detected? | Reason |
|-------|-----------|--------|
| `"test the login flow"` | ✅ Yes | Contains `login` + `test` |
| `"automate checkout process"` | ✅ Yes | Contains `checkout`, `automate` |
| `"navigate to page and click button"` | ✅ Yes | Contains `navigate`, `click` (2 keywords) |
| `"write a function to calculate sum"` | ❌ No | No browser automation keywords |

## Enhanced Prompting

The system automatically enhances your prompts with Playwright-specific instructions:

```bash
# Input
./run-playwright.sh "test login with auth"

# Auto-enhanced prompt sent to Playwright agent
"test login with auth | Include authentication flow with storage state persistence for session reuse."

# Input
./run-playwright.sh "mobile test on product page"

# Auto-enhanced prompt
"mobile test on product page | Use mobile device emulation (iPhone SE) for testing."

# Input
./run-playwright.sh "screenshot the dashboard"

# Auto-enhanced prompt
"screenshot the dashboard | Capture screenshots at each step for debugging and failure analysis."
```

## Configuration Options

### Environment Variables

Set these in your `.env` file for custom behavior:

```bash
# Enable/disable auto-detection (default: true)
PLAYWRIGHT_AUTO_DETECT=true

# Custom keyword thresholds
PLAYWRIGHT_MIN_KEYWORDS=2
PLAYWRIGHT_CRITICAL_THRESHOLD=1

# Playwright configuration
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_BROWSER=chromium  # or firefox, webkit
```

### Custom Keyword Detection

Edit `.agents/playwright-detector.js` to add your own keywords:

```javascript
// Add custom keywords
const PLAYWRIGHT_KEYWORDS = [
  // ... existing keywords ...
  'your-custom-keyword-1',
  'your-custom-keyword-2'
];

// Add custom patterns
const PROMPT_KEYWORDS = [
  // ... existing patterns ...
  'your-custom-pattern-1',
  'your-custom-pattern-2'
];
```

## Integration Examples

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Automated E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run automated Playwright tests
        run: |
          # Auto-detect and run browser automation tasks
          ./run-playwright.sh "test all user flows"
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-results
          path: |
            playwright-report/
            trace.zip
```

### Custom Workflow Script

Create a workflow that auto-detects tasks:

```javascript
// .agents/automated-workflow.js
const { detectPlaywrightTask } = require('./playwright-detector');

async function processTask(task) {
  const detection = detectPlaywrightTask(task.description);
  
  if (detection.shouldUsePlaywright) {
    // Use Playwright agent automatically
    return await Agent({
      description: 'Playwright E2E test',
      prompt: task.description,
      isolation: 'worktree'
    });
  } else {
    // Use general agent for other tasks
    return await Agent({
      description: 'General task',
      prompt: task.description
    });
  }
}

// Usage with a queue of tasks
const tasks = [
  { description: "test login flow", type: 'browser' },
  { description: "calculate fibonacci sequence", type: 'general' }
];

for (const task of tasks) {
  const result = await processTask(task);
  console.log(`Completed: ${task.description}`);
}
```

### CLI Tool Wrapper

Create a simple CLI that auto-detects:

```bash
#!/bin/bash
# .agents/automated-cli.sh

TASK="$1"

if [ -z "$TASK" ]; then
  echo "Usage: ./automated-cli.sh \"your task\""
  exit 1
fi

# Auto-detect and route to appropriate agent
if ./run-playwright.sh --detect "$TASK"; then
  exit $?
else
  # Fall back to general agent
  Agent description="General task" prompt="$TASK"
fi
```

## Best Practices

### 1. Be Descriptive in Your Prompts

The auto-detection works best with clear, descriptive prompts:

```bash
# Good - will be detected and enhanced
./run-playwright.sh "test the complete user registration flow with email verification"

# Better - more context
./run-playwright.sh "automate testing the user registration flow including email verification and password reset"
```

### 2. Use Specific Task Types

Group related tasks for better detection:

```bash
# Group similar browser tests together
./run-playwright.sh "test all authentication flows (login, logout, password reset)"

# Mix with general tasks
./run-playwright.sh "test login flow"  # → Playwright agent
./run-playwright.sh "analyze sales data"  # → General agent
```

### 3. Configure for Your Workflow

Adjust detection thresholds based on your needs:

```javascript
// For strict auto-detection (only high-confidence tasks)
PLAYWRIGHT_CRITICAL_THRESHOLD=1

// For aggressive auto-detection (catch more tasks)
PLAYWRIGHT_MIN_KEYWORDS=1
```

### 4. Add Custom Keywords for Your Domain

If you have domain-specific terms:

```javascript
// In playwright-detector.js
const PLAYWRIGHT_KEYWORDS = [
  // ... existing keywords ...
  'trading',      // Your domain-specific term
  'portfolio',    // Another custom keyword
  'backtest'      // Yet another
];
```

## Troubleshooting

### Task Not Being Detected

**Problem:** Your task isn't triggering Playwright.

**Solution:**
1. Check if you're using recognized keywords
2. Add more descriptive terms to your prompt
3. Increase keyword threshold in configuration

```bash
# Check what keywords are being matched
node playwright-detector.js "test the login"

# Output will show:
// Keyword matches: 2 (login, test)
// Pattern matches: 1
```

### False Positives

**Problem:** Non-browser tasks are being detected.

**Solution:**
1. Increase `PLAYWRIGHT_CRITICAL_THRESHOLD`
2. Add negative keywords to exclude certain terms

```javascript
// In playwright-detector.js
const NEGATIVE_KEYWORDS = [
  'write a',      // Exclude generic writing tasks
  'create a',     // Exclude generic creation tasks
  'explain'       // Exclude explanation requests
];

function detectPlaywrightTask(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for negative keywords
  if (NEGATIVE_KEYWORDS.some(kw => lowerPrompt.includes(kw))) {
    return { shouldUsePlaywright: false };
  }
  
  // ... existing detection logic ...
}
```

### False Negatives

**Problem:** Browser tasks aren't being detected.

**Solution:**
1. Add custom keywords for your domain
2. Lower the keyword threshold
3. Use more explicit terms in prompts

```bash
# Instead of vague descriptions, use specific terms
./run-playwright.sh "automate the checkout process"  // ✅ Detected
./run-playwright.sh "test buying something"           // ❌ Not detected (add 'buy' keyword)
```

## Advanced: Custom Detection Rules

Create custom detection rules for your specific use case:

```javascript
// .agents/custom-detection-rules.js

const CUSTOM_RULES = {
  // Rule: If prompt mentions "trading" and "backtest", use Playwright
  tradingBacktest: {
    keywords: ['trading', 'backtest'],
    minMatches: 2,
    enhancement: 'Use trading platform simulation with realistic market data.'
  },
  
  // Rule: If prompt mentions "dashboard" and "charts", use Playwright
  dashboardCharts: {
    keywords: ['dashboard', 'chart', 'graph'],
    minMatches: 2,
    enhancement: 'Capture full-page screenshots for dashboard visualization testing.'
  },
  
  // Rule: If prompt mentions "API" and "mock", use Playwright with network interception
  apiMocking: {
    keywords: ['api', 'mock'],
    minMatches: 1,
    enhancement: 'Set up network interception to mock all API responses.'
  }
};

function applyCustomRules(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  for (const [ruleName, rule] of Object.entries(CUSTOM_RULES)) {
    const matches = rule.keywords.filter(kw => lowerPrompt.includes(kw)).length;
    
    if (matches >= rule.minMatches) {
      return {
        shouldUsePlaywright: true,
        customEnhancement: rule.enhancement,
        matchedRule: ruleName
      };
    }
  }
  
  return null; // No custom rules matched, use default detection
}

module.exports = { CUSTOM_RULES, applyCustomRules };
```

## Summary

The automated Playwright workflow provides:

✅ **Zero-config auto-detection** - Just describe your task
✅ **Smart prompt enhancement** - Auto-adds Playwright-specific instructions
✅ **Flexible configuration** - Customize detection thresholds and keywords
✅ **CI/CD ready** - Works seamlessly in automated pipelines
✅ **Domain-specific rules** - Add custom detection for your use case

Simply start using it:

```bash
./run-playwright.sh "your browser automation task"
```

And let the system handle the rest! 🚀
