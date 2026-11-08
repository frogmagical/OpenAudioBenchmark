import { defineConfig, devices } from '@playwright/test';

// Runs against the production build served by `vite preview` (see webServer).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // Run vite directly in the web package: `npm run <script> -- --flag` loses the flags when it
    // is forwarded through the workspace root.
    command: 'npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    cwd: 'apps/web',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
  projects: [
    { name: 'desktop-1280', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'tablet-760', use: { ...devices['Desktop Chrome'], viewport: { width: 760, height: 1000 } } },
    { name: 'phone-460', use: { ...devices['Desktop Chrome'], viewport: { width: 460, height: 900 } } },
  ],
});
