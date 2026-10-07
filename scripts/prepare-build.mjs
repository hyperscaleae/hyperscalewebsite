import { chmodSync } from "node:fs";
import { createRequire } from "node:module";

// Hostinger's dependency staging can strip the native compiler's execute bit.
// Resolve only esbuild's installed platform binary; never change a directory tree.
if (process.platform === "linux") {
  const require = createRequire(import.meta.url);
  const esbuildRequire = createRequire(require.resolve("esbuild/package.json"));
  const binary = esbuildRequire.resolve(
    `@esbuild/linux-${process.arch}/bin/esbuild`
  );
  chmodSync(binary, 0o755);
}
