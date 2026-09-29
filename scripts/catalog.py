"""Generate/check public tool metadata without importing or running the MCP server."""
import ast
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SERVER = ROOT / "src/autheo_mcp/server.py"
OUTPUT = ROOT / "frontend/catalog.json"
LOCAL = {"autheo_get_server_info", "autheo_get_integration_guide", "autheo_marketplace_categories"}
CHAIN = {"autheo_get_network_status", "autheo_get_latest_block", "autheo_get_block", "autheo_get_transaction", "autheo_get_account", "autheo_get_balance"}
LEGACY = {"autheo_compute_search", "autheo_storage_search", "autheo_get_provider", "autheo_get_provider_reputation"}
OVERRIDES = {
    "autheo_get_provider": "Inspect a DevHub node by ID. This is not a Marketplace provider identity.",
    "autheo_get_provider_reputation": "Inspect DevHub node capacity metadata. Not a verified commercial reputation score.",
    "autheo_compute_quote": "Return a legacy compute simulation with unavailable pricing. No purchasable quote is available; use listing estimates instead.",
    "autheo_storage_quote": "Return a legacy storage simulation with unavailable pricing. No storage contract is created; use listing estimates instead.",
    "autheo_devhub_get_project": "Inspect settings for a deployment-backed DevHub project, not a complete inventory of all projects.",
    "autheo_devhub_get_job": "Inspect a DevHub build by its ID. This does not schedule a job.",
    "autheo_convert_theo_to_usd": "Convert THEO to a display-only USD estimate using a fresh configured price feed. No trade is executed.",
    "autheo_convert_usd_to_theo": "Convert a USD amount to a display-only THEO estimate using a fresh configured price feed. No trade is executed.",
}

def catalog():
    result = []
    for item in ast.parse(SERVER.read_text()).body:
        if not isinstance(item, ast.AsyncFunctionDef):
            continue
        if not any(isinstance(d, ast.Call) and isinstance(d.func, ast.Attribute) and isinstance(d.func.value, ast.Name) and d.func.value.id == "mcp" and d.func.attr == "tool" for d in item.decorator_list):
            continue
        name = item.name
        if name in CHAIN:
            category, access = "Blockchain", "Configured CometBFT RPC or Cosmos REST endpoint. Network status also checks DevHub health."
        elif name.startswith("autheo_devhub_") or name in LEGACY:
            category, access = "DevHub", "Configured DevHub URL and Hive identity; scoped to the configured team."
        elif name.startswith("autheo_marketplace_") or name == "autheo_get_order":
            category, access = "Marketplace", "Configured Marketplace application URL. Public listing/capacity reads do not require a Clerk session."
            if "order" in name or "placement" in name or "settlement" in name or "provider_view" in name:
                access = "Configured Marketplace URL and a valid Clerk session. Upstream enforces buyer/provider role and tenant."
            if "l0_deployments" in name:
                access = "Private bridge URL and HMAC credentials; optional private CA and mTLS client certificates. Not public inventory."
        else:
            category, access = "Utilities", "Price conversions require a fresh configured Marketplace or explicit price feed. Unavailable prices are not fabricated."
        if name in LOCAL:
            access = "Local metadata only. No service endpoint or credentials required."
        if name.endswith("_quote"):
            access = "Legacy simulation only; returns unavailable pricing, never an authoritative checkout quote."
        mode = "Local" if name in LOCAL else "Simulate" if "estimate_listing" in name or name.endswith("_quote") or "convert_" in name else "Read"
        args = item.args.args
        first_default = len(args) - len(item.args.defaults)
        inputs = [{"name": arg.arg, "type": ast.unparse(arg.annotation) if arg.annotation else "any", "required": i < first_default} for i, arg in enumerate(args)]
        description = OVERRIDES.get(name, " ".join((ast.get_docstring(item) or "").split()))
        result.append(dict(name=name, category=category, mode=mode, description=description, access=access, inputs=inputs))
    featured = [
        "autheo_marketplace_list_listings", "autheo_devhub_list_deployments",
        "autheo_get_latest_block", "autheo_marketplace_estimate_listing",
        "autheo_devhub_get_build_logs", "autheo_get_integration_guide",
    ]
    result.sort(key=lambda tool: featured.index(tool["name"]) if tool["name"] in featured else len(featured))
    return result

if __name__ == "__main__":
    data = json.dumps(catalog(), indent=2, ensure_ascii=False) + "\n"
    if "--check" in sys.argv:
        if not OUTPUT.exists() or OUTPUT.read_text() != data:
            raise SystemExit("Tool catalog is stale. Run python3 frontend/scripts/catalog.py")
        print(f"Catalog matches all {len(catalog())} registered tools.")
    else:
        OUTPUT.write_text(data)
        print(f"Generated {len(catalog())} tool entries.")
