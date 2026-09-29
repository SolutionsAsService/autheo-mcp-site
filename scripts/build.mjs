import { copyFile, mkdir } from "node:fs/promises";
// Explicit allowlist: never publish tests, tooling, .env, or repository files.
const files = [
  "index.html",
  "style.css",
  "app.js",
  "content.js",
  "catalog.json",
  "favicon.svg",
  ".nojekyll",
];
const source = new URL("../", import.meta.url);
const output = new URL("../dist/", import.meta.url);
await mkdir(output, { recursive: true });
await Promise.all(
  files.map((file) => copyFile(new URL(file, source), new URL(file, output))),
);
console.log(
  `Built ${files.length} static files in frontend/dist (no runtime dependencies).`,
);
