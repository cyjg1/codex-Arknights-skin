import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const windowsRoot = path.resolve(here, "..");
const template = await fs.readFile(path.join(windowsRoot, "assets", "renderer-inject.js"), "utf8");
const fixtureTheme = {
  id: "fixture-theme",
  name: "Codex Arknights Skin",
  carouselInterval: 12000,
  operators: [
    { id: "amiya", name: "Amiya", code: "R001", role: "Caster", tagline: "Continue.", colors: {} },
    { id: "chen", name: "Ch'en", code: "LM04", role: "Guard", tagline: "Advance.", colors: {} },
  ],
  colors: {},
};
const payload = template
  .replace("__DREAM_SKIN_CSS_JSON__", JSON.stringify(".fixture { color: blue; }"))
  .replace("__DREAM_SKIN_ARTS_JSON__", JSON.stringify([
    "data:image/png;base64,AA==",
    "data:image/png;base64,AA==",
  ]))
  .replace("__DREAM_SKIN_THEME_JSON__", JSON.stringify(fixtureTheme))
  .replace("__DREAM_SKIN_VERSION_JSON__", JSON.stringify("test-version"));

function createFixture({ shellPresent, staleSkin = false }) {
  const nodes = new Map();
  const rootClasses = new Set(staleSkin ? ["codex-dream-skin"] : []);
  const rootStyles = new Map(staleSkin ? [["--ark-art", "url(\"blob:stale\")"]] : []);
  const rootAttributes = new Map();
  const revokedUrls = [];
  let objectUrlIndex = 0;
  let hasShell = shellPresent;

  const makeClassList = (classes = new Set()) => ({
    add(...values) { values.forEach((value) => classes.add(value)); },
    remove(...values) { values.forEach((value) => classes.delete(value)); },
    toggle(value, enabled) {
      if (enabled) classes.add(value);
      else classes.delete(value);
    },
  });

  const root = {
    className: "",
    classList: makeClassList(rootClasses),
    style: {
      setProperty(key, value) { rootStyles.set(key, value); },
      removeProperty(key) { rootStyles.delete(key); },
    },
    appendChild(node) {
      node.parentElement = root;
      nodes.set(node.id, node);
    },
    setAttribute(key, value) { rootAttributes.set(key, String(value)); },
    getAttribute(key) { return rootAttributes.get(key) ?? null; },
    removeAttribute(key) { rootAttributes.delete(key); },
  };
  const body = {
    className: "",
    appendChild(node) {
      node.parentElement = body;
      nodes.set(node.id, node);
    },
  };
  const shellMain = {
    classList: makeClassList(),
    getBoundingClientRect() {
      return { left: 290, top: 36, width: 990, height: 784 };
    },
  };
  const staleHome = { classList: makeClassList(new Set(["ark-home"])) };
  const staleShell = { classList: makeClassList(new Set(["ark-home-shell"])) };

  const createElement = () => ({
    id: "",
    dataset: {},
    style: {},
    classList: makeClassList(),
    parentElement: null,
    textContent: "",
    innerHTML: "",
    setAttribute() {},
    removeAttribute() {},
    addEventListener() {},
    appendChild() {},
    contains() { return true; },
    remove() { nodes.delete(this.id); },
  });
  if (staleSkin) {
    const style = createElement();
    style.id = "codex-dream-skin-style";
    nodes.set(style.id, style);
    const chrome = createElement();
    chrome.id = "codex-dream-skin-chrome";
    nodes.set(chrome.id, chrome);
  }

  const document = {
    documentElement: root,
    head: root,
    body,
    createElement,
    getElementById(id) { return nodes.get(id) ?? null; },
    querySelector(selector) {
      if (selector === "main.main-surface") return hasShell ? shellMain : null;
      if (selector === "aside.app-shell-left-panel") return hasShell ? {} : null;
      return null;
    },
    querySelectorAll(selector) {
      if (!staleSkin) return [];
      if (selector === ".ark-home") return [staleHome];
      if (selector === ".ark-home-shell") return [staleShell];
      return [];
    },
  };
  const context = {
    window: {},
    document,
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    URL: {
      createObjectURL() { objectUrlIndex += 1; return `blob:fixture-${objectUrlIndex}`; },
      revokeObjectURL(value) { revokedUrls.push(value); },
    },
    Blob,
    Uint8Array,
    atob,
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 2,
    clearTimeout: () => {},
  };

  return {
    context,
    nodes,
    rootClasses,
    rootStyles,
    revokedUrls,
    setShellPresent(value) { hasShell = value; },
  };
}

const main = createFixture({ shellPresent: true });
const mainResult = vm.runInNewContext(payload, main.context);
assert.equal(mainResult.installed, true);
assert.equal(mainResult.operator, "amiya");
assert.equal(main.rootClasses.has("codex-dream-skin"), true);
assert.equal(main.rootStyles.get("--ark-art"), 'url("blob:fixture-1")');
assert.equal(main.nodes.has("codex-dream-skin-style"), true);
assert.equal(main.nodes.has("codex-dream-skin-chrome"), true);
main.context.window.__CODEX_DREAM_SKIN_STATE__.selectOperator(1, true);
assert.equal(main.context.window.__CODEX_DREAM_SKIN_STATE__.operator.id, "chen");
assert.equal(main.context.window.__CODEX_DREAM_SKIN_STATE__.autoplay, false);
assert.equal(main.rootStyles.get("--ark-art"), 'url("blob:fixture-2")');
assert.equal(main.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
assert.equal(main.rootClasses.has("codex-dream-skin"), false);
assert.equal(main.nodes.has("codex-dream-skin-style"), false);
assert.equal(main.nodes.has("codex-dream-skin-chrome"), false);
assert.deepEqual(main.revokedUrls, ["blob:fixture-1", "blob:fixture-2"]);

const auxiliary = createFixture({ shellPresent: false, staleSkin: true });
const auxiliaryResult = vm.runInNewContext(payload, auxiliary.context);
assert.equal(auxiliaryResult.installed, true);
assert.equal(auxiliary.rootClasses.has("codex-dream-skin"), false);
assert.equal(auxiliary.rootStyles.has("--ark-art"), false);
assert.equal(auxiliary.nodes.has("codex-dream-skin-style"), false);
assert.equal(auxiliary.nodes.has("codex-dream-skin-chrome"), false);

auxiliary.setShellPresent(true);
auxiliary.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(auxiliary.rootClasses.has("codex-dream-skin"), true);
assert.equal(auxiliary.nodes.has("codex-dream-skin-style"), true);
assert.equal(auxiliary.nodes.has("codex-dream-skin-chrome"), true);

console.log("PASS: renderer themes the Codex shell and preserves transparent auxiliary windows.");
