---
name: playwright
description: Browser automation and E2E testing with Playwright. Trigger for setting up tests, writing page objects, handling authentication, waiting strategies, screenshots/video recording, network interception, or debugging browser issues.
license: MIT
metadata:
  author: Copyright 2026 Volodymyr Blagodarov
  version: '1.0'
---

# Playwright Agent Guidelines

## Overview

Playwright is a modern end-to-end testing library that supports multiple browsers (Chromium, Firefox, WebKit) and provides powerful features for browser automation.

## Core Concepts

### Browser Contexts
- Use isolated browser contexts for each test to ensure independence
- Configure context settings: storage state, user agent, extra HTTP headers, viewport size
- Clear cookies and local storage between tests

### Pages and Frames
- Handle multiple frames in single-page applications (SPAs)
- Use `page.frames()` to iterate through all frames
- Access frame content with `frame.locator()` or `frame.getBy*()`

### Wait Strategies
**Prefer explicit waits over implicit timeouts:**

1. **Wait for element to be visible/attached**
   ```javascript
   await page.waitForSelector('.my-element', { state: 'visible' });
   ```

2. **Wait for network idle**
   ```javascript
   await page.waitForLoadState('networkidle');
   ```

3. **Wait for specific conditions**
   ```javascript
   await page.waitForFunction(() => document.querySelector('.my-element') !== null);
   ```

4. **Timeout configuration**
   ```javascript
   await page.waitForSelector('.my-element', { state: 'visible', timeout: 5000 });
   ```

## Best Practices

### Test Structure
- Organize tests by feature or user story
- Use descriptive test names that explain the expected behavior
- Group related tests in the same file

```javascript
// Good test naming
it('should display error message when invalid email is entered', async () => {
  // test implementation
});

// Bad test naming
it('test 1', async () => {
  // test implementation
});
```

### Page Object Pattern
Create reusable page objects for maintainability:

```javascript
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
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

// Usage in test
const loginPage = new LoginPage(page);
await loginPage.login('test@example.com', 'password123');
```

### Handling Dynamic Content
- Use `page.waitForTimeout()` sparingly; prefer explicit waits
- Handle loading states with visibility checks
- Use `page.waitForFunction()` for complex conditions

### Authentication Flows
**OAuth/SSO:**
```javascript
// Store auth state for reuse
const context = await browser.newContext();
await context.storageState({ path: 'auth.json' });

// Restore auth state in subsequent tests
const context = await browser.newContext({ storageState: 'auth.json' });
```

**Session cookies:**
```javascript
// Extract and reuse cookies
const cookies = await context.cookies();
const newContext = await browser.newContext({
  storageState: { cookies }
});
```

### Network Interception
Mock API responses for reliable tests:

```javascript
await page.route('https://api.example.com/data', async route => {
  await route.fulfill({
    status: 200,
    json: { id: 1, name: 'Test Data' }
  });
});

// Or with fixed responses
await page.route('https://api.example.com/data', route => route.fulfill({
  fixture: 'data.json'
}));
```

### Screenshots and Video Recording
Capture evidence for debugging:

```javascript
// Screenshot on failure (automatic with retries)
await page.screenshot({ path: 'test-failure.png' });

// Full page screenshot
await page.screenshot({ 
  path: 'full-page.png', 
  fullPage: true 
});

// Record video for complex flows
await page.video().path('test-video.webm');
```

### Mobile Testing
Test on different device configurations:

```javascript
// Device emulation
const context = await browser.newContext({
  viewport: { width: 375, height: 667 }, // iPhone SE
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
});

// Or use built-in device descriptors
const context = await browser.newContext({
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
}); // Auto-detects iPhone SE
```

### Retry Logic
Handle flaky tests with retries:

```javascript
// Built-in retry for expect assertions
await expect(page.locator('.element')).toBeVisible({ timeout: 10000, retries: 3 });

// Retry entire test
const retry = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fn();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries}`);
    }
  }
};

