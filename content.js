export function filterTools(tools, category, query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return tools.filter(
    (tool) =>
      (category === "All" || tool.category === category) &&
      terms.every((term) =>
        `${tool.name} ${tool.description} ${tool.category} ${tool.access}`
          .toLowerCase()
          .includes(term),
      ),
  );
}
export const examples = {
  marketplace: {
    prompt: "What compute listings can I explore?",
    call: "autheo_marketplace_list_listings",
    args: '{ "resource_type": "compute" }',
    result:
      "Listing details, provider summaries, and exact THEO prices returned by your configured Marketplace.",
  },
  devhub: {
    prompt: "What deployments are visible to my team?",
    call: "autheo_devhub_list_deployments",
    args: "{}",
    result:
      "Deployments visible to your configured DevHub team. Follow up with deployment resources or build logs to investigate.",
  },
  chain: {
    prompt: "What is the latest block on my configured network?",
    call: "autheo_get_latest_block",
    args: "{}",
    result:
      "The latest block returned by your configured CometBFT RPC. This is a read, not a transaction submission.",
  },
};
export const setups = {
  unix: {
    label: "TERMINAL / BASH",
    code: `git clone https://github.com/ThothDivision/autheo-mcp.git
cd autheo-mcp
python3 -m venv .venv
.venv/bin/python -m pip install -e .

# Local server; MCP clients launch this over stdio.
.venv/bin/python -m autheo_mcp.server`,
    note: "Configure environment variables before connecting. A quiet terminal is expected: this is a stdio MCP server, not a web server. Stop it with Ctrl+C before configuring your client.",
  },
  windows: {
    label: "TERMINAL / POWERSHELL",
    code: `git clone https://github.com/ThothDivision/autheo-mcp.git
Set-Location autheo-mcp
py -3 -m venv .venv
.\\.venv\\Scripts\\python.exe -m pip install -e .

# Local server; MCP clients launch this over stdio.
.\\.venv\\Scripts\\python.exe -m autheo_mcp.server`,
    note: "Run in PowerShell from your preferred project drive. Python 3.11+ is required. Calling the venv executable directly avoids activation-policy changes. Stop with Ctrl+C.",
  },
  client: {
    label: "COMMON MCP CLIENT CONFIG / JSON",
    code: JSON.stringify(
      {
        mcpServers: {
          autheo: {
            command: "/absolute/path/autheo-mcp/.venv/bin/python",
            args: ["-m", "autheo_mcp.server"],
            env: {
              AUTHEO_DEVHUB_URL: "https://devhub.example.com",
              AUTHEO_MARKETPLACE_API_URL: "https://marketplace.example.com",
              AUTHEO_RPC_URL: "https://rpc.example.com",
              AUTHEO_REST_URL: "https://rest.example.com",
            },
          },
        },
      },
      null,
      2,
    ),
    note: "Replace every example URL and the executable path. On Windows, use the absolute .venv\\Scripts\\python.exe path (escape backslashes in JSON). Supply credentials through your client’s secure environment configuration. The exact config format depends on your client.",
  },
};
