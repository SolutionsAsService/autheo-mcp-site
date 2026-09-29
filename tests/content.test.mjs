import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { filterTools, setups, examples } from "../content.js";
const catalog = JSON.parse(
  await readFile(new URL("../catalog.json", import.meta.url)),
);
test("catalog has unique names, complete metadata, and all supported domains", () => {
  assert.equal(catalog.length, 39);
  assert.equal(new Set(catalog.map((t) => t.name)).size, 39);
  assert.deepEqual([...new Set(catalog.map((t) => t.category))].sort(), [
    "Blockchain",
    "DevHub",
    "Marketplace",
    "Utilities",
  ]);
  for (const tool of catalog) {
    assert.match(tool.name, /^autheo_[a-z0-9_]+$/);
    assert.ok(tool.access && tool.description && Array.isArray(tool.inputs));
  }
});
test("search combines category and case-insensitive multiword queries", () => {
  assert.equal(filterTools(catalog, "All", "").length, 39);
  assert.ok(
    filterTools(catalog, "DevHub", "BUILD logs").some(
      (t) => t.name === "autheo_devhub_get_build_logs",
    ),
  );
  assert.equal(filterTools(catalog, "Blockchain", "listing").length, 0);
  assert.equal(filterTools(catalog, "All", "<script>bad</script>").length, 0);
});
test("examples name real tools and only supported input keys", () => {
  for (const example of Object.values(examples)) {
    const tool = catalog.find((t) => t.name === example.call);
    assert.ok(tool);
    for (const key of Object.keys(JSON.parse(example.args)))
      assert.ok(tool.inputs.some((i) => i.name === key));
  }
});
test("client config is valid JSON with placeholder endpoints and no secrets", () => {
  const server = JSON.parse(setups.client.code).mcpServers.autheo;
  assert.deepEqual(server.args, ["-m", "autheo_mcp.server"]);
  assert.ok(server.command.startsWith("/absolute/path/"));
  assert.deepEqual(Object.keys(server.env).sort(), [
    "AUTHEO_DEVHUB_URL",
    "AUTHEO_MARKETPLACE_API_URL",
    "AUTHEO_REST_URL",
    "AUTHEO_RPC_URL",
  ]);
  assert.ok(
    Object.values(server.env).every((value) =>
      new URL(value).hostname.endsWith(".example.com"),
    ),
  );
});
test("local navigation targets and assets exist", async () => {
  const html = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8",
  );
  for (const match of html.matchAll(/href="#([^"]+)"/g))
    assert.ok(html.includes(`id="${match[1]}"`), match[1]);
  for (const match of html.matchAll(/(?:href|src)="(\.\/[^"]+)"/g))
    await readFile(new URL(`../${match[1]}`, import.meta.url));
});
