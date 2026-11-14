import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT || 4173);
const ALL = !!process.env.ALL_BROWSERS;

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}/rightrack/`,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    trace: 'off'
  },
  webServer: { command: 'node tests/serve.mjs', url: `http://127.0.0.1:${PORT}/rightrack/`, reuseExistingServer: !process.env.CI, env: { PORT: String(PORT) } },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    ...(ALL ? [
      { name: 'desktop-webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
      { name: 'mobile-webkit', use: { ...devices['iPhone 15'] } },
      { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } }
    ] : [])
  ]
});
