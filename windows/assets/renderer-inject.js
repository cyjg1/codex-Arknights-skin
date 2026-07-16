((cssText, artDataUrls, themeConfig) => {
  const STATE_KEY = "__CODEX_DREAM_SKIN_STATE__";
  const DISABLED_KEY = "__CODEX_DREAM_SKIN_DISABLED__";
  const STYLE_ID = "codex-dream-skin-style";
  const CHROME_ID = "codex-dream-skin-chrome";
  const RESTORE_ID = "codex-dream-skin-restore";
  const RESTORE_STYLE_ID = "codex-dream-skin-restore-style";
  const SHELL_ATTR = "data-dream-shell";
  const OPERATOR_ATTR = "data-ark-operator";
  const MODE_SOURCE_ATTR = "data-ark-mode-source";
  const VERSION = __DREAM_SKIN_VERSION_JSON__;
  const THEME = themeConfig && typeof themeConfig === "object" ? themeConfig : {};
  const ART_DATA = Array.isArray(artDataUrls) ? artDataUrls : [artDataUrls];
  const CAROUSEL_INTERVAL = Math.max(6000, Math.min(60000, Number(THEME.carouselInterval) || 12000));
  const STORAGE = {
    operator: "codex-arknights.operator",
    autoplay: "codex-arknights.autoplay",
    mode: "codex-arknights.mode",
    enabled: "codex-arknights.enabled",
  };
  const THEME_VARIABLES = [
    "--ark-bg", "--ark-panel", "--ark-panel-2", "--ark-text", "--ark-muted",
    "--ark-accent", "--ark-accent-alt", "--ark-secondary", "--ark-highlight",
    "--ark-line", "--ark-art", "--ark-name", "--ark-code", "--ark-role",
    "--ark-tagline", "--ark-quote", "--dream-skin-art", "--dream-skin-name",
    "--dream-skin-tagline", "--dream-skin-project-prefix", "--dream-skin-project-label",
  ];

  const rawOperators = Array.isArray(THEME.operators) && THEME.operators.length
    ? THEME.operators
    : [{
      id: THEME.id || "theme",
      name: THEME.name || "Codex Arknights Skin",
      code: "RI00",
      role: THEME.brandSubtitle || "ARKNIGHTS / CODEX FIELD TERMINAL",
      tagline: THEME.tagline || "Continue the operation.",
      quote: THEME.quote || "RHODES ISLAND",
      image: THEME.image,
      colors: THEME.colors || {},
    }];
  const operators = rawOperators.map((operator, index) => ({
    id: String(operator?.id || `operator-${index + 1}`),
    name: String(operator?.name || `Operator ${index + 1}`),
    code: String(operator?.code || `RI${String(index + 1).padStart(2, "0")}`),
    role: String(operator?.role || THEME.brandSubtitle || "RHODES ISLAND OPERATOR"),
    tagline: String(operator?.tagline || THEME.tagline || "Continue the operation."),
    quote: String(operator?.quote || THEME.quote || "RHODES ISLAND"),
    colors: operator?.colors && typeof operator.colors === "object" ? operator.colors : THEME.colors || {},
  }));

  const previous = window[STATE_KEY];
  previous?.observer?.disconnect?.();
  if (previous?.ensureTimer) clearInterval(previous.ensureTimer);
  if (previous?.carouselTimer) clearInterval(previous.carouselTimer);
  if (previous?.scheduler?.timeout) clearTimeout(previous.scheduler.timeout);
  if (previous?.resizeHandler) window.removeEventListener?.("resize", previous.resizeHandler);
  if (previous?.mediaHandler && previous?.mediaQuery) {
    try { previous.mediaQuery.removeEventListener("change", previous.mediaHandler); } catch {}
  }
  if (previous?.storageHandler) window.removeEventListener?.("storage", previous.storageHandler);
  for (const url of previous?.artUrls || []) URL.revokeObjectURL(url);
  if (previous?.artUrl) URL.revokeObjectURL(previous.artUrl);
  document.getElementById(CHROME_ID)?.remove();
  document.getElementById(RESTORE_ID)?.remove();
  document.getElementById(RESTORE_STYLE_ID)?.remove();
  window[DISABLED_KEY] = false;

  const dataUrlToObjectUrl = (dataUrl) => {
    const source = typeof dataUrl === "string" ? dataUrl : "data:image/png;base64,AA==";
    const comma = source.indexOf(",");
    const mime = /^data:([^;,]+)/.exec(source)?.[1] || "image/png";
    const binary = atob(source.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  };
  const artUrls = ART_DATA.map(dataUrlToObjectUrl);
  const cssString = (value) => JSON.stringify(String(value ?? ""));
  const readStorage = (key) => {
    try { return window.localStorage?.getItem(key) ?? null; } catch { return null; }
  };
  const writeStorage = (key, value) => {
    try { window.localStorage?.setItem(key, String(value)); } catch {}
  };
  const removeStorage = (key) => {
    try { window.localStorage?.removeItem(key); } catch {}
  };

  let operatorIndex = Math.max(0, operators.findIndex((item) => item.id === readStorage(STORAGE.operator)));
  let autoplay = readStorage(STORAGE.autoplay) !== "false";
  let modePreference = ["auto", "light", "dark"].includes(readStorage(STORAGE.mode))
    ? readStorage(STORAGE.mode) : "auto";
  let themeEnabled = readStorage(STORAGE.enabled) !== "false";
  let controlsOpen = false;
  let nextSlideAt = Date.now() + CAROUSEL_INTERVAL;

  const localTimeMode = () => {
    const hour = new Date().getHours();
    return hour >= 7 && hour < 18 ? "light" : "dark";
  };
  const activeShellMode = () => modePreference === "auto" ? localTimeMode() : modePreference;

  const clearSkinDom = ({ preserveRestore = false } = {}) => {
    const root = document.documentElement;
    root?.classList.remove("codex-dream-skin", "ark-operator-transition");
    root?.removeAttribute?.(SHELL_ATTR);
    root?.removeAttribute?.(OPERATOR_ATTR);
    root?.removeAttribute?.(MODE_SOURCE_ATTR);
    for (const name of THEME_VARIABLES) root?.style.removeProperty(name);
    document.querySelectorAll?.(".ark-home").forEach((node) => node.classList.remove("ark-home"));
    document.querySelectorAll?.(".ark-home-shell").forEach((node) => node.classList.remove("ark-home-shell"));
    document.querySelectorAll?.(".ark-sidebar-decor").forEach((node) => node.remove());
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(CHROME_ID)?.remove();
    if (!preserveRestore) {
      document.getElementById(RESTORE_ID)?.remove();
      document.getElementById(RESTORE_STYLE_ID)?.remove();
    }
  };

  const detectNativeShell = (shellMain) => {
    for (const node of [shellMain, document.body, document.documentElement]) {
      let value = "";
      try { value = window.getComputedStyle?.(node)?.backgroundColor || ""; } catch {}
      const match = /^rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)(?:\s*[,/]\s*([\d.]+))?/i.exec(value);
      if (!match || (match[4] !== undefined && Number(match[4]) < .12)) continue;
      const luminance = .2126 * Number(match[1]) + .7152 * Number(match[2]) + .0722 * Number(match[3]);
      return luminance >= 150 ? "light" : "dark";
    }
    try { return window.matchMedia?.("(prefers-color-scheme: light)")?.matches ? "light" : "dark"; } catch {}
    return "dark";
  };

  const ensureRestoreButton = (shellMain) => {
    const root = document.documentElement;
    let style = document.getElementById(RESTORE_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = RESTORE_STYLE_ID;
      (document.head || root).appendChild(style);
    }
    const restoreStyleText = `
      #${RESTORE_ID} {
        position: fixed;
        z-index: 31;
        right: 16px;
        top: 4px;
        width: 44px;
        height: 44px;
        padding: 4px 0 3px;
        display: grid;
        place-items: center;
        align-content: center;
        border: 1px solid rgba(128, 138, 142, .42);
        border-radius: 3px;
        color: #eef2f3;
        background: rgba(18, 22, 24, .92);
        box-shadow: 0 10px 24px rgba(0, 0, 0, .18);
        font-family: Inter, "Segoe UI", sans-serif;
        cursor: pointer;
        transition: transform .16s ease, border-color .16s ease, background-color .16s ease;
      }
      #${RESTORE_ID}[data-native-shell="light"] {
        color: #171a1b;
        border-color: rgba(23, 26, 27, .18);
        background: rgba(250, 251, 250, .96);
        box-shadow: 0 8px 22px rgba(28, 38, 40, .10);
      }
      #${RESTORE_ID} span {
        color: #64c7df;
        font: 800 17px/1 Inter, sans-serif;
      }
      #${RESTORE_ID} small {
        margin-top: -1px;
        color: currentColor;
        font: 850 7px/1 Inter, sans-serif;
        letter-spacing: .12em;
      }
      #${RESTORE_ID}:hover {
        border-color: #64c7df;
        background: rgba(24, 30, 33, .97);
        transform: translateY(-1px);
      }
      #${RESTORE_ID}[data-native-shell="light"]:hover {
        background: #fff;
      }
      #${RESTORE_ID}:focus-visible {
        outline: 2px solid #64c7df;
        outline-offset: 2px;
      }
      @media (prefers-reduced-motion: reduce) {
        #${RESTORE_ID} { transition: none; }
      }
    `;
    if (style.textContent !== restoreStyleText) style.textContent = restoreStyleText;
    let button = document.getElementById(RESTORE_ID);
    if (button?.parentElement !== document.body) {
      button?.remove();
      button = document.createElement("button");
      button.id = RESTORE_ID;
      button.type = "button";
      button.innerHTML = '<span aria-hidden="true">△</span><small aria-hidden="true">RI</small>';
      button.title = "恢复 Codex Arknights Skin";
      button.setAttribute("aria-label", "恢复 Codex Arknights Skin");
      button.addEventListener?.("click", () => setThemeEnabled(true));
      document.body.appendChild(button);
    }
    const nativeShell = detectNativeShell(shellMain);
    if (button.dataset.nativeShell !== nativeShell) button.dataset.nativeShell = nativeShell;
    const shellBox = shellMain?.getBoundingClientRect?.();
    if (shellBox) {
      const left = `${Math.max(8, Math.round(shellBox.left + shellBox.width - 60))}px`;
      const top = `${Math.max(4, Math.round(shellBox.top + 4))}px`;
      if (button.style.left !== left) button.style.left = left;
      if (button.style.right !== "auto") button.style.right = "auto";
      if (button.style.top !== top) button.style.top = top;
    } else {
      if (button.style.left) button.style.left = "";
      if (button.style.right !== "16px") button.style.right = "16px";
      if (button.style.top !== "4px") button.style.top = "4px";
    }
    return button;
  };

  const clearRestoreButton = () => {
    document.getElementById(RESTORE_ID)?.remove();
    document.getElementById(RESTORE_STYLE_ID)?.remove();
  };

  const applyOperator = (root, shell) => {
    const operator = operators[operatorIndex] || operators[0];
    const colors = operator.colors || {};
    const light = shell === "light";
    const palette = light ? {
      "--ark-bg": "#E9ECEC",
      "--ark-panel": "#F8F9F8",
      "--ark-panel-2": "#DFE4E4",
      "--ark-text": "#171A1B",
      "--ark-muted": "#596164",
      "--ark-accent": colors.accent || "#287E96",
      "--ark-accent-alt": colors.highlight || colors.accentAlt || "#B43A35",
      "--ark-secondary": colors.secondary || "#4B708C",
      "--ark-highlight": colors.highlight || "#B43A35",
      "--ark-line": colors.line || "rgba(23, 26, 27, .18)",
    } : {
      "--ark-bg": THEME.colors?.background || "#080B0D",
      "--ark-panel": THEME.colors?.panel || "#111619",
      "--ark-panel-2": THEME.colors?.panelAlt || "#171D21",
      "--ark-text": THEME.colors?.text || "#F2F5F5",
      "--ark-muted": THEME.colors?.muted || "#9BA5A8",
      "--ark-accent": colors.accent || THEME.colors?.accent || "#48B6D4",
      "--ark-accent-alt": colors.accentAlt || THEME.colors?.accentAlt || "#CBEFFF",
      "--ark-secondary": colors.secondary || THEME.colors?.secondary || "#7697FF",
      "--ark-highlight": colors.highlight || THEME.colors?.highlight || "#FF634D",
      "--ark-line": colors.line || THEME.colors?.line || "rgba(72, 182, 212, .34)",
    };
    for (const [name, value] of Object.entries(palette)) root.style.setProperty(name, value);
    const artUrl = artUrls[operatorIndex] || artUrls[0];
    root.style.setProperty("--ark-art", `url("${artUrl}")`);
    root.style.setProperty("--dream-skin-art", `url("${artUrl}")`);
    root.style.setProperty("--ark-name", cssString(operator.name));
    root.style.setProperty("--ark-code", cssString(operator.code));
    root.style.setProperty("--ark-role", cssString(operator.role));
    root.style.setProperty("--ark-tagline", cssString(operator.tagline));
    root.style.setProperty("--ark-quote", cssString(operator.quote));
    root.style.setProperty("--dream-skin-name", cssString(operator.name));
    root.style.setProperty("--dream-skin-tagline", cssString(operator.tagline));
    root.style.setProperty("--dream-skin-project-prefix", cssString(THEME.projectPrefix || "作战目录 / "));
    root.style.setProperty("--dream-skin-project-label", cssString(THEME.projectLabel || "作战目录"));
    root.setAttribute?.(OPERATOR_ATTR, operator.id);
    root.setAttribute?.(SHELL_ATTR, shell);
    root.setAttribute?.(MODE_SOURCE_ATTR, modePreference);
  };

  const buildChrome = (chrome) => {
    chrome.innerHTML = `
      <div class="ark-brand">
        <span class="ark-brand-mark" aria-hidden="true"><i></i></span>
        <span><b>CODEX ARKNIGHTS SKIN</b><small>RHODES ISLAND / FIELD TERMINAL</small></span>
      </div>
      <div class="ark-telemetry" aria-live="polite">
        <span class="ark-operator-code"></span><b class="ark-operator-name"></b><small class="ark-operator-role"></small>
      </div>
      <div class="ark-status"><i></i><span>P.R.T.S. LINK ONLINE</span></div>
      <div class="ark-quote"></div>
      <div class="ark-scanline" aria-hidden="true"></div>
      <button type="button" class="ark-native-toggle" data-ark-action="theme-off" aria-label="关闭明日方舟主题并恢复 Codex 原始界面">
        <small>NATIVE</small><b>UI</b>
      </button>
      <button type="button" class="ark-control-toggle" data-ark-action="controls" aria-expanded="false" aria-label="Open operator controls">
        <small>OPERATOR</small><b class="ark-control-current"></b><i aria-hidden="true"></i>
      </button>
      <div class="ark-operator-panel" aria-label="Arknights operator and appearance controls">
        <button type="button" class="ark-step" data-ark-action="previous" aria-label="Previous operator">‹</button>
        <div class="ark-operator-rail" role="group" aria-label="Choose operator"></div>
        <button type="button" class="ark-step" data-ark-action="next" aria-label="Next operator">›</button>
        <span class="ark-control-separator" aria-hidden="true"></span>
        <button type="button" class="ark-state-button" data-ark-action="autoplay"></button>
        <button type="button" class="ark-state-button" data-ark-action="mode"></button>
      </div>`;
    const rail = chrome.querySelector?.(".ark-operator-rail");
    if (rail) {
      for (const [index, operator] of operators.entries()) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ark-operator-button";
        button.dataset.operatorIndex = String(index);
        button.setAttribute("aria-label", `Select ${operator.name}`);
        button.textContent = operator.name.split(" /")[0].replace("Kal'tsit", "KAL'TSIT").toUpperCase();
        rail.appendChild(button);
      }
    }
    chrome.addEventListener?.("click", (event) => {
      const button = event.target?.closest?.("button");
      if (!button || !chrome.contains(button)) return;
      if (button.dataset.operatorIndex !== undefined) {
        selectOperator(Number(button.dataset.operatorIndex), true);
        controlsOpen = false;
        ensure();
        return;
      }
      const action = button.dataset.arkAction;
      if (action === "controls") {
        controlsOpen = !controlsOpen;
        ensure();
        return;
      }
      if (action === "previous") selectOperator(operatorIndex - 1, true);
      if (action === "next") selectOperator(operatorIndex + 1, true);
      if (action === "autoplay") {
        autoplay = !autoplay;
        nextSlideAt = Date.now() + CAROUSEL_INTERVAL;
        writeStorage(STORAGE.autoplay, autoplay);
        ensure();
      }
      if (action === "mode") {
        const modes = ["auto", "light", "dark"];
        modePreference = modes[(modes.indexOf(modePreference) + 1) % modes.length];
        writeStorage(STORAGE.mode, modePreference);
        ensure();
      }
      if (action === "theme-off") setThemeEnabled(false);
    });
  };

  const syncChrome = (chrome) => {
    if (!chrome?.querySelector) return;
    const operator = operators[operatorIndex] || operators[0];
    const setText = (selector, value) => {
      const node = chrome.querySelector(selector);
      if (node && node.textContent !== value) node.textContent = value;
    };
    setText(".ark-operator-code", operator.code);
    setText(".ark-operator-name", operator.name);
    setText(".ark-operator-role", operator.role);
    setText(".ark-quote", operator.quote);
    setText(".ark-control-current", operator.name.split(" /")[0]);
    setText("[data-ark-action='autoplay']", autoplay ? "ROTATE ON" : "ROTATE OFF");
    setText("[data-ark-action='mode']", modePreference === "auto"
      ? `AUTO · ${activeShellMode().toUpperCase()}` : `${modePreference.toUpperCase()} MODE`);
    chrome.classList.toggle("ark-controls-open", controlsOpen);
    const controlsToggle = chrome.querySelector("[data-ark-action='controls']");
    controlsToggle?.setAttribute("aria-expanded", String(controlsOpen));
    controlsToggle?.setAttribute("aria-label", `${controlsOpen ? "Close" : "Open"} operator controls for ${operator.name}`);
    chrome.querySelectorAll(".ark-operator-button").forEach((button, index) => {
      const active = index === operatorIndex;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      if (active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    chrome.querySelector("[data-ark-action='autoplay']")?.setAttribute("aria-pressed", String(autoplay));
    chrome.querySelector("[data-ark-action='mode']")?.setAttribute(
      "aria-label", `Appearance: ${modePreference}. Activate to change mode.`,
    );
  };

  const ensureSidebarDecor = (sidebar) => {
    document.querySelectorAll?.(".ark-sidebar-decor").forEach((node) => {
      if (node.parentElement !== sidebar) node.remove();
    });
    let decor = sidebar.querySelector?.(".ark-sidebar-decor");
    if (decor?.parentElement === sidebar) return decor;
    decor = document.createElement("div");
    decor.className = "ark-sidebar-decor";
    decor.setAttribute("aria-hidden", "true");
    decor.innerHTML = `
      <span class="ark-sidebar-emblem"><i></i></span>
      <span class="ark-sidebar-rail"><b>RI // 001</b><i></i><small>RHODES ISLAND · 罗德岛</small></span>
      <span class="ark-sidebar-pulse"></span>`;
    sidebar.appendChild?.(decor);
    return decor;
  };

  const ensure = () => {
    if (window[DISABLED_KEY]) return;
    const root = document.documentElement;
    const shellMain = document.querySelector?.("main.main-surface");
    if (!root || !document.body) {
      clearSkinDom();
      return;
    }
    if (!themeEnabled) {
      if (!shellMain && !document.getElementById(RESTORE_ID)) {
        clearSkinDom();
        return;
      }
      clearSkinDom({ preserveRestore: true });
      ensureRestoreButton(shellMain);
      return;
    }
    const shellSidebar = document.querySelector?.("aside.app-shell-left-panel");
    if (!shellMain || !shellSidebar) {
      clearSkinDom();
      return;
    }
    clearRestoreButton();
    root.classList.add("codex-dream-skin");
    const shell = activeShellMode();
    applyOperator(root, shell);

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || root).appendChild(style);
    }
    if (style.dataset.dreamSkinVersion !== VERSION || style.textContent !== cssText) {
      style.textContent = cssText;
      style.dataset.dreamSkinVersion = VERSION;
    }

    const homeIndicator = document.querySelector?.('[data-testid="home-icon"]');
    const home = homeIndicator?.closest?.('[role="main"]') ||
      [...document.querySelectorAll?.('[role="main"]') || []].find((candidate) =>
        candidate.querySelector?.('[data-feature="game-source"]') &&
        candidate.querySelector?.('.group\\/home-suggestions')) || null;
    document.querySelectorAll?.("[role='main'].ark-home").forEach((candidate) => {
      if (candidate !== home) candidate.classList.remove("ark-home");
    });
    if (home) home.classList.add("ark-home");
    shellMain.classList.toggle("ark-home-shell", Boolean(home));
    ensureSidebarDecor(shellSidebar);

    let chrome = document.getElementById(CHROME_ID);
    if (!chrome || chrome.parentElement !== document.body || !chrome.querySelector?.(".ark-control-toggle")) {
      chrome?.remove();
      chrome = document.createElement("div");
      chrome.id = CHROME_ID;
      buildChrome(chrome);
      document.body.appendChild(chrome);
    }
    const shellBox = shellMain.getBoundingClientRect();
    chrome.style.left = `${Math.round(shellBox.left)}px`;
    chrome.style.top = `${Math.round(shellBox.top)}px`;
    chrome.style.width = `${Math.round(shellBox.width)}px`;
    chrome.style.height = `${Math.round(shellBox.height)}px`;
    chrome.classList.toggle("ark-home-shell", Boolean(home));
    chrome.dataset.dreamShell = shell;
    syncChrome(chrome);
  };

  function setThemeEnabled(nextEnabled) {
    const enabled = Boolean(nextEnabled);
    if (themeEnabled === enabled) {
      ensure();
      return themeEnabled;
    }
    themeEnabled = enabled;
    controlsOpen = false;
    nextSlideAt = Date.now() + CAROUSEL_INTERVAL;
    writeStorage(STORAGE.enabled, themeEnabled);
    ensure();
    setTimeout(() => {
      const target = themeEnabled
        ? document.querySelector?.("#codex-dream-skin-chrome .ark-control-toggle")
        : document.getElementById(RESTORE_ID);
      target?.focus?.();
    }, 0);
    return themeEnabled;
  }

  function selectOperator(nextIndex, manual = false) {
    const normalized = ((Number(nextIndex) % operators.length) + operators.length) % operators.length;
    if (manual) {
      autoplay = false;
      writeStorage(STORAGE.autoplay, false);
    }
    if (normalized !== operatorIndex) {
      operatorIndex = normalized;
      writeStorage(STORAGE.operator, operators[operatorIndex].id);
      const root = document.documentElement;
      root?.classList.add("ark-operator-transition");
      setTimeout(() => root?.classList.remove("ark-operator-transition"), 320);
    }
    nextSlideAt = Date.now() + CAROUSEL_INTERVAL;
    ensure();
  }

  const cleanup = () => {
    window[DISABLED_KEY] = true;
    clearSkinDom();
    const state = window[STATE_KEY];
    state?.observer?.disconnect?.();
    if (state?.ensureTimer) clearInterval(state.ensureTimer);
    if (state?.carouselTimer) clearInterval(state.carouselTimer);
    if (state?.scheduler?.timeout) clearTimeout(state.scheduler.timeout);
    if (state?.resizeHandler) window.removeEventListener?.("resize", state.resizeHandler);
    if (state?.mediaHandler && state?.mediaQuery) {
      try { state.mediaQuery.removeEventListener("change", state.mediaHandler); } catch {}
    }
    if (state?.storageHandler) window.removeEventListener?.("storage", state.storageHandler);
    removeStorage(STORAGE.enabled);
    for (const url of state?.artUrls || []) URL.revokeObjectURL(url);
    delete window[STATE_KEY];
    return true;
  };

  const scheduler = { timeout: null };
  const scheduleEnsure = () => {
    if (scheduler.timeout) clearTimeout(scheduler.timeout);
    scheduler.timeout = setTimeout(() => {
      scheduler.timeout = null;
      ensure();
    }, 180);
  };
  const observer = new MutationObserver(scheduleEnsure);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "data-theme", "data-appearance", "data-color-mode", "style"],
  });
  const ensureTimer = setInterval(ensure, 4000);
  const carouselTimer = setInterval(() => {
    if (!themeEnabled || !autoplay || document.visibilityState === "hidden" || Date.now() < nextSlideAt) return;
    selectOperator(operatorIndex + 1, false);
  }, 1000);
  const resizeHandler = scheduleEnsure;
  window.addEventListener?.("resize", resizeHandler, { passive: true });
  let mediaQuery = null;
  let mediaHandler = null;
  try {
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaHandler = scheduleEnsure;
    mediaQuery.addEventListener("change", mediaHandler);
  } catch {}
  const storageHandler = (event) => {
    if (event?.key !== STORAGE.enabled) return;
    themeEnabled = event.newValue !== "false";
    controlsOpen = false;
    nextSlideAt = Date.now() + CAROUSEL_INTERVAL;
    ensure();
  };
  window.addEventListener?.("storage", storageHandler);

  window[STATE_KEY] = {
    ensure,
    cleanup,
    selectOperator,
    setEnabled: setThemeEnabled,
    observer,
    ensureTimer,
    carouselTimer,
    scheduler,
    resizeHandler,
    mediaQuery,
    mediaHandler,
    storageHandler,
    artUrls,
    version: VERSION,
    themeId: THEME.id || "codex-arknights-skin",
    get operator() { return operators[operatorIndex]; },
    get autoplay() { return autoplay; },
    get mode() { return modePreference; },
    get enabled() { return themeEnabled; },
  };
  ensure();
  return {
    installed: true,
    version: VERSION,
    themeId: THEME.id || "codex-arknights-skin",
    operator: operators[operatorIndex].id,
    autoplay,
    enabled: themeEnabled,
    shell: activeShellMode(),
  };
})(__DREAM_SKIN_CSS_JSON__, __DREAM_SKIN_ARTS_JSON__, __DREAM_SKIN_THEME_JSON__)
