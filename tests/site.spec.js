import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("catalog filtering, expansion, empty state and details work", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("#tool-count")).toHaveText("39 tools · 6 shown");
  await page.getByRole("button", { name: "Show all 39 tools" }).click();
  await expect(page.locator(".tool-card")).toHaveCount(39);
  await page.getByRole("button", { name: "DevHub", exact: true }).click();
  await page.getByRole("searchbox").fill("build logs");
  await expect(page.locator(".tool-card")).toHaveCount(1);
  await expect(page.locator(".tool-card h3")).toHaveText(
    "autheo_devhub_get_build_logs",
  );
  await page.locator(".tool-card summary").click();
  await expect(page.locator(".tool-card details")).toHaveAttribute("open", "");
  await page.getByRole("searchbox").fill("nonexistent xyz");
  await expect(page.locator("#empty-state")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator("#tool-count")).toHaveText("39 tools · 6 shown");
  await page.getByRole("link", { name: "Explore marketplace tools" }).click();
  await expect(
    page.getByRole("button", { name: "Marketplace", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("workflow previews, platform setup, copy and FAQ work", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          window.copiedText = text;
        },
      },
      configurable: true,
    }),
  );
  await page.goto("./");
  await page.getByRole("button", { name: /Investigate a deployment/ }).click();
  await expect(page.locator("#example-call")).toHaveText(
    "autheo_devhub_list_deployments",
  );
  await page.getByRole("button", { name: /Read the latest block/ }).click();
  await expect(page.locator("#example-call")).toHaveText(
    "autheo_get_latest_block",
  );
  await page.getByRole("button", { name: "Windows", exact: true }).click();
  await expect(page.locator("#setup-code")).toContainText(
    ".\\.venv\\Scripts\\python.exe",
  );
  await page.getByRole("button", { name: "Copy commands" }).click();
  expect(await page.evaluate(() => window.copiedText)).toContain(
    "Set-Location",
  );
  await expect(page.locator("#copy-status")).toHaveText("Copied to clipboard.");
  await page.getByRole("button", { name: "MCP client", exact: true }).click();
  const config = JSON.parse(await page.locator("#setup-code").textContent());
  expect(config.mcpServers.autheo.args).toEqual(["-m", "autheo_mcp.server"]);
  await page
    .getByText("How do I deploy this website?", { exact: false })
    .click();
  await expect(
    page.getByRole("link", { name: "Read deployment instructions" }),
  ).toBeVisible();
});
test("clipboard failure offers manual copy, not a false success", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
      configurable: true,
    }),
  );
  await page.goto("./");
  await page.getByRole("button", { name: "Copy commands" }).click();
  await expect(page.locator("#copy-status")).toContainText(
    "Clipboard unavailable",
  );
  expect(await page.evaluate(() => window.getSelection().toString())).toContain(
    "git clone",
  );
});
test("page is accessible, responsive, and makes no external service requests", async ({
  page,
}, testInfo) => {
  const errors = [],
    external = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4173/"))
      external.push(request.url());
  });
  await page.goto("./");
  await expect(page.locator("#tool-count")).toHaveText("39 tools · 6 shown");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("homepage.png"),
    fullPage: true,
  });
});
test("catalog failure leaves explanatory content and source fallback usable", async ({
  page,
}) => {
  await page.route("**/catalog.json", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("./");
  await expect(page.locator("#tool-count")).toContainText("could not load");
  await expect(
    page.getByRole("link", { name: "Read the registered tools on GitHub" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Windows", exact: true }).click();
  await expect(page.locator("#setup-code")).toContainText("Set-Location");
});
test("narrow screens and keyboard navigation remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("./");
  await expect(page.locator("#tool-count")).toHaveText("39 tools · 6 shown");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "MCP client", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("essential explanation and quickstart steps remain visible without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/dist/");
  await expect(
    page.getByRole("heading", { name: "The network, in context." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Read all registered tools in the source" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Install the server" }),
  ).toBeVisible();
  await context.close();
});