await retry(async () => {
  await page.goto('/login');
});
```

### Common Selectors

**By text:**
```javascript
page.getByText('Submit');
page.getByRole('button', { name: /submit/i });
```

**By test ID:**
```javascript
page.getByTestId('user-email');
```

**By placeholder:**
```javascript
page.getByPlaceholder('Enter email');
```

**By label:**
```javascript
page.getByLabel('Email address');
```

### Handling Popups and Dialogs

**Alert/Confirm/Prompt:**
```javascript
// Wait for alert and accept/reject
await page.waitForSelector('dialog');
const dialog = await page.locator('dialog');

// Accept the dialog
await dialog.evaluate((d) => d.accept());

// Reject the dialog
await dialog.evaluate((d) => d.dismiss());
```

### File Uploads

```javascript
// Single file upload
await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');

// Multiple files
await page.setInputFiles('input[type="file"]', [
  'path/to/file1.pdf',
  'path/to/file2.pdf'
]);

// With specific file name (for hidden inputs)
await page.fill('input[type="file"]', 'path/to/file.pdf');
```

### API Testing with Playwright

Test backend APIs directly:

```javascript
// HTTP requests
const response = await page.request.get('https://api.example.com/data');

// With authentication
await page.request.post('https://api.example.com/login', {
  data: { email, password }
});

// With custom headers
await page.request.get('https://api.example.com/protected', {
  headers: { 'Authorization': 'Bearer token' }
});

// JSON response handling
const data = await page.request.get('https://api.example.com/data').json();
```

### Environment Configuration

Use environment variables for test configuration:

```javascript
// .env.test file
TEST_BASE_URL='https://staging.example.com'
API_KEY='test-key-123'

// In test file
const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
await page.goto(baseURL);
```

### CI/CD Integration

**GitHub Actions example:**
```yaml
- name: Install dependencies
  run: npm install

- name: Run Playwright tests
  run: npx playwright test

- name: Upload results for failure analysis
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

### Debugging Tips

1. **Enable DevTools:**
   ```javascript
   await page.setViewportSize({ width: 1280, height: 720 });
   await page.on('console', msg => console.log(msg.text()));
   ```

2. **Slow mo for debugging:**
   ```javascript
   await page.pause(); // Interactive pause in browser
   ```

3. **Trace viewer:**
   ```bash
   npx playwright show-trace trace.zip
   ```

4. **Log network requests:**
   ```javascript
   await page.on('response', response => {
     console.log(response.url(), response.status());
   });
   ```

## Testing Patterns

### Before Hooks (Setup)
```javascript
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
});
```

### After Hooks (Teardown)
```javascript
test.afterEach(async ({ page }) => {
  await page.screenshot({ path: `screenshots/${test.info().title}.png` });
});
```

### Fixtures
Create reusable test fixtures:

```javascript
// playwright.config.js
module.exports = {
  use: {
    baseURL: 'https://example.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' }
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' }
    },
    {
      name: 'authenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/*.auth.spec.js'
    }
  ]
};
```

## Common Issues and Solutions

### Element Not Found
- Use explicit waits instead of implicit timeouts
- Check if the element is in a frame
- Verify selector specificity

### Flaky Tests
- Add appropriate waits for dynamic content
- Isolate tests to avoid dependencies on other tests
- Use deterministic test data

### Slow Tests
- Avoid unnecessary page navigations
- Reduce screenshot/video recording frequency
- Use parallel test execution

## Tools and Commands

```bash
# Install Playwright browsers
npx playwright install

# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/auth.spec.js

# Run with reporter
npx playwright test --reporter=html

# Generate code from site
npx playwright codegen https://example.com

# Show trace file
npx playwright show-trace trace.zip
```

## References

- [Playwright Documentation](https://playwright.dev)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [Testing Library Patterns](https://testing-library.com/docs/ecosystem-playwright/)
