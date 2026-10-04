#!/usr/bin/env node

/**
 * Playwright Task Detector
 * Automatically detects browser automation tasks and triggers the playwright agent.
 *
 * Usage: node playwright-detector.js "your task description"
 */

const PLAYWRIGHT_KEYWORDS = [
  // Navigation & Pages
  'navigate', 'goto', 'url', 'page', 'homepage', 'landing page',
  // Elements & Interaction
  'click', 'fill', 'type', 'input', 'submit', 'form', 'button',
  // Testing & Automation
  'test', 'automate', 'e2e', 'end-to-end', 'browser test',
  // Authentication
  'login', 'logout', 'auth', 'authentication', 'oauth', 'session', 'cookie',
  // UI Elements
  'modal', 'dialog', 'alert', 'confirm', 'dropdown', 'menu', 'select',
  // Media & Capture
  'screenshot', 'video', 'record', 'capture', 'trace',
  // Network & API
  'api', 'mock', 'route', 'fetch', 'request', 'response',
  // Mobile & Devices
  'mobile', 'device', 'responsive', 'viewport', 'tablet', 'phone',
  // Browsers
  'chromium', 'firefox', 'webkit', 'browser', 'chrome', 'edge',
  // Validation & Assertions
  'verify', 'assert', 'expect', 'check', 'validate', 'confirm',
  // Frames & Iframes
  'frame', 'iframe', 'nested content',
  // Performance & Timing
  'wait', 'timeout', 'load', 'idle', 'lazy load',
  // File Operations
  'upload', 'download', 'file input', 'drag and drop'
];

const PROMPT_KEYWORDS = [
  // Test scenarios
  'test the', 'verify that', 'check if', 'ensure ',
  // Action patterns
  'automate the', 'run a test for', 'execute on browser',
  // Flow descriptions
  'through the', 'workflow', 'process flow', 'user journey'
];

/**
 * Detect if a prompt requires Playwright/browser automation
 */
function detectPlaywrightTask(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  // Count keyword matches
  let keywordMatches = PLAYWRIGHT_KEYWORDS.filter(keyword =>
    lowerPrompt.includes(keyword)
  ).length;

  // Check for prompt patterns
  const patternMatches = PROMPT_KEYWORDS.filter(keyword =>
    lowerPrompt.includes(keyword)
  ).length;

  // High confidence: multiple keywords or specific patterns
  const highConfidence = keywordMatches >= 3 || patternMatches >= 2;

  // Medium confidence: specific high-priority keywords
  const criticalKeywords = [
    'e2e', 'end-to-end', 'browser automation', 'playwright',
    'automate login', 'test checkout', 'verify flow'
  ];

  const hasCriticalKeyword = criticalKeywords.some(kw => lowerPrompt.includes(kw));

  // Low confidence: single important keywords that should trigger Playwright
  const importantKeywords = [
    'login', 'logout', 'auth', 'screenshot', 'mobile', 'device',
    'checkout', 'register', 'signup', 'dashboard', 'registration'
  ];

  const hasImportantKeyword = importantKeywords.some(kw => lowerPrompt.includes(kw));

  return {
    shouldUsePlaywright: highConfidence || hasCriticalKeyword || hasImportantKeyword,
    confidence: (keywordMatches + patternMatches) / 10, // Normalize to 0-1
    keywordCount: keywordMatches,
    patternCount: patternMatches,
    matchedKeywords: PLAYWRIGHT_KEYWORDS.filter(kw => lowerPrompt.includes(kw)),
    prompt: prompt.trim()
  };
}

/**
 * Generate a Playwright agent prompt from the user's description
 */
function generatePlaywrightPrompt(originalPrompt) {
  const lowerOriginal = originalPrompt.toLowerCase();

  // Extract relevant context
  const hasAuth = lowerOriginal.includes('login') || lowerOriginal.includes('auth');
  const hasMobile = lowerOriginal.includes('mobile') || lowerOriginal.includes('device');
  const hasScreenshot = lowerOriginal.includes('screenshot') || lowerOriginal.includes('capture');

  let enhancedPrompt = originalPrompt;

  if (hasAuth) {
    enhancedPrompt += ' Include authentication flow with token persistence.';
  }

  if (hasMobile) {
    enhancedPrompt += ' Use mobile device emulation for testing.';
  }

  if (hasScreenshot) {
    enhancedPrompt += ' Capture screenshots on each step for debugging.';
  }

  return enhancedPrompt;
}

/**
 * Main execution - detect and trigger playwright agent if needed
 */
async function main() {
  const prompt = process.argv[2];

  if (!prompt) {
    console.error('Usage: node playwright-detector.js "your task description"');
    process.exit(1);
  }

  console.log('🔍 Detecting task type...\n');
  console.log(`Input: "${prompt}"`);

  const detection = detectPlaywrightTask(prompt);

  console.log('\n📊 Detection Results:');
  console.log(`  Keyword matches: ${detection.keywordCount}`);
  console.log(`  Pattern matches: ${detection.patternCount}`);
  console.log(`  Confidence score: ${(detection.confidence * 100).toFixed(0)}%`);

  if (detection.shouldUsePlaywright) {
    console.log('\n✅ Playwright agent detected!');

    const enhancedPrompt = generatePlaywrightPrompt(detection.prompt);
    console.log(`\n🚀 Launching Playwright agent with prompt:`);
    console.log(`   "${enhancedPrompt}"`);

    // Trigger the playwright agent
    const { Agent } = await import('agent');

    try {
      const result = await Agent({
        description: 'Playwright E2E test',
        prompt: enhancedPrompt,
        isolation: 'worktree' // Isolated environment for each test run
      });

      console.log('\n✅ Playwright agent completed successfully!');
      process.exit(0);

    } catch (error) {
      console.error('\n❌ Playwright agent failed:', error.message);
      process.exit(1);
    }

  } else {
    console.log('\n⚠️  No browser automation detected.');
    console.log('   Task will be handled by general agent.\n');

    // Could trigger other agents here
    process.exit(0);
  }
}

// Export for programmatic use
module.exports = { detectPlaywrightTask, generatePlaywrightPrompt };

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
