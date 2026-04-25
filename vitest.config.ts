// Powered by skill: security, accessibility
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Coverage targets the pure-logic modules that have unit tests. Browser-
      // only modules (boot, cart, history, share-cart, toast, url, random-kebab)
      // touch DOM/localStorage and run only in the actual app shell.
      include: [
        'src/lib/format.ts',
        'src/lib/holidays.ts',
        'src/lib/pricing.ts',
        'src/lib/time.ts',
        'src/lib/validation.ts',
        'src/lib/whatsapp.ts',
      ],
      exclude: ['src/lib/**/*.d.ts'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@lib': new URL('./src/lib', import.meta.url).pathname,
      '@data': new URL('./src/data', import.meta.url).pathname,
    },
  },
});
