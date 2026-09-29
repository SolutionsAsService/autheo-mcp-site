# Autheo MCP website

A responsive, static introduction to Autheo MCP v0.2, contributed by
[SolutionsAsService](https://github.com/SolutionsAsService).

## What is here

- Product explanation and a CSS/SVG diagram of the AI → MCP → service connection.
- Searchable, filterable catalog of all 39 registered tools, with access and input details.
- Clearly labeled illustrative workflows (no fabricated live results).
- macOS/Linux, Windows PowerShell, and common MCP-client setup examples with copy controls.
- Accessible native controls, keyboard focus, reduced-motion support, and mobile layouts.
- No runtime packages, analytics, external fonts, credential fields, or service connections.

This is a **product/documentation frontend**, not a live administration dashboard.
It does not deploy Autheo workloads, create orders, sign transactions, or host an
MCP transport. Run the Python MCP server separately on a trusted machine; its
credentials belong in its environment, never in public static assets.

## Preview locally

From the repository root (Python 3.11+):

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory frontend
```

Open `http://127.0.0.1:4173`. On Windows, replace `python3` with `py -3`.
Serve over HTTP; opening `index.html` with `file://` cannot load ES modules/catalog.

## Deploy

All asset URLs are relative: both domain-root hosting and project subpaths such as
`/autheo-mcp/` work without a rewrite or base-URL setting. There are no build-time
secrets or environment variables. All public output is allowlisted by `scripts/build.mjs`.

### GitHub Pages (free for eligible repositories)

After the frontend PR is merged:

1. In repository **Settings → Pages**, choose **GitHub Actions** as the source.
2. Open **Actions → Deploy frontend to Pages → Run workflow**, selecting `main`.
3. Use the URL shown by the deployment job (normally
   `https://thothdivision.github.io/autheo-mcp/`, unless a custom domain is configured).

The workflow is manual and limited to `main`: neither opening nor merging a PR
publishes the site or changes repository settings. Repeat it when you want to
publish an update. Pages permissions, plan eligibility, and environment protection
rules are controlled by the repository owner. The workflow publishes only the
seven allowlisted frontend assets, never the repository, reference sources, or Python environment.

### Any static host

With Node.js 22+ (no package install is required for the build):

```sh
node frontend/scripts/build.mjs
```

Publish **`frontend/dist`** as the document root. For hosts with build settings,
use the repository root, that build command, and that output directory. No server
function, SPA rewrite, paid service, or container is needed. Serve `index.html`,
JavaScript, CSS, SVG, and JSON with their normal MIME types. HTTPS enables normal
clipboard support; if clipboard access is denied, the UI selects the text for
manual copying.

### Vercel

A `vercel.json` is included at the repository root with the following settings:

- **Build command:** `node frontend/scripts/build.mjs`
- **Output directory:** `frontend/dist`
- **Install command:** `npm --prefix frontend ci`
- **Framework preset:** Other (static)

Import the repository on Vercel. The project root is the repository root; Vercel
uses `vercel.json` to locate the frontend build. No framework server, serverless
function, or environment variables are required. The deployment serves only the
seven allowlisted static assets produced by `scripts/build.mjs`.

Local deployment-output preview:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory frontend/dist
```

## Maintain and test

```sh
# From the repo root: derive public metadata without importing the Python server.
python3 frontend/scripts/catalog.py
python3 frontend/scripts/catalog.py --check

cd frontend
npm ci
npm run format:check
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Development dependencies are only for verification and formatting. `package-lock.json` pins them;
there are no runtime dependencies. Tests cover catalog/registered-tool parity,
filters, no-result recovery, example tool names, setup JSON, copy success/failure,
FAQ disclosure, catalog-load errors, desktop/mobile overflow, browser errors,
external-request absence, and automated WCAG A/AA checks via axe. Playwright saves
full-page screenshots under `test-results/`; these are not committed.

`catalog.json` is committed so visitors need no Python build. The generator reads
only `@mcp.tool` registrations in `src/autheo_mcp/server.py`. Curated corrections
explain legacy tools whose names/docstrings could otherwise imply unsupported
capabilities. CI fails when the committed catalog diverges from the generator.

Automated accessibility checks are useful coverage, not an accessibility certification.
The static website does not prove live Autheo service access.
