import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/front/**/*.test.ts', '*.test.ts'],
  },
});
