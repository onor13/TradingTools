#!/usr/bin/env node

/**
 * Test script for Playwright auto-detection system
 */

const { detectPlaywrightTask } = require('./playwright-detector');

console.log('🧪 Testing Playwright Auto-Detection\n');
console.log('=' .repeat(60));

const testCases = [
  // Should detect Playwright
  { prompt: 'test the login flow', expected: true, reason: 'login + test keywords' },
  { prompt: 'automate checkout process', expected: true, reason: 'checkout + automate keywords' },
  { prompt: 'navigate to page and click button', expected: true, reason: 'navigate + click (2 keywords)' },
  { prompt: 'e2e test for user registration', expected: true, reason: 'e2e keyword' },
  { prompt: 'verify mobile responsive design', expected: true, reason: 'mobile + verify keywords' },
  { prompt: 'screenshot the dashboard', expected: true, reason: 'screenshot keyword' },
  { prompt: 'test authentication with oauth', expected: true, reason: 'auth + test keywords' },
  { prompt: 'automate clicking through checkout', expected: true, reason: 'checkout + click + automate' },
  { prompt: 'browser automation for login', expected: true, reason: 'browser automation keyword' },
  { prompt: 'test the complete user registration flow', expected: true, reason: 'test + multiple keywords' },

  // Should NOT detect Playwright
  { prompt: 'write a function to calculate sum', expected: false, reason: 'no browser keywords' },
  { prompt: 'explain how to use playbooks', expected: false, reason: 'no browser keywords' },
  { prompt: 'create a new database table', expected: false, reason: 'no browser keywords' },
  { prompt: 'write a poem about coding', expected: false, reason: 'no browser keywords' },
  { prompt: 'analyze sales data in excel', expected: false, reason: 'no browser keywords' },
  { prompt: 'debug a python script', expected: false, reason: 'no browser keywords' },
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = detectPlaywrightTask(testCase.prompt);
  const success = result.shouldUsePlaywright === testCase.expected;

  if (success) {
    passed++;
    console.log(`\n✅ Test ${index + 1}: PASSED`);
  } else {
    failed++;
    console.log(`\n❌ Test ${index + 1}: FAILED`);
  }

  console.log(`   Prompt: "${testCase.prompt}"`);
  console.log(`   Expected Playwright: ${testCase.expected}`);
  console.log(`   Detected Playwright: ${result.shouldUsePlaywright}`);
  console.log(`   Reason: ${testCase.reason}`);

  if (result.shouldUsePlaywright) {
    console.log(`   Matched keywords: ${result.matchedKeywords.join(', ')}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log('\n✅ All tests passed!');
  process.exit(0);
} else {
  console.log(`\n❌ ${failed} test(s) failed.`);
  process.exit(1);
}
