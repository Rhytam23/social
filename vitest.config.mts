import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Old agent worktrees under .claude hold whole copies of the project and tests; running them exhausts memory.
    // Each database test starts its own in-process Postgres; many at once exhaust memory and kill workers.
    maxWorkers: 2,
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
    // Argon2id (64 MiB) and the in-process Postgres are slow on a busy or low-memory machine.
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
