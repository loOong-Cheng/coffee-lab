import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';

const SW_FILE = 'sw.js';
const SW_TEMPLATE = resolve(import.meta.dirname, 'src/platform/sw/sw.template.js');
/** Chunks containing any of these modules are NOT precached (runtime-cached on first /xr use instead). */
const RUNTIME_ONLY_MODULE = /[\\/]node_modules[\\/]@babylonjs[\\/]/;

function listFiles(dir: string): string[] {
  let out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out = out.concat(listFiles(abs));
    else out.push(abs);
  }
  return out;
}

const kb = (n: number) => `${(n / 1024).toFixed(1)} kB`;

/**
 * Emits a versioned, dependency-free service worker (see src/platform/sw/sw.template.js for strategy).
 * Precache = every emitted file except sourcemaps and Babylon-containing chunks, plus public/ files.
 * The cache version is a hash of all precached names + contents + the template, so any change ships a new SW.
 */
function coffeeLabServiceWorker(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'coffee-lab:service-worker',
    apply: 'build',
    enforce: 'post',
    configResolved(c) {
      config = c;
    },
    generateBundle(_options, bundle) {
      if (config.build.ssr) return;
      const precache = new Map<string, string | Uint8Array>();
      let runtimeBytes = 0;
      let runtimeCount = 0;
      for (const [fileName, item] of Object.entries(bundle)) {
        if (fileName.endsWith('.map') || fileName === SW_FILE) continue;
        if (item.type === 'chunk') {
          if (item.moduleIds.some((id) => RUNTIME_ONLY_MODULE.test(id))) {
            runtimeBytes += Buffer.byteLength(item.code);
            runtimeCount += 1;
            continue;
          }
          precache.set(fileName, item.code);
        } else {
          precache.set(fileName, item.source);
        }
      }
      if (config.publicDir) {
        for (const abs of listFiles(config.publicDir)) {
          const rel = relative(config.publicDir, abs).split(sep).join('/');
          if (rel !== SW_FILE) precache.set(rel, readFileSync(abs));
        }
      }
      if (!precache.has('index.html')) this.warn('index.html not found in bundle; offline navigation will not work');

      const template = readFileSync(SW_TEMPLATE, 'utf8');
      const names = [...precache.keys()].sort();
      const hash = createHash('sha256').update(template);
      let precacheBytes = 0;
      for (const name of names) {
        const content = precache.get(name)!;
        precacheBytes += typeof content === 'string' ? Buffer.byteLength(content) : content.byteLength;
        hash.update(name).update('\0').update(content).update('\0');
      }
      const version = hash.digest('hex').slice(0, 16);
      const source = template
        .replace('__CL_VERSION__', JSON.stringify(version))
        .replace('__CL_PRECACHE__', JSON.stringify(names))
        .replace('__CL_RUNTIME_PREFIXES__', JSON.stringify([`${config.build.assetsDir}/`]));
      this.emitFile({ type: 'asset', fileName: SW_FILE, source });
      config.logger.info(
        `[sw] ${SW_FILE} v${version}: precache ${names.length} files (${kb(precacheBytes)} raw); ` +
          `runtime-cached on demand: ${runtimeCount} Babylon/XR chunks (${kb(runtimeBytes)} raw)`,
      );
    },
  };
}

// Relative base + hash routing => the built `dist/` works from any static host or sub-path.
// Babylon.js is only imported (dynamically) by the /xr route, so it lands in lazy chunks.
export default defineConfig({
  base: './',
  plugins: [react(), coffeeLabServiceWorker()],
  server: { port: 5173 },
  preview: { port: 4173 },
  build: {
    target: 'es2022',
    sourcemap: true,
    // The lazy XR chunk (Babylon) is legitimately large; the entry chunk is what we keep small.
    chunkSizeWarningLimit: 4000,
  },
});
