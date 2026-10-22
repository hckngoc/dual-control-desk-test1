// Node >=22.18 runs TypeScript without adding a test framework or changing production resolution.
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/server') return nextResolve('next/server.js', context);
    if (context.parentURL?.includes('/node_modules/')) return nextResolve(specifier, context);
    const url = specifier.startsWith('@/') ? new URL('../src/' + specifier.slice(2), import.meta.url) :
      specifier.startsWith('.') && context.parentURL ? new URL(specifier, context.parentURL) : null;
    if (url?.protocol === 'file:' && !existsSync(fileURLToPath(url))) {
      for (const extension of ['.ts', '.mjs', '.js']) {
        const candidate = new URL(url.href + extension);
        if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
