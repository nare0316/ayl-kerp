import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Writes dist/sw.js with the list of every built file so the app works offline. */
function swPrecache(): Plugin {
  let outDir = 'dist';
  return {
    name: 'ayl-kerp-sw-precache',
    apply: 'build',
    configResolved(cfg) {
      outDir = cfg.build.outDir;
    },
    closeBundle() {
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name);
          if (statSync(full).isDirectory()) walk(full);
          else files.push('/' + relative(outDir, full).split('\\').join('/'));
        }
      };
      walk(outDir);
      const list = files.filter((f) => f !== '/sw.js' && f !== '/_headers').sort();
      list.unshift('/'); // app shell
      const hash = createHash('sha1');
      for (const f of list) if (f !== '/') hash.update(readFileSync(join(outDir, f)));
      const version = hash.digest('hex').slice(0, 10);
      const tpl = readFileSync('sw-template.js', 'utf8')
        .replaceAll('__VERSION__', version)
        .replaceAll('__PRECACHE__', JSON.stringify(list));
      writeFileSync(join(outDir, 'sw.js'), tpl);
    },
  };
}

export default defineConfig({
  plugins: [react(), swPrecache()],
  test: { environment: 'node' },
});
