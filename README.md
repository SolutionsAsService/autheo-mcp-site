# Autheo MCP website

Standalone product/documentation website for [Autheo MCP](https://github.com/ThothDivision/autheo-mcp), contributed by [SolutionsAsService](https://github.com/SolutionsAsService).

The website files live **at the repository root**, not in a `frontend/` subdirectory.
This static site explains the MCP server and its 39 registered tools. It does not
host the Python MCP server, collect credentials, or execute Autheo operations.

## Deploy on Vercel

Import **SolutionsAsService/autheo-mcp-site** with these project settings:

| Setting               | Value                                        |
| --------------------- | -------------------------------------------- |
| Root Directory        | Repository root (`.`; leave blank in the UI) |
| Framework Preset      | Other                                        |
| Install Command       | `npm ci`                                     |
| Build Command         | `npm run build`                              |
| Output Directory      | `dist`                                       |
| Node.js               | 22 or newer                                  |
| Environment variables | None                                         |

The committed `vercel.json` supplies the framework, install, build, and output
settings. Remove any old Root Directory override of `frontend` in Vercel project
settings. Pushes to the connected production branch (`main`) trigger a deployment.
No functions, paid services, Python backend, or MCP credentials are needed.

The build generates `.nojekyll` itself; no hidden file has to survive a manual
copy/upload of this repository. Only seven explicitly allowlisted files are
published. Tests, source tooling, and environment files stay out of the output.

## Other static hosts

```sh
node scripts/build.mjs
```

Publish **`dist`** as the document root. The build requires Node.js 22+ but no npm
packages. Relative asset URLs work both at a domain root and a project subpath.
GitHub Pages can serve the same output if separately configured; this repository's
production integration is Vercel, not a GitHub Pages workflow.

## Preview locally

```sh
npm ci
npm run build
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:4173`. On Windows replace `python3` with `py -3`.
Alternatively, `npm run dev` serves the repository root during editing. Use HTTP,
not `file://`, so ES modules and the catalog load normally.

## Test

```sh
npm ci
npm run format:check
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Tests cover clean-copy deployment output, catalog metadata, search, configuration
examples, desktop/mobile interaction, keyboard navigation, clipboard denial,
catalog load failure, subpath hosting, and automated accessibility checks.
Playwright artifacts stay in ignored `test-results/`. Dependencies are for tests
and formatting only; production has no runtime packages or external fonts.

## Catalog maintenance

`catalog.json` is a committed snapshot of the v0.2 registered MCP tools. A website
build does **not** require the backend repository or fetch its source. To regenerate
or verify against a separate trusted Autheo MCP checkout:

```sh
python3 scripts/catalog.py --source /path/to/autheo-mcp/src/autheo_mcp/server.py
python3 scripts/catalog.py --source /path/to/autheo-mcp/src/autheo_mcp/server.py --check
```

The generator reads `@mcp.tool` registrations without executing/importing the
server. It retains curated explanations of legacy tools with limited capabilities.
The initial snapshot corresponds to backend commit
`2dc4fb39a822606bf187170a09f49b17642f1d0d` in ThothDivision/autheo-mcp.

The GitHub links and installation commands for the **Python MCP server** still
point to ThothDivision/autheo-mcp intentionally. Website source and deployment
instructions point to this standalone repository.
