import test from "node:test";
import assert from "node:assert/strict";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

test("a clean standalone copy builds without .nojekyll or the backend", async () => {
  const directory = await mkdtemp(join(tmpdir(), "autheo-site-build-"));
  const assets = [
    "index.html",
    "style.css",
    "app.js",
    "content.js",
    "catalog.json",
    "favicon.svg",
  ];
  try {
    await mkdir(join(directory, "scripts"));
    for (const file of [...assets, "scripts/build.mjs"])
      await copyFile(
        new URL(`../${file}`, import.meta.url),
        join(directory, file),
      );
    execFileSync(process.execPath, [join(directory, "scripts/build.mjs")], {
      cwd: directory,
    });
    assert.deepEqual(
      (await readdir(join(directory, "dist"))).sort(),
      [...assets, ".nojekyll"].sort(),
    );
    for (const file of assets)
      assert.deepEqual(
        await readFile(join(directory, "dist", file)),
        await readFile(join(directory, file)),
      );
    const config = JSON.parse(
      await readFile(new URL("../vercel.json", import.meta.url)),
    );
    assert.equal(config.buildCommand, "npm run build");
    assert.equal(config.outputDirectory, "dist");
    assert.equal(config.framework, null);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
