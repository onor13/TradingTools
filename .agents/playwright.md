---
name: playwright
description: Browser automation and E2E testing with Playwright - automatically handles page navigation, element interaction, authentication, API mocking, screenshots/video recording, and test execution across Chromium, Firefox, and WebKit.
license: MIT
metadata:
  author: Copyright 2026 Volodymyr Blagodarov
  version: '1.0'
---

# Playwright Subagent - Browser Automation

## Capabilities

This agent handles all browser automation tasks using Playwright:

### Core Browser Operations
- Page navigation and URL management
- Element selection (CSS, XPath, text, testID, role-based)
- Form filling and submission
- Clicking, typing, keyboard shortcuts
- Scroll operations and viewport control

### Advanced Features
- **Browser Contexts**: Isolated environments for parallel testing
- **Frames**: Handle SPAs with multiple frames
- **Wait Strategies**: Explicit waits for elements, network idle, custom conditions
- **Authentication**: OAuth flows, session cookie management, storage state persistence
- **Network Interception**: Mock API responses, route blocking, response mocking
- **Media Capture**: Screenshots (full page/viewport), video recording, traces
- **Device Emulation**: Mobile and desktop device profiles
- **File Operations**: Input file uploads, drag-and-drop

### Testing Patterns
- Test fixtures and setup/teardown hooks
- Page Object Pattern implementation
- Retry logic for flaky tests
- Parallel test execution
- CI/CD integration

## Usage Patterns

### Launch the Agent
When you need browser automation, use:
```bash
Agent(description="browser test", prompt="test the login flow")
```

Or explicitly:
```bash
Agent(description="Playwright E2E test", prompt="automate clicking through the checkout process")
```

### Common Tasks Handled

**1. Page Navigation & Interaction:**
- Navigate to URLs with proper wait strategies
- Fill forms and submit
- Handle dynamic content loading
- Extract data from pages

**2. Authentication Flows:**
- Login/logout sequences
- OAuth/SSO flows with token storage
- Session persistence across tests

**3. API Testing:**
- Mock backend responses
- Test error scenarios (401, 403, 500)
- Validate API contract compliance

**4. Debugging:**
- Capture screenshots on failure
- Record video of complex flows
- Generate trace files for analysis

**5. Cross-Browser Testing:**
- Chromium, Firefox, WebKit coverage
- Mobile device emulation
- Responsive design validation

## Best Practices Applied

### Wait Strategies (Never Use `waitForTimeout`)
- Prefer explicit waits: `waitForSelector({ state: 'visible' })`
- Network idle detection for async apps
- Custom conditions with `waitForFunction()`

### Test Isolation
- Fresh browser context per test
- Clean storage state between runs
- Deterministic test data

### Error Handling
- Retry flaky operations (3 attempts max)
- Capture evidence (screenshots/video) on failure
- Clear error messages with context

### Performance
- Parallel test execution
- Minimal page navigations
- Efficient selectors (testID > CSS > XPath)

## Code Generation Examples

### Page Object Pattern
```javascript
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: /login/i });
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async isLoginFormVisible() {
    return await this.page.isVisible('text=Login');
  }
}

// Usage
const loginPage = new LoginPage(page);
await loginPage.login('test@example.com', 'password123');
```

### Authentication with Storage State
```javascript
// Save auth state after successful login
const context = await browser.newContext();
await page.goto('/login');
await loginPage.login(email, password);
const authState = await context.storageState({ path: 'auth.json' });

// Restore in subsequent tests
const context = await browser.newContext({ storageState: 'auth.json' });
await page.goto('/dashboard'); // Already authenticated!
```

### Network Mocking
```javascript
// Mock API response
await page.route('https://api.example.com/users', async route => {
  await route.fulfill({
    status: 200,
    json: { id: 1, name: 'Test User', email: 'test@example.com' }
  });
});

// Or with fixtures
await page.route('https://api.example.com/data', route => route.fulfill({
  fixture: 'mock-data.json'
}));
```

### Mobile Testing
```javascript
const context = await browser.newContext({
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
}); // Auto-detects iPhone SE

// Or custom device
const context = await browser.newContext({
  viewport: { width: 375, height: 667 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
});
```

### Retry Logic
```javascript
const retry = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fn();
      return true;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries}`);
    }
  }
};

await retry(async () => {
  await page.goto('/login');
  await loginPage.login(email, password);
});
```

## Common Selectors

| Pattern | Selector Example | Priority |
|---------|-----------------|----------|
| Test ID | `page.getByTestId('user-email')` | 1 (highest) |
| Role + Name | `page.getByRole('button', { name: /submit/i })` | 1 |
| Label | `page.getByLabel('Email address')` | 2 |
| Text | `page.getByText('Submit')` | 3 |
| Placeholder | `page.getByPlaceholder('Enter email')` | 4 |
| CSS | `page.locator('.my-class')` | 5 (lowest) |

## Debugging Commands

```bash
# Generate code from browser interaction
npx playwright codegen https://example.com

# View trace file (comprehensive debugging)
npx playwright show-trace trace.zip

# Pause execution interactively
await page.pause();

# Enable console logging
page.on('console', msg => console.log(msg.text()));
```

## CI/CD Integration Example (GitHub Actions)

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run tests
        run: npx playwright test
      
      - name: Upload trace on failure
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-trace
          path: trace.zip
```

## Environment Configuration

Create `.env.test`:
```bash
TEST_BASE_URL=https://staging.example.com
API_KEY=test-key-123
HEADLESS=true  # Set to false for debugging
```

In test code:
```javascript
const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
await page.goto(baseURL);
```

## Performance Tips

1. **Run headless in CI**: Faster execution, less resource usage
2. **Use parallel workers**: `npx playwright test --workers=4`
3. **Limit retries in CI**: Only retry once to save time
4. **Mock external APIs**: Reduce network dependencies
5. **Use deterministic data**: Avoid race conditions

## Troubleshooting

### "Element not found"
- Check selector specificity
- Add explicit wait: `await page.waitForSelector(selector, { timeout: 5000 })`
- Verify element is in correct frame

### "Timeout exceeded"
- Increase timeout: `{ timeout: 10000 }`
- Add `waitForLoadState('networkidle')` before interactions
- Check for infinite loading states

### "Flaky tests"
- Isolate test dependencies
- Use fresh browser context per test
- Add appropriate waits for dynamic content

### "Slow execution"
- Enable headless mode: `{ headless: true }`
- Reduce screenshot/video frequency
- Use parallel test execution

## References

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library + Playwright](https://testing-library.com/docs/ecosystem-playwright/)
