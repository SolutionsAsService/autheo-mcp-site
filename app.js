import { filterTools, setups, examples } from "./content.js";

let catalog = [];
let selectedCategory = "All";
let expanded = false;
const search = document.querySelector("#tool-search");
const list = document.querySelector("#tool-list");
const more = document.querySelector("#show-more");
const count = document.querySelector("#tool-count");

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
function renderTools() {
  const matches = filterTools(catalog, selectedCategory, search.value);
  const visible = expanded ? matches : matches.slice(0, 6);
  count.textContent = `${matches.length} ${matches.length === 1 ? "tool" : "tools"} · ${visible.length} shown`;
  list.replaceChildren(
    ...visible.map((tool) => {
      const card = element("article", "tool-card");
      const top = element("div", "tool-card-top");
      top.append(
        element("span", "", tool.category.toUpperCase()),
        element("span", "mode-badge", tool.mode.toUpperCase()),
      );
      const detail = element("details");
      detail.append(element("summary", "", "Access & inputs"));
      detail.append(element("p", "", tool.access));
      detail.append(
        element(
          "p",
          "",
          tool.inputs.length
            ? `Inputs: ${tool.inputs.map((input) => `${input.name} (${input.required ? "required" : "optional"})`).join(", ")}`
            : "Inputs: none.",
        ),
      );
      card.append(
        top,
        element("h3", "", tool.name),
        element("p", "", tool.description),
        detail,
      );
      return card;
    }),
  );
  more.hidden = matches.length <= 6;
  more.textContent = expanded
    ? "Show fewer tools ↑"
    : `Show all ${matches.length} tools ↓`;
  document.querySelector("#empty-state").hidden = matches.length > 0;
}
function setCategory(category) {
  selectedCategory = category;
  expanded = false;
  document.querySelectorAll("[data-category]").forEach((button) => {
    const active = button.dataset.category === category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderTools();
}
document
  .querySelectorAll("[data-category]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      setCategory(button.dataset.category),
    ),
  );
document.querySelectorAll("[data-category-link]").forEach((link) =>
  link.addEventListener("click", () => {
    search.value = "";
    setCategory(link.dataset.categoryLink);
  }),
);
search.addEventListener("input", () => {
  expanded = false;
  renderTools();
});
more.addEventListener("click", () => {
  expanded = !expanded;
  renderTools();
  if (!expanded) document.querySelector("#tools").scrollIntoView();
});
document.querySelector("#reset-search").addEventListener("click", () => {
  search.value = "";
  setCategory("All");
  search.focus();
});
try {
  const response = await fetch(new URL("./catalog.json", import.meta.url));
  if (!response.ok) throw new Error("Catalog unavailable");
  catalog = await response.json();
  renderTools();
} catch {
  count.textContent =
    "The tool catalog could not load. Reload the page to try again.";
  list.append(
    element("a", "text-link", "Read the registered tools on GitHub ↗"),
  );
  list.firstChild.href =
    "https://github.com/ThothDivision/autheo-mcp/blob/main/src/autheo_mcp/server.py";
}

document.querySelectorAll("[data-scenario]").forEach((button) =>
  button.addEventListener("click", () => {
    const example = examples[button.dataset.scenario];
    document.querySelectorAll("[data-scenario]").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    document.querySelector("#example-prompt").textContent = example.prompt;
    document.querySelector("#example-call").textContent = example.call;
    document.querySelector("#example-args").textContent = example.args;
    document.querySelector("#example-result").textContent = example.result;
  }),
);
let platform = "unix";
function showSetup() {
  const setup = setups[platform];
  document.querySelector("#setup-code").textContent = setup.code;
  document.querySelector("#setup-note").textContent = setup.note;
  document.querySelector("#code-label").textContent = setup.label;
  document.querySelector("#copy-setup").textContent =
    platform === "client" ? "Copy JSON" : "Copy commands";
  document.querySelector("#copy-status").textContent = "";
  document.querySelectorAll("[data-platform]").forEach((button) => {
    button.classList.toggle("active", button.dataset.platform === platform);
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.platform === platform),
    );
  });
}
document.querySelectorAll("[data-platform]").forEach((button) =>
  button.addEventListener("click", () => {
    platform = button.dataset.platform;
    showSetup();
  }),
);
document.querySelector("#copy-setup").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(setups[platform].code);
    document.querySelector("#copy-status").textContent = "Copied to clipboard.";
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("#setup-code"));
    selection.removeAllRanges();
    selection.addRange(range);
    document.querySelector("#copy-status").textContent =
      "Clipboard unavailable. Commands selected; use Ctrl+C or ⌘C to copy.";
  }
});
showSetup();
