import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4175/Olympia-amigos/', channel: 'chromium', viewport: { width: 390, height: 844 }, trace: 'retain-on-failure' },
  webServer: { command: 'npm run preview -- --port 4175 --strictPort', url: 'http://localhost:4175/Olympia-amigos/', reuseExistingServer: false },
});
