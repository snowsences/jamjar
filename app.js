import {
  platform,
  reducedMotion,
  phone,
  SPRING,
  EASE_IN,
  haptic,
  velocityTracker,
  ripple,
} from "./motion.js";
const root = document.getElementById("app");
const PREVIEW = ["terminal.local", "localhost", "127.0.0.1"].includes(
  location.hostname,
);
const SIGNED_IN_KEY = "jamjar:signed-in";
let wasSignedIn = false;
// A signed-in launch needs Firestore straight away, so fetch it alongside the
// rest of the code instead of after firebase-client.js has loaded.
try {
  wasSignedIn = !PREVIEW && Boolean(localStorage.getItem(SIGNED_IN_KEY));
  if (wasSignedIn) {
    const preload = document.createElement("link");
    preload.rel = "modulepreload";
    preload.href = "./vendor/firebase-firestore.js";
    document.head.append(preload);
  }
} catch {}
const PALETTES = {
  grocery: ["#E32960", "#F9732F", "#FEA000"],
  pantry: ["#007DC2", "#00AB6C", "#8AD928"],
  shopping: ["#8F29E3", "#E71AB4", "#FE0061"],
};
const PANTRY_CATEGORIES = [
  "All",
  "Snacks/Meals",
  "Grains",
  "Baking",
  "Spices",
  "Pet/Home",
  "Other",
];
const ITEM_CATEGORIES = PANTRY_CATEGORIES.slice(1);
const PANTRY_PALETTES = {
  "Snacks/Meals": ["#E34529", "#F9622F", "#FE8C00"],
  Grains: PALETTES.pantry,
  Baking: ["#4F341A", "#743F14", "#C97221"],
  Spices: ["#D1351A", "#8F2400", "#713E1D"],
  "Pet/Home": ["#0052E9", "#2F94F9", "#00C7FE"],
  Other: ["#414C51", "#55636A", "#6A7C84"],
};
const samples = [
  {
    id: "s1",
    description: "Stone-ground spaghetti",
    quantity: "2 packs",
    list: "grocery",
    createdAt: 3,
    updatedAt: 3,
  },
  {
    id: "s2",
    description: "Fresh basil",
    quantity: "2 bunches",
    list: "grocery",
    createdAt: 2,
    updatedAt: 2,
  },
  {
    id: "s3",
    description: "Parmigiano Reggiano",
    quantity: "",
    list: "grocery",
    completed: true,
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: "s4",
    description: "San Marzano tomatoes",
    quantity: "4 cans",
    list: "pantry",
    category: "Grains",
    createdAt: 4,
    updatedAt: 4,
  },
  {
    id: "s5",
    description: "Fish sauce",
    quantity: "1 bottle",
    list: "pantry",
    category: "Spices",
    createdAt: 3,
    updatedAt: 3,
  },
  {
    id: "s6",
    description: "Dried chickpeas",
    quantity: "1 bag",
    list: "pantry",
    category: "Grains",
    createdAt: 2,
    updatedAt: 2,
  },
  {
    id: "s7",
    description: "Birthday candles",
    quantity: "1 pack",
    list: "shopping",
    createdAt: 2,
    updatedAt: 2,
  },
];
const s = {
  tab: "grocery",
  items: PREVIEW ? [...samples] : [],
  logs: [],
  actor: PREVIEW
    ? { uid: "preview", email: "preview@jamjar.local", displayName: "Kevin" }
    : null,
  authKnown: PREVIEW,
  ready: PREVIEW,
  loaded: PREVIEW,
  history: false,
  query: "",
  pantryCategory: "All",
  itemCategory: "Other",
  editor: false,
  editId: null,
  desc: "",
  qty: "",
  error: "",
  clearList: "",
  del: false,
  status: PREVIEW ? "Preview data" : "Connecting…",
  install: false,
  revealId: null,
  oneHanded: false,
  undoPendingId: null,
  saving: false,
};
let api = null;
let installPrompt = null;
let renderFrame = 0;
const e = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const paths = {
  archive:
    '<path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  history:
    '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  logout:
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  package:
    '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.1h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.8-2.8.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.9v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.9h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 21 10h.1v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
  basket:
    '<path d="M3 11h18l-2 9H5l-2-9Z"/><path d="m8 11 4-7 4 7"/><path d="M8 15v2M12 15v2M16 15v2"/>',
  shopping:
    '<path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 11v6M14 11v6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
};
const I = (n) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[n] || ""}</svg>`;
const appIcon = (className = "", src = "./icon-192.png") =>
  `<img class="app-icon ${className}" src="${src}" alt="">`;
const mixColor = (from, to, amount) => {
  const a = from.match(/[\da-f]{2}/gi).map((v) => parseInt(v, 16)),
    b = to.match(/[\da-f]{2}/gi).map((v) => parseInt(v, 16));
  return `#${a
    .map((v, i) =>
      Math.round(v + (b[i] - v) * amount)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};
const gradientPosition = (index, total) => {
  if (total <= 1) return 50;
  if (total <= 11) return 50 + (index - (total - 1) / 2) * 10;
  if (total <= 101) return (index * 100) / (total - 1);
  return index % 101;
};
const gradientColor = (colors, percent) =>
  percent <= 50
    ? mixColor(colors[0], colors[1], percent / 50)
    : mixColor(colors[1], colors[2], (percent - 50) / 50);
const rowColors = (list, index, total, category = "Other") => {
  const palette =
    list === "pantry"
      ? PANTRY_PALETTES[category] || PANTRY_PALETTES.Other
      : PALETTES[list];
  const base = gradientColor(palette, gradientPosition(index, total));
  return {
    top: mixColor(base, "#ffffff", 0.0225),
    bottom: mixColor(base, "#000000", 0.0225),
  };
};
const normalizedCategory = (value) =>
  ITEM_CATEGORIES.includes(value) ? value : "Other";
const compareDescriptions = (a, b) =>
  a.description.localeCompare(b.description, undefined, {
    sensitivity: "base",
    numeric: true,
  });
const listActive = (list) =>
    s.items
      .filter((x) => x.list === list && !x.completed)
      .sort(
        (a, b) =>
          (a.listAddedAt || a.createdAt || 0) -
          (b.listAddedAt || b.createdAt || 0),
      ),
  listDone = (list) =>
    s.items
      .filter((x) => x.list === list && x.completed)
      .sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0)),
  pantryItems = (category = s.pantryCategory, query = s.query) => {
    const items = s.items
      .filter(
        (x) =>
          x.list === "pantry" &&
          (category === "All" || normalizedCategory(x.category) === category) &&
          x.description.toLowerCase().includes(query.trim().toLowerCase()),
      );
    if (category !== "All") {
      return items.sort(compareDescriptions);
    }
    return items.sort((a, b) => {
      const categoryOrder =
        ITEM_CATEGORIES.indexOf(normalizedCategory(a.category)) -
        ITEM_CATEGORIES.indexOf(normalizedCategory(b.category));
      return (
        categoryOrder ||
        compareDescriptions(a, b)
      );
    });
  },
  pantry = () => pantryItems();
const itemSnapshot = (item) =>
  item
    ? {
        id: item.id,
        description: item.description || "",
        quantity: item.quantity || "",
        list: item.list || "grocery",
        completed: Boolean(item.completed),
        category: item.category || "",
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now(),
        listAddedAt: item.listAddedAt || item.createdAt || Date.now(),
      }
    : null;
function addLocalLog(action, item, beforeItems, afterItems, extra = {}) {
  const now = Date.now(),
    log = {
      id: crypto.randomUUID(),
      action,
      description: item.description,
      quantity: item.quantity || "",
      actorEmail: s.actor?.email || "",
      actorName: s.actor?.displayName || "Kevin",
      createdAt: now,
      fromList: item.list,
      toList: extra.toList || "",
      beforeItems: beforeItems.map(itemSnapshot),
      afterItems: afterItems.map(itemSnapshot),
      ...extra,
    };
  s.logs = [log, ...s.logs];
  return log;
}
function local(action, item, patch = {}) {
  const now = Date.now(),
    before = itemSnapshot(s.items.find((x) => x.id === item.id));
  let after = null;
  if (action === "added") {
    after = itemSnapshot({ ...item, ...patch });
    s.items = [after, ...s.items];
  } else if (["deleted", "cleared"].includes(action))
    s.items = s.items.filter((x) => x.id !== item.id);
  else {
    after = itemSnapshot({ ...item, ...patch, updatedAt: now });
    s.items = s.items.map((x) =>
      x.id === item.id ? after : x,
    );
  }
  return addLocalLog(action, item, before ? [before] : [], after ? [after] : [], {
    toList: patch.list || "",
  });
}
function gate() {
  patch(`<main class="gate"><div class="gate-card">${appIcon("gate-icon")}<h1>Jamjar</h1>${!s.authKnown ? `<p>${s.ready ? "Sign in with Google to share your grocery list and pantry." : "Opening your lists…"}</p>` : ""}<button class="btn google-button" id="signin" ${!s.ready ? "disabled" : ""}>Sign in with Google</button></div></main>`);
}
function historyMarkup() {
  const sorted = [...s.logs].sort((a, b) => b.createdAt - a.createdAt);
  const h = sorted
    .map(
      (l, index) => {
        const actor = l.actorName || String(l.actorEmail || "").split("@")[0],
          actionText =
            l.action === "cleared_completed"
              ? `cleared completed items from ${listLabel(l.fromList)}`
              : l.action === "undid"
                ? `undid ${String(l.targetAction || "an action").replaceAll("_", " ")}`
                : `${String(l.action || "changed").replaceAll("_", " ")} “${l.description}”`,
          icon = l.action === "deleted" || l.action.includes("cleared")
            ? "trash"
            : l.fromList === "shopping" || l.toList === "shopping"
              ? "shopping"
              : l.action.includes("pantry")
                ? "package"
                : l.action.includes("grocery") || l.action === "bought"
                  ? "basket"
                  : "check",
          undo =
            index === 0 &&
            l.action !== "undid" &&
            s.undoPendingId !== l.id &&
            Array.isArray(l.beforeItems) &&
            Array.isArray(l.afterItems)
              ? `<button class="history-undo" data-undo-id="${e(l.id)}">Undo</button>`
              : "";
        return `<li><span class="history-icon">${I(icon)}</span><div class="history-copy"><strong>${e(actor)} ${e(actionText)}</strong><small>${e(new Date(l.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }))}${l.quantity ? ` · ${e(l.quantity)}` : ""}</small></div>${undo}</li>`;
      },
    )
    .join("");
  return `<div class="history-layer" id="historyLayer"><main class="history-screen"><header class="screen-head"><button id="back" aria-label="Back">${I("back")}</button><h1>History Log</h1></header><ol class="history-list">${h || '<li class="empty-state">Actions will appear here as you use Jamjar.</li>'}</ol></main></div>`;
}
async function undoFromHistory(button) {
  const log = s.logs.find((entry) => entry.id === button.dataset.undoId);
  if (!log) return;
  s.undoPendingId = log.id;
  button.disabled = true;
  button.textContent = "Undoing…";
  try {
    await undo(log);
    render();
  } catch (error) {
    console.error("Jamjar undo failed", error);
    s.undoPendingId = null;
    button.disabled = false;
    button.textContent = "Try again";
    toast(undoError(error));
  }
}
const listLabel = (list) =>
  ({ grocery: "Groceries", pantry: "Pantry", shopping: "Shopping" })[list] ||
  "Jamjar";
function row(x, i, n) {
  const colors = rowColors(x.list, i, n, normalizedCategory(x.category));
  const actions =
    x.list === "grocery" || x.list === "shopping"
      ? `<div class="swipe-underlay primary"><span class="under-icon">${I("check")}</span><span class="under-label">${x.completed ? "Restore" : "Bought"}</span></div><div class="swipe-underlay delete"><span>${I("trash")} Delete</span></div>`
      : "";
  const metadata =
    x.list === "pantry"
      ? normalizedCategory(x.category)
      : x.quantity || "";
  const pantryMove =
    x.list === "pantry"
      ? `<button type="button" class="pantry-to-groceries" data-move-to-groceries="${e(x.id)}" aria-label="Add ${e(x.description)} to Groceries">${I("basket")}</button>`
      : "";
  return `<li class="swipe-wrap${x.completed ? " is-done" : ""}${x.list === "pantry" ? " pantry-row" : ""}" data-id="${e(x.id)}">${actions}<button class="item-row" aria-label="Edit ${e(x.description)}" style="--band-top:${colors.top};--band-bottom:${colors.bottom}"><span class="item-copy"><span data-text="${e(x.description)}">${e(x.description)}</span>${metadata ? `<small>${e(metadata)}</small>` : ""}</span></button>${pantryMove}</li>`;
}
function pantryRows(items) {
  const totals = new Map();
  const positions = new Map();
  items.forEach((item) => {
    const category = normalizedCategory(item.category);
    totals.set(category, (totals.get(category) || 0) + 1);
  });
  return items
    .map((item) => {
      const category = normalizedCategory(item.category);
      const position = positions.get(category) || 0;
      positions.set(category, position + 1);
      return row(item, position, totals.get(category));
    })
    .join("");
}
const pantryEmptyText = () =>
  s.query
    ? "No pantry items match."
    : s.pantryCategory === "All"
      ? "Your pantry is empty."
      : "No items in this category.";
// Placeholder rows shown until the first sync arrives.
const skeleton = () =>
  Array.from(
    { length: 6 },
    (_, i) =>
      `<li class="skeleton-row" aria-hidden="true" style="--i:${i}"><span></span><span></span></li>`,
  ).join("");
function pantryPage(items, emptyText) {
  return `<div class="pantry-page"><ul class="item-list">${s.loaded ? `${pantryRows(items)}${items.length ? "" : `<li class="empty-state">${emptyText}</li>`}` : skeleton()}</ul></div>`;
}
let suggestionCache = { items: null, logs: null, html: "" };
// Rebuilt only when the data changes, not on every render of the editor.
function suggestions() {
  if (suggestionCache.items !== s.items || suggestionCache.logs !== s.logs) {
    const options = [
      ...new Set([
        ...s.items.map((i) => i.description),
        ...s.logs.map((l) => l.description),
      ]),
    ].sort();
    suggestionCache = {
      items: s.items,
      logs: s.logs,
      html: options.map((v) => `<option value="${e(v)}"></option>`).join(""),
    };
  }
  return suggestionCache.html;
}
function editor() {
  if (!s.editor) return "";
  const x = s.items.find((i) => i.id === s.editId),
    editorList = x?.list || s.tab,
    hasQuantity = editorList === "grocery" || editorList === "shopping";
  const descriptionPlaceholder = hasQuantity
    ? "What do you need?"
    : "What do you have?";
  const categorySelector = hasQuantity
    ? ""
    : `<div class="category-selector" role="group" aria-label="Category">${ITEM_CATEGORIES.map((category) => `<button type="button" class="category-choice${s.itemCategory === category ? " active" : ""}" style="--chip:${PANTRY_PALETTES[category][1]}" data-item-category="${e(category)}" aria-pressed="${s.itemCategory === category}">${e(category)}</button>`).join("")}</div>`;
  const actions = `<div class="dialog-actions"><button class="btn ghost" id="cancel">Cancel</button><button class="btn" id="save" ${s.saving ? "disabled" : ""}>${s.saving ? "Saving…" : "Save"}</button>${x ? `<button class="btn ghost delete-button" id="delAsk">${I("trash")}Delete</button>` : ""}</div>`;
  return `<div class="dialog-backdrop editor"><section class="dialog dialog-wrap" role="dialog" aria-modal="true"><div class="sheet-grabber" aria-hidden="true"></div><button class="close-x" id="x" aria-label="Close editor">×</button><h2>${x ? "Edit item" : `Add to ${listLabel(editorList)}`}</h2><div class="form-stack"><label>Description<input id="desc" maxlength="120" list="suggestions" value="${e(s.desc)}" placeholder="${descriptionPlaceholder}"></label><datalist id="suggestions">${suggestions()}</datalist>${categorySelector}${hasQuantity ? `<label>Quantity<input id="qty" maxlength="40" value="${e(s.qty)}" placeholder="2, 3 cans, 1 lb…"></label>` : ""}${s.error ? `<p class="form-error" role="alert">${e(s.error)}</p>` : ""}</div>${actions}</section></div>`;
}
function confirm() {
  if (s.clearList) {
    const n = listDone(s.clearList).length;
    return `<div class="dialog-backdrop confirm"><section class="dialog confirm-dialog"><h2>Clear completed items?</h2><p>This removes all ${n} completed ${n === 1 ? "item" : "items"} from ${e(listLabel(s.clearList))}. The action can be undone from History.</p><div class="dialog-actions"><button class="btn ghost" id="clearNo">Cancel</button><button class="btn" id="clearYes">Clear completed</button></div></section></div>`;
  }
  if (s.del) {
    const x = s.items.find((i) => i.id === s.editId);
    return `<div class="dialog-backdrop confirm"><section class="dialog confirm-dialog"><h2>Delete “${e(x?.description || "")}”?</h2><p>This removes it from Jamjar. The action will remain in History.</p><div class="dialog-actions"><button class="btn ghost" id="delNo">Cancel</button><button class="btn destructive" id="delYes">Delete</button></div></section></div>`;
  }
  return "";
}
const activeCount = (list) =>
  s.items.reduce(
    (count, x) => count + (x.list === list && !x.completed ? 1 : 0),
    0,
  );
// Only the visible tab is built; the others are rebuilt when switched to.
function app() {
  const groceries = activeCount("grocery"),
    shopping = activeCount("shopping"),
    u = s.actor || {},
    initial = (u.displayName?.[0] || u.email?.[0] || "?").toUpperCase();
  const categoryTabs = () =>
    PANTRY_CATEGORIES.map(
      (category) =>
        `<button type="button" class="pantry-category-tab${s.pantryCategory === category ? " active" : ""}" data-pantry-category="${e(category)}" aria-pressed="${s.pantryCategory === category}">${e(category)}</button>`,
    ).join("");
  const listMarkup = (list, emptyText) => {
    const activeItems = listActive(list),
      completedItems = listDone(list);
    if (!s.loaded)
      return `<section id="${list}-section"><div class="list-content"><ul class="item-list">${skeleton()}</ul></div></section>`;
    return `<section id="${list}-section"><div class="list-content"><ul class="item-list">${activeItems.map((x, i) => row(x, i, activeItems.length)).join("")}${activeItems.length ? "" : `<li class="empty-state">${emptyText}</li>`}${completedItems.map((x, i) => row(x, i, completedItems.length)).join("")}</ul>${completedItems.length ? `<div class="clear-pull" id="clearPull" aria-hidden="true"><span class="pull-ring"><svg class="ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16"/></svg>${I("trash")}</span><span class="pull-label">Pull up to clear completed</span></div>` : ""}</div></section>`;
  };
  const sections = {
    grocery: () => listMarkup("grocery", "Your grocery list is empty."),
    pantry: () =>
      `<section id="pantry-section"><div class="list-content"><div class="pantry-controls"><div class="search-field">${I("search")}<label class="sr-only" for="search">Search Pantry</label><input id="search" value="${e(s.query)}" placeholder="Search"><button type="button" class="search-clear" id="clearSearch" aria-label="Clear search" ${s.query ? "" : "hidden"}>${I("x")}</button></div><nav class="pantry-categories" aria-label="Pantry categories">${categoryTabs()}<span class="category-indicator" data-live-style aria-hidden="true"></span></nav></div><div class="pantry-page-surface">${pantryPage(pantry(), pantryEmptyText())}</div></div></section>`,
    shopping: () => listMarkup("shopping", "Your shopping list is empty."),
    settings: () =>
      `<section><div class="settings-page"><button class="settings-row" id="hist"><span class="setting-icon">${I("history")}</span><span><strong>History Log</strong><small>See every change and who made it</small></span><span>›</span></button><div class="settings-row static"><span class="avatar">${e(initial)}</span><span><strong>${e(u.displayName || u.email || "")}</strong><small>${e(u.email || "")}</small></span></div>${s.install ? `<button class="settings-row" id="install"><span class="setting-icon">${I("package")}</span><span><strong>Install Jamjar</strong><small>Add it to this device</small></span><span>›</span></button>` : ""}<button class="settings-row danger-row" id="signout"><span class="setting-icon">${I("logout")}</span><span><strong>Sign out</strong><small>Keep shared data in Jamjar</small></span></button></div></section>`,
  };
  patch(`<div class="app-shell tab-${s.tab}${s.oneHanded ? " one-handed" : ""}" ${s.history ? "inert" : ""}>
    <header class="topbar"><div class="brand">${appIcon("brand-icon", "./icon-96.png")}<span>Jamjar</span></div><span class="sync-status">${e(s.status)}</span></header>
    <main class="list-main">
      ${sections[s.tab]()}
    </main>
    ${s.tab !== "settings" ? `<button class="fab" id="add">${I("plus")}</button>` : ""}
    <nav class="bottom-tabs">
      <button class="tab-trigger ${s.tab === "grocery" ? "active" : ""}" data-tab="grocery">${I("basket")}<span>Groceries</span>${groceries ? `<b>${groceries}</b>` : ""}</button>
      <button class="tab-trigger ${s.tab === "pantry" ? "active" : ""}" data-tab="pantry">${I("package")}<span>Pantry</span></button>
      <button class="tab-trigger ${s.tab === "shopping" ? "active" : ""}" data-tab="shopping">${I("shopping")}<span>Shopping</span>${shopping ? `<b>${shopping}</b>` : ""}</button>
      <button class="tab-trigger ${s.tab === "settings" ? "active" : ""}" data-tab="settings">${I("settings")}<span>Settings</span></button>
    </nav>
  </div>${editor()}${confirm()}${s.history ? historyMarkup() : ""}`);
  swipes();
  pantryCategorySwipes();
  pullToClear();
}
// Rows are only animated in and out when the same list is still showing.
// renderedContext is the list on screen, since state has already changed by
// the time the next render captures the layout.
let renderedContext = "";
const layoutContext = () =>
  `${s.tab}|${s.tab === "pantry" ? `${s.pantryCategory}|${s.query}` : ""}|${s.history}`;
function captureLayout() {
  const positions = new Map(),
    states = new Map(),
    rows = new Map();
  visibleRows().forEach((row) => {
    const rect = row.getBoundingClientRect();
    positions.set(row.dataset.id, rect.top);
    states.set(row.dataset.id, row.classList.contains("is-done"));
    rows.set(row.dataset.id, { row, rect });
  });
  return { positions, states, rows, context: renderedContext };
}
function visibleRows() {
  return [...document.querySelectorAll(".swipe-wrap[data-id]")].filter(
    (row) =>
      !row.closest(".pantry-page-adjacent"),
  );
}
// A removed row leaves a copy behind that collapses while the rows below
// slide up into its place.
function collapseGhost({ row, rect }) {
  if (rect.bottom < 0 || rect.top > innerHeight) return;
  const ghost = row.cloneNode(true);
  ghost.classList.add("row-ghost");
  ghost.removeAttribute("data-id");
  Object.assign(ghost.style, {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
  document.body.append(ghost);
  ghost
    .animate(
      [
        { height: `${rect.height}px`, opacity: 1 },
        { height: "0px", opacity: 0 },
      ],
      { duration: 300, easing: SPRING, fill: "forwards" },
    )
    .finished.then(
      () => ghost.remove(),
      () => ghost.remove(),
    );
}
function animateLayout(previous) {
  if (!previous.positions.size || reducedMotion()) return;
  const sameList = previous.context === layoutContext();
  // Read every position before starting any animation so layout runs once.
  const rows = visibleRows().map((row) => [
    row,
    row.getBoundingClientRect().top,
  ]);
  if (sameList) {
    const present = new Set(rows.map(([row]) => row.dataset.id));
    previous.rows.forEach((entry, id) => {
      if (!present.has(id)) collapseGhost(entry);
    });
  }
  rows.forEach(([row, newTop]) => {
    const id = row.dataset.id,
      wasDone = previous.states.get(id),
      isDone = row.classList.contains("is-done"),
      label = row.querySelector(".item-copy > span");
    if (wasDone === false && isDone) label?.classList.add("strike-entering");
    else if (wasDone === true && !isDone) label?.classList.add("strike-leaving");
    if (
      label?.classList.contains("strike-entering") ||
      label?.classList.contains("strike-leaving")
    )
      setTimeout(
        () => label.classList.remove("strike-entering", "strike-leaving"),
        500,
      );
    if (!row.animate) return;
    const oldTop = previous.positions.get(id);
    if (oldTop === undefined && sameList)
      return void row.animate(
        [
          { opacity: 0, transform: "scale(0.96)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 360, easing: SPRING },
      );
    if (oldTop !== undefined && Math.abs(oldTop - newTop) > 0.5)
      row.animate(
        [
          { transform: `translateY(${oldTop - newTop}px)` },
          { transform: "translateY(0)" },
        ],
        { duration: 380, easing: SPRING },
      );
  });
}
function revealPendingItem() {
  if (!s.revealId) return;
  const row = visibleRows().find(
    (item) => item.dataset.id === s.revealId,
  );
  if (!row) return;
  s.revealId = null;
  requestAnimationFrame(() =>
    row.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "end",
    }),
  );
}
function syncVisualViewport() {
  const viewport = window.visualViewport,
    height = viewport?.height || innerHeight,
    top = viewport?.offsetTop || 0;
  document.documentElement.style.setProperty(
    "--visual-viewport-height",
    `${Math.round(height)}px`,
  );
  document.documentElement.style.setProperty(
    "--visual-viewport-top",
    `${Math.round(top)}px`,
  );
}
function scrollTabTop() {
  requestAnimationFrame(() =>
    scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    }),
  );
}
// Rows and pages are kept between renders, so gesture listeners are swapped
// out each render instead of piling up.
let pantrySwipeListeners = null,
  pullListeners = null;
function pantryCategorySwipes() {
  pantrySwipeListeners?.abort();
  pantrySwipeListeners = null;
  const surface = document.querySelector(".pantry-page-surface"),
    currentPage = surface?.querySelector(".pantry-page:not(.pantry-page-adjacent)");
  if (!surface || !currentPage || s.tab !== "pantry") return;
  pantrySwipeListeners = new AbortController();
  const { signal } = pantrySwipeListeners;
  let startX = 0,
    startY = 0,
    startTime = 0,
    lastX = 0,
    pendingX = 0,
    dragFrame = 0,
    pointerId = null,
    horizontal = false,
    vertical = false,
    adjacentPage = null,
    direction = 0,
    suppressClickUntil = 0;
  const adjacentPages = new Map();
  const categoryIndex = () => PANTRY_CATEGORIES.indexOf(s.pantryCategory);
  const makeAdjacentPage = (nextDirection) => {
    const nextIndex = categoryIndex() + nextDirection;
    if (nextIndex < 0 || nextIndex >= PANTRY_CATEGORIES.length) return null;
    if (adjacentPages.has(nextDirection))
      return adjacentPages.get(nextDirection);
    const category = PANTRY_CATEGORIES[nextIndex],
      items = pantryItems(category, ""),
      holder = document.createElement("div");
    holder.className = "pantry-page pantry-page-adjacent";
    holder.setAttribute("aria-hidden", "true");
    holder.dataset.transient = "";
    holder.innerHTML = `<ul class="item-list">${pantryRows(items)}${items.length ? "" : `<li class="empty-state">${category === "All" ? "Your pantry is empty." : "No items in this category."}</li>`}</ul>`;
    holder.style.transform = `translate3d(${nextDirection * 100}%,0,0)`;
    surface.append(holder);
    adjacentPages.set(nextDirection, holder);
    return holder;
  };
  const paintDrag = (value) => {
    dragFrame = 0;
    const nextDirection = value < 0 ? 1 : -1,
      nextPage = makeAdjacentPage(nextDirection),
      displayedX = nextPage ? value : value * 0.2,
      width = surface.clientWidth || innerWidth;
    direction = nextDirection;
    adjacentPage = nextPage;
    lastX = displayedX;
    adjacentPages.forEach((page, pageDirection) => {
      const active = page === nextPage;
      page.classList.toggle("active-adjacent", active);
      page.style.transform = active
        ? `translate3d(${displayedX + nextDirection * width}px,0,0)`
        : `translate3d(${pageDirection * 100}%,0,0)`;
    });
    currentPage.style.transform = `translate3d(${displayedX}px,0,0)`;
    indicatorTracking(true);
    positionIndicator(
      nextPage ? PANTRY_CATEGORIES[categoryIndex() + nextDirection] : null,
      Math.min(Math.abs(displayedX) / width, 1),
    );
  };
  const flushDragFrame = () => {
    if (!dragFrame) return;
    cancelAnimationFrame(dragFrame);
    paintDrag(pendingX);
  };
  const indicatorTracking = (on) =>
    surface.parentElement
      .querySelector(".category-indicator")
      ?.classList.toggle("tracking", on);
  const clearDrag = () => {
    if (dragFrame) cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    indicatorTracking(false);
    positionIndicator();
    currentPage.style.transform = "";
    currentPage.classList.remove("dragging-page");
    adjacentPages.forEach((page, pageDirection) => {
      page.classList.remove("active-adjacent");
      page.style.transform = `translate3d(${pageDirection * 100}%,0,0)`;
    });
    adjacentPage = null;
    direction = 0;
    horizontal = false;
    vertical = false;
    pointerId = null;
  };
  const finish = (event) => {
    if (event.pointerId !== pointerId) return;
    if (surface.hasPointerCapture?.(pointerId))
      surface.releasePointerCapture(pointerId);
    if (!horizontal) return clearDrag();
    flushDragFrame();
    const width = surface.clientWidth || innerWidth,
      elapsed = Math.max(performance.now() - startTime, 1),
      velocity = Math.abs(lastX) / elapsed,
      commit =
        Boolean(adjacentPage) &&
        (Math.abs(lastX) >= width * 0.22 || velocity >= 0.55),
      reduced = matchMedia("(prefers-reduced-motion: reduce)").matches,
      currentTarget = commit ? -direction * width : 0,
      adjacentTarget = commit ? 0 : direction * width,
      duration = reduced ? 0 : commit ? 280 : 260,
      // A short-tailed ease-out: slower tails left a sliver of the old page.
      options = {
        duration,
        easing: "cubic-bezier(0.33, 1, 0.68, 1)",
        fill: "forwards",
      },
      animations = [
        currentPage.animate(
          [
            { transform: currentPage.style.transform || "translate3d(0,0,0)" },
            { transform: `translate3d(${currentTarget}px,0,0)` },
          ],
          options,
        ),
      ];
    // The underline finishes its move alongside the pages.
    indicatorTracking(false);
    positionIndicator(
      commit ? PANTRY_CATEGORIES[categoryIndex() + direction] : null,
      commit ? 1 : 0,
    );
    if (commit) haptic(8);
    if (adjacentPage)
      animations.push(
        adjacentPage.animate(
          [
            { transform: adjacentPage.style.transform },
            { transform: `translate3d(${adjacentTarget}px,0,0)` },
          ],
          options,
        ),
      );
    Promise.allSettled(animations.map((animation) => animation.finished)).then(
      () => {
        // The page element is reused by the next render, so drop the
        // animation's fill instead of leaving it translated.
        animations.forEach((animation) => animation.cancel());
        if (!commit) return clearDrag();
        s.pantryCategory = PANTRY_CATEGORIES[categoryIndex() + direction];
        s.query = "";
        render();
        requestAnimationFrame(() => {
          const activeTab = [...document.querySelectorAll(".pantry-category-tab")].find(
            (tab) => tab.dataset.pantryCategory === s.pantryCategory,
          );
          activeTab?.scrollIntoView({
            behavior: reduced ? "auto" : "smooth",
            block: "nearest",
            inline: "center",
          });
        });
      },
    );
  };
  surface.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0))
      return;
    prepareAdjacentPages();
    startX = event.clientX;
    startY = event.clientY;
    lastX = 0;
    pendingX = 0;
    startTime = performance.now();
    pointerId = event.pointerId;
    horizontal = false;
    vertical = false;
  }, { signal });
  surface.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId || vertical) return;
    const dx = event.clientX - startX,
      dy = event.clientY - startY;
    if (!horizontal && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
      vertical = true;
      return;
    }
    if (!horizontal && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      horizontal = true;
      suppressClickUntil = performance.now() + 500;
      surface.setPointerCapture?.(pointerId);
      currentPage.classList.add("dragging-page");
    }
    if (!horizontal) return;
    event.preventDefault();
    pendingX = dx;
    if (!dragFrame) dragFrame = requestAnimationFrame(() => paintDrag(pendingX));
  }, { signal });
  surface.addEventListener("pointerup", finish, { signal });
  surface.addEventListener("pointercancel", finish, { signal });
  surface.addEventListener(
    "click",
    (event) => {
      if (performance.now() >= suppressClickUntil) return;
      event.preventDefault();
      event.stopPropagation();
    },
    { capture: true, signal },
  );
  // Built on first touch rather than on every render.
  function prepareAdjacentPages() {
    if (!surface.isConnected || s.tab !== "pantry") return;
    makeAdjacentPage(-1);
    makeAdjacentPage(1);
  }
}
function sameItems(a, b) {
  if (a.length !== b.length) return false;
  const previous = new Map(a.map((item) => [item.id, item]));
  return b.every((item) => {
    const old = previous.get(item.id);
    return (
      old &&
      old.description === item.description &&
      old.quantity === item.quantity &&
      old.list === item.list &&
      Boolean(old.completed) === Boolean(item.completed) &&
      old.category === item.category
    );
  });
}
function sameLogs(a, b) {
  if (a.length !== b.length) return false;
  const previous = new Map(a.map((log) => [log.id, log]));
  return b.every((log) => {
    const old = previous.get(log.id);
    return (
      old &&
      old.action === log.action &&
      old.description === log.description &&
      old.createdAt === log.createdAt &&
      old.targetHistoryId === log.targetHistoryId
    );
  });
}
function scheduleRender() {
  if (renderFrame) return;
  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0;
    render();
  });
}
// Updates the page to match new markup, keeping the elements that didn't
// change (and their focus, scroll, and listeners). Rows are matched by
// data-id so a reordered list moves rows instead of rebuilding them.
function patch(html) {
  const next = document.createElement("template");
  next.innerHTML = html;
  patchChildren(root, next.content);
}
function patchChildren(from, to) {
  // Swipe pages aren't part of the markup; ripples are left to finish.
  const kept = (node) => node?.nodeType === 1 && node.dataset.transient === "keep";
  [...from.children].forEach(
    (child) =>
      child.hasAttribute("data-transient") && !kept(child) && child.remove(),
  );
  const keyed = new Map();
  for (const child of from.children)
    if (child.dataset.id) keyed.set(child.dataset.id, child);
  let cursor = from.firstChild;
  for (const node of [...to.childNodes]) {
    while (kept(cursor)) cursor = cursor.nextSibling;
    const key = node.nodeType === 1 ? node.dataset.id : undefined;
    let match = null;
    if (key) match = keyed.get(key) || null;
    else if (
      cursor &&
      cursor.nodeName === node.nodeName &&
      !(cursor.nodeType === 1 && cursor.dataset.id)
    )
      match = cursor;
    if (!match) {
      from.insertBefore(node, cursor);
      continue;
    }
    keyed.delete(key);
    if (match === cursor) cursor = cursor.nextSibling;
    else from.insertBefore(match, cursor);
    patchNode(match, node);
  }
  while (cursor) {
    const nextSibling = cursor.nextSibling;
    if (!kept(cursor)) cursor.remove();
    cursor = nextSibling;
  }
}
function patchNode(from, to) {
  if (from.nodeType !== 1) {
    if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue;
    return;
  }
  // Rows mid swipe-out are swapped for fresh ones rather than sliding back.
  if (
    from.nodeName !== to.nodeName ||
    from.id !== to.id ||
    from.classList.contains("completing") ||
    from.classList.contains("moving-left")
  )
    return from.replaceWith(to);
  if (
    from.nodeName === "INPUT" &&
    from !== document.activeElement &&
    from.value !== (to.getAttribute("value") ?? "")
  )
    from.value = to.getAttribute("value") ?? "";
  if (from.isEqualNode(to)) return;
  // data-live-style elements are positioned from script, so keep their style.
  const live = from.hasAttribute("data-live-style");
  for (const { name } of [...from.attributes])
    if (!to.hasAttribute(name) && !(live && name === "style"))
      from.removeAttribute(name);
  for (const { name, value } of to.attributes)
    if (from.getAttribute(name) !== value) from.setAttribute(name, value);
  patchChildren(from, to);
}
function render({ animate = true } = {}) {
  if (renderFrame) {
    cancelAnimationFrame(renderFrame);
    renderFrame = 0;
  }
  const previous = animate ? captureLayout() : { positions: new Map() };
  // Someone who was signed in last time sees the lists loading, not sign-in.
  if (!PREVIEW && (s.authKnown ? !s.actor : !wasSignedIn)) return gate();
  app();
  renderedContext = layoutContext();
  animateLayout(previous);
  revealPendingItem();
  positionIndicator();
  updateChrome();
}
// Screen changes run inside a view transition where the browser has one;
// CSS picks the animation from data-vt and --vt-dir.
function transition(type, direction, update) {
  if (!document.startViewTransition || reducedMotion()) return update();
  const html = document.documentElement,
    top = () => document.querySelector(".list-main")?.getBoundingClientRect().top ?? 0,
    before = top();
  html.dataset.vt = type;
  html.style.setProperty("--vt-dir", String(direction));
  const clear = () => delete html.dataset.vt;
  document
    .startViewTransition(() => {
      update();
      // The update may scroll to the top; keep the outgoing list where it was.
      html.style.setProperty("--vt-old-y", `${before - top()}px`);
    })
    .finished.then(clear, clear);
}
// The pantry category underline, optionally part-way to a neighbour while a
// page is being dragged.
function positionIndicator(to = null, progress = 0) {
  const nav = document.querySelector(".pantry-categories"),
    bar = nav?.querySelector(".category-indicator");
  if (!bar) return;
  const tab = (category) =>
      nav.querySelector(`[data-pantry-category="${CSS.escape(category)}"]`),
    a = tab(s.pantryCategory),
    b = (to && tab(to)) || a;
  if (!a) return;
  const x = a.offsetLeft + (b.offsetLeft - a.offsetLeft) * progress,
    width = a.offsetWidth + (b.offsetWidth - a.offsetWidth) * progress,
    placed = Boolean(bar.style.width);
  if (!placed) bar.style.transition = "none";
  bar.style.transform = `translateX(${x}px)`;
  bar.style.width = `${width}px`;
  if (!placed) {
    bar.offsetWidth;
    bar.style.transition = "";
  }
}
// Status bar tint follows the row under it; the iOS status bar scrim shows
// once the page has scrolled.
const themeColor = document.querySelector('meta[name="theme-color"]');
let chromeFrame = 0;
function updateChrome() {
  chromeFrame = 0;
  const top = document.elementFromPoint(innerWidth / 2, 1),
    band = top?.closest?.(".item-row")?.style.getPropertyValue("--band-top"),
    color = band || "#17242d";
  if (themeColor && themeColor.content !== color) themeColor.content = color;
  document.documentElement.classList.toggle("scrolled", scrollY > 2);
}
addEventListener(
  "scroll",
  () => {
    if (!chromeFrame) chromeFrame = requestAnimationFrame(updateChrome);
  },
  { passive: true },
);
// Editor and confirmations: sheets on phones (the editor always, confirms on
// iOS), scale-and-fade dialogs elsewhere. Entry is CSS; exit is played here
// before the state that removes them is cleared.
const isSheet = (backdrop) =>
  phone() && (backdrop.classList.contains("editor") || platform === "ios");
function dismissDialogs(selector = ".dialog-backdrop") {
  const backdrops = [...document.querySelectorAll(selector)];
  if (!backdrops.length || reducedMotion()) {
    sheetBackground(false, 0);
    return Promise.resolve();
  }
  return Promise.all(
    backdrops.map((backdrop) => {
      backdrop.style.pointerEvents = "none";
      const dialog = backdrop.querySelector(".dialog"),
        sheet = isSheet(backdrop),
        from = getComputedStyle(dialog).transform,
        animations = [
          backdrop.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 240,
            easing: "ease",
            fill: "forwards",
          }),
          dialog.animate(
            sheet
              ? [
                  { transform: from === "none" ? "translateY(0)" : from },
                  { transform: "translateY(100%)" },
                ]
              : [
                  { opacity: 1, transform: "none" },
                  { opacity: 0, transform: "scale(0.96)" },
                ],
            { duration: sheet ? 260 : 150, easing: EASE_IN, fill: "forwards" },
          ),
        ];
      if (backdrop.classList.contains("editor"))
        animations.push(...sheetBackground(false));
      return Promise.all(animations.map((a) => a.finished)).catch(() => {});
    }),
  );
}
// iOS sheets push the page behind them back and round its corners.
let sheetBackgroundAnimation = null;
function sheetBackground(opening, duration = opening ? 460 : 260) {
  const main = document.querySelector(".list-main");
  if (!main || platform !== "ios" || !phone()) return [];
  if (!opening && !sheetBackgroundAnimation) return [];
  const top = -main.getBoundingClientRect().top,
    bottom = main.offsetHeight - top - innerHeight,
    frame = (scale, radius) => ({
      transform: `scale(${scale})`,
      clipPath: `inset(${top}px 0 ${bottom}px 0 round ${radius}px)`,
    });
  main.style.transformOrigin = `50% ${top + innerHeight / 2}px`;
  const animation = main.animate(
    opening
      ? [frame(1, 0), frame(0.93, 14)]
      : [frame(0.93, 14), frame(1, 0)],
    {
      duration: reducedMotion() ? 0 : duration,
      easing: opening ? SPRING : EASE_IN,
      fill: "forwards",
    },
  );
  if (opening) {
    sheetBackgroundAnimation?.cancel();
    sheetBackgroundAnimation = animation;
  } else {
    const previous = sheetBackgroundAnimation;
    sheetBackgroundAnimation = null;
    previous?.cancel();
    const done = () => {
      animation.cancel();
      main.style.transformOrigin = "";
    };
    animation.finished.then(done, done);
  }
  return [animation];
}
function open(x = null) {
  s.editId = x?.id || null;
  s.desc = x?.description || "";
  s.qty = x?.list === "pantry" ? "" : x?.quantity || "";
  s.itemCategory = x
    ? normalizedCategory(x.category)
    : s.tab === "pantry" && s.pantryCategory !== "All"
      ? s.pantryCategory
      : "Other";
  s.error = "";
  s.editor = true;
  window.history.pushState({ editor: true }, "");
  render();
  sheetBackground(true);
  setTimeout(() => document.getElementById("desc")?.focus(), 0);
}
let closing = false;
async function close(fromPop = false) {
  if (!s.editor || closing) return;
  closing = true;
  if (!fromPop && window.history.state?.editor) window.history.back();
  await dismissDialogs();
  closing = false;
  s.editor = false;
  s.del = false;
  s.editId = null;
  s.error = "";
  s.saving = false;
  render();
}
// Dragging the top of the editor sheet down dismisses it.
function dragSheet(event) {
  const dialog = event.target.closest(".editor .dialog");
  if (!dialog || !phone() || event.button !== 0) return;
  if (event.clientY - dialog.getBoundingClientRect().top > 72) return;
  if (event.target.closest("button, input")) return;
  const backdrop = dialog.parentElement,
    startY = event.clientY,
    tracker = velocityTracker();
  let offset = 0;
  const move = (q) => {
      const dy = q.clientY - startY;
      offset = dy > 0 ? dy : dy * 0.2;
      tracker.add(0, dy);
      dialog.style.transform = `translateY(${offset}px)`;
      backdrop.style.backgroundColor = `rgba(6, 16, 22, ${0.72 * (1 - Math.min(Math.max(offset, 0) / dialog.offsetHeight, 1))})`;
    },
    up = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
      removeEventListener("pointercancel", up);
      if (offset > 110 || tracker.velocity().y > FLICK_SPEED) return void close();
      backdrop.style.backgroundColor = "";
      const from = dialog.style.transform || "translateY(0)";
      dialog.style.transform = "";
      dialog.animate([{ transform: from }, { transform: "translateY(0)" }], {
        duration: 380,
        easing: SPRING,
      });
    };
  addEventListener("pointermove", move);
  addEventListener("pointerup", up);
  addEventListener("pointercancel", up);
}
// History slides over Settings: an iOS push with the page behind shifting
// and dimming, or Material's shared-axis slide and fade elsewhere.
let historyAnimations = [],
  historyClosing = false,
  historyDraggedOut = false;
function historyFrames(p) {
  if (platform === "ios")
    return [
      { transform: `translateX(${(1 - p) * 100}%)` },
      {
        transform: `translateX(${-25 * p}%)`,
        filter: `brightness(${1 - 0.35 * p})`,
      },
    ];
  return [
    { opacity: p, transform: `translateX(${(1 - p) * 30}px)` },
    { opacity: 1 - p, transform: `translateX(${-30 * p}px)` },
  ];
}
function animateHistory(from, to, duration = 440, easing = SPRING) {
  const layer = document.getElementById("historyLayer"),
    shell = document.querySelector(".app-shell");
  if (!layer || !shell) return Promise.resolve();
  const [layerFrom, shellFrom] = historyFrames(from),
    [layerTo, shellTo] = historyFrames(to),
    options = { duration: reducedMotion() ? 0 : duration, easing, fill: "forwards" },
    next = [
      layer.animate([layerFrom, layerTo], options),
      shell.animate([shellFrom, shellTo], options),
    ];
  historyAnimations.forEach((animation) => animation.cancel());
  historyAnimations = next;
  return Promise.all(next.map((animation) => animation.finished)).catch(
    () => {},
  );
}
function openHistory() {
  s.history = true;
  window.history.pushState({ history: true }, "");
  render();
  animateHistory(0, 1);
}
async function closeHistory() {
  if (historyClosing) return;
  historyClosing = true;
  if (!historyDraggedOut) await animateHistory(1, 0, 340);
  historyDraggedOut = false;
  s.history = false;
  render();
  historyAnimations.forEach((animation) => animation.cancel());
  historyAnimations = [];
  historyClosing = false;
}
// iOS home-screen apps have no system back swipe, so History gets its own
// from the left edge.
function edgeSwipeBack(event) {
  if (!s.history || platform !== "ios" || event.clientX > 28) return;
  const layer = document.getElementById("historyLayer");
  if (!layer?.contains(event.target)) return;
  const startX = event.clientX,
    tracker = velocityTracker();
  let progress = 1;
  const move = (q) => {
      const dx = Math.max(q.clientX - startX, 0);
      tracker.add(dx);
      progress = 1 - Math.min(dx / innerWidth, 1);
      animateHistory(progress, progress, 0);
    },
    up = async () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
      removeEventListener("pointercancel", up);
      if (progress < 0.65 || tracker.velocity().x > 0.5) {
        await animateHistory(progress, 0, 300);
        historyDraggedOut = true;
        window.history.back();
      } else animateHistory(progress, 1, 300);
    };
  addEventListener("pointermove", move);
  addEventListener("pointerup", up);
  addEventListener("pointercancel", up);
}
async function save() {
  if (s.saving) return;
  const desc = s.desc.trim(),
    x = s.items.find((i) => i.id === s.editId),
    list = x?.list || s.tab,
    qty = list === "pantry" ? "" : s.qty.trim(),
    category = normalizedCategory(s.itemCategory);
  if (!desc) {
    s.error = "Add a description.";
    return render();
  }
  if (
    s.items.some(
      (i) =>
        i.list === list &&
        i.id !== x?.id &&
        i.description.trim().toLowerCase() === desc.toLowerCase(),
    )
  ) {
    s.error = `${desc} is already in ${listLabel(list)}.`;
    return render();
  }
  s.saving = true;
  const saveButton = document.getElementById("save");
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "Saving…";
  }
  try {
    if (x) {
      const changes = { description: desc, quantity: qty };
      if (list === "pantry") changes.category = category;
      if (PREVIEW) local("updated", x, changes);
      else await api?.updateItem(x.id, changes);
    } else {
      const n = {
        id: crypto.randomUUID(),
        description: desc,
        quantity: qty,
        list,
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        listAddedAt: Date.now(),
        ...(list === "pantry" ? { category } : {}),
      };
      s.revealId = n.id;
      if (PREVIEW) local("added", n);
      else
        await api?.addItem({
          id: n.id,
          description: desc,
          quantity: qty,
          list,
          ...(list === "pantry" ? { category } : {}),
        });
    }
    close();
  } catch (error) {
    console.error("Jamjar save failed", error);
    s.saving = false;
    s.error =
      error?.code === "permission-denied"
        ? "Jamjar’s Firestore rules need to be published."
        : "Jamjar couldn’t save that change. Try again.";
    render();
  }
}
const quoted = (x) => `“${x.description}”`;
async function toggle(x) {
  const message = `${x.completed ? "Restored" : "Bought"} ${quoted(x)}`;
  if (PREVIEW) {
    const log = local(x.completed ? "restored" : "bought", x, {
      completed: !x.completed,
      ...(x.completed ? { listAddedAt: Date.now() } : {}),
    });
    render();
    toast(message, log);
    return;
  }
  const next = {
    ...x,
    completed: !x.completed,
    updatedAt: Date.now(),
    ...(x.completed ? { listAddedAt: Date.now() } : {}),
  };
  s.items = s.items.map((item) => (item.id === x.id ? next : item));
  render();
  try {
    toast(message, await api?.toggleBought(x));
  } catch (error) {
    console.error("Jamjar bought update failed", error);
    s.items = s.items.map((item) => (item.id === x.id ? x : item));
    render();
    toast("Couldn’t update that item. Try again.");
  }
}
async function move(x, to) {
  if (
    s.items.some(
      (i) =>
        i.list === to &&
        i.description.trim().toLowerCase() ===
          x.description.trim().toLowerCase(),
    )
  ) {
    render();
    toast(`${x.description} is already in ${listLabel(to)}.`);
    return false;
  }
  const message = `Moved ${quoted(x)} to ${listLabel(to)}`;
  if (PREVIEW) {
    const log = local(to === "pantry" ? "moved_to_pantry" : "moved_to_grocery", x, {
      list: to,
      completed: false,
      quantity: "",
      category: x.category || (to === "pantry" ? "Other" : ""),
      listAddedAt: Date.now(),
    });
    render();
    toast(message, log);
    return true;
  }
  const next = {
    ...x,
    list: to,
    completed: false,
    quantity: "",
    category: x.category || (to === "pantry" ? "Other" : ""),
    listAddedAt: Date.now(),
    updatedAt: Date.now(),
  };
  s.items = s.items.map((item) => (item.id === x.id ? next : item));
  render();
  try {
    toast(message, await api?.moveItem(x, to));
    return true;
  } catch (error) {
    console.error("Jamjar move failed", error);
    s.items = s.items.map((item) => (item.id === x.id ? x : item));
    render();
    toast("Couldn’t move that item. Try again.");
    return false;
  }
}
// Swipe-deletes skip the confirmation; the toast offers Undo instead.
async function remove(x = s.items.find((i) => i.id === s.editId)) {
  if (!x) return;
  if (s.editor || s.del) {
    closing = true;
    if (window.history.state?.editor) window.history.back();
    await dismissDialogs();
    closing = false;
  }
  let log = null,
    failed = false;
  try {
    if (PREVIEW) log = local("deleted", x);
    else {
      s.items = s.items.filter((item) => item.id !== x.id);
      log = await api?.deleteItem(x);
    }
  } catch (error) {
    console.error("Jamjar delete failed", error);
    s.items = [...s.items, x];
    failed = true;
  }
  s.del = false;
  s.editor = false;
  s.editId = null;
  s.saving = false;
  render();
  if (failed) toast("Couldn’t delete that item. Try again.");
  else toast(`Deleted ${quoted(x)}`, log);
}
async function clearAll() {
  const source = s.clearList,
    items = listDone(source),
    label = `${items.length} completed ${items.length === 1 ? "item" : "items"}`;
  await dismissDialogs(".dialog-backdrop.confirm");
  let log = null,
    failed = false;
  try {
    if (PREVIEW) {
      s.items = s.items.filter(
        (item) => !items.some((done) => done.id === item.id),
      );
      log = addLocalLog(
        "cleared_completed",
        { description: label, quantity: "", list: source },
        items,
        [],
      );
    } else log = await api?.clearCompleted(items, source);
  } catch (error) {
    console.error("Jamjar clear failed", error);
    failed = true;
  }
  s.clearList = "";
  render();
  if (failed) toast("Couldn’t clear completed items. Try again.");
  else toast(`Cleared ${label}`, log);
}
const toastHost = document.createElement("div");
toastHost.className = "toast-host";
toastHost.setAttribute("role", "status");
toastHost.setAttribute("aria-live", "polite");
document.body.append(toastHost);
let toastTimer = 0;
// On Android the + button rises above the full-width snackbar.
function toastSpace(el) {
  const html = document.documentElement;
  html.classList.toggle("toast-shown", Boolean(el));
  if (el) html.style.setProperty("--toast-space", `${el.offsetHeight + 12}px`);
}
function hideToast({ animate = true, to = "translateY(24px)" } = {}) {
  clearTimeout(toastTimer);
  toastTimer = 0;
  const el = toastHost.firstElementChild;
  toastSpace(null);
  if (!el) return;
  if (!animate || reducedMotion()) return toastHost.replaceChildren();
  el.style.pointerEvents = "none";
  const from = getComputedStyle(el).transform;
  el.animate(
    [
      { opacity: 1, transform: from === "none" ? "none" : from },
      { opacity: 0, transform: to },
    ],
    { duration: 200, easing: EASE_IN, fill: "forwards" },
  ).finished.then(
    () => el.isConnected && el.remove(),
    () => {},
  );
}
// Toasts can be swiped away sideways.
function swipeToast(el, restart) {
  el.addEventListener("pointerdown", (down) => {
    if (down.target.closest("button") || down.button !== 0) return;
    const tracker = velocityTracker();
    let dx = 0;
    clearTimeout(toastTimer);
    el.setPointerCapture(down.pointerId);
    const move = (q) => {
        dx = q.clientX - down.clientX;
        tracker.add(dx);
        el.style.transform = `translateX(${dx}px)`;
        el.style.opacity = String(1 - Math.min(Math.abs(dx) / 240, 0.6));
      },
      up = () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
        const speed = tracker.velocity().x;
        if (Math.abs(dx) > 80 || Math.abs(speed) > 0.5)
          return hideToast({
            to: `translateX(${Math.sign(dx || speed) * 120}%)`,
          });
        const from = el.style.transform;
        el.style.transform = "";
        el.style.opacity = "";
        el.animate([{ transform: from }, { transform: "none" }], {
          duration: 380,
          easing: SPRING,
        });
        restart();
      };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  });
}
function toast(message, log = null) {
  clearTimeout(toastTimer);
  toastHost.innerHTML = `<div class="toast"><span>${e(message)}</span>${log ? '<button type="button" class="toast-undo">Undo</button>' : ""}</div>`;
  const el = toastHost.firstElementChild,
    restart = () =>
      (toastTimer = setTimeout(hideToast, log ? 6000 : 4000));
  toastSpace(el);
  swipeToast(el, restart);
  el.querySelector(".toast-undo")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    clearTimeout(toastTimer);
    button.disabled = true;
    button.textContent = "Undoing…";
    try {
      await undo(log);
      hideToast();
    } catch (error) {
      console.error("Jamjar undo failed", error);
      toast(undoError(error));
    }
  });
  restart();
}
const undoError = (error) =>
  ["jamjar/conflict", "unavailable"].includes(error?.code)
    ? error.message
    : "Couldn’t undo that. Try again.";
async function undo(log) {
  if (PREVIEW) {
    undoLocal(log);
    render();
  } else await api?.undoAction(log);
}
function undoLocal(log) {
  const before = (log.beforeItems || []).map(itemSnapshot),
    after = (log.afterItems || []).map(itemSnapshot),
    beforeIds = new Set(before.map((item) => item.id));
  s.items = s.items.filter(
    (item) => !after.some((previous) => previous.id === item.id && !beforeIds.has(item.id)),
  );
  before.forEach((item) => {
    const index = s.items.findIndex((current) => current.id === item.id);
    if (index >= 0) s.items[index] = item;
    else s.items.push(item);
  });
  addLocalLog(
    "undid",
    {
      description: log.description || "action",
      quantity: "",
      list: log.fromList || "",
    },
    after,
    before,
    { targetAction: log.action, targetHistoryId: log.id },
  );
}
// Rows survive renders, so each is bound once and looks its item up when
// touched rather than holding on to the item it was first drawn with.
const boundRows = new WeakSet();
const itemFor = (row) => s.items.find((v) => v.id === row.dataset.id);
const SWIPE_THRESHOLD = 64,
  SWIPE_REST = 112,
  FLICK_SPEED = 0.6;
// Past the delete threshold the row drags with resistance.
const rubberBand = (value) =>
  value < -SWIPE_REST ? -SWIPE_REST + (value + SWIPE_REST) * 0.35 : value;
function swipes() {
  document.querySelectorAll(".swipe-wrap").forEach((w) => {
    const b = w.querySelector(".item-row");
    if (!b || boundRows.has(b)) return;
    boundRows.add(b);
    const tracker = velocityTracker();
    let start = 0,
      startY = 0,
      last = 0,
      pending = 0,
      paintFrame = 0,
      stage = "",
      drag = false,
      horizontal = false,
      vertical = false;
    if (w.classList.contains("pantry-row")) {
      b.onclick = () => {
        const x = itemFor(w);
        if (x) open(x);
      };
      return;
    }
    const stageFor = (x, value) =>
      x.list === "grocery" && value >= innerWidth * 0.5
        ? "transfer"
        : value >= SWIPE_THRESHOLD
          ? "primary"
          : value <= -SWIPE_THRESHOLD
            ? "delete"
            : "";
    const reset = () => {
      if (paintFrame) cancelAnimationFrame(paintFrame);
      paintFrame = 0;
      stage = "";
      b.classList.remove("dragging");
      w.classList.remove("swiping-right", "swiping-left", "armed");
    };
    b.onpointerdown = (q) => {
      if (q.button !== 0) return;
      start = q.clientX;
      startY = q.clientY;
      last = 0;
      pending = 0;
      reset();
      tracker.reset();
      drag = false;
      horizontal = false;
      vertical = false;
      b.setPointerCapture(q.pointerId);
    };
    b.onpointermove = (q) => {
      if (!b.hasPointerCapture(q.pointerId) || vertical) return;
      const x = itemFor(w);
      if (!x) return;
      const raw = q.clientX - start,
        y = q.clientY - startY;
      if (!horizontal && Math.abs(y) > 8 && Math.abs(y) > Math.abs(raw)) {
        vertical = true;
        drag = true;
        return;
      }
      if (!horizontal && Math.abs(raw) > 8 && Math.abs(raw) > Math.abs(y))
        horizontal = true;
      if (!horizontal) return;
      q.preventDefault();
      tracker.add(raw);
      last = raw;
      pending = rubberBand(raw);
      drag = true;
      b.classList.add("dragging");
      // A tick each time the release action changes, like native swipe actions.
      const nextStage = stageFor(x, raw);
      if (nextStage !== stage) {
        if (nextStage) haptic(8);
        stage = nextStage;
      }
      if (!paintFrame)
        paintFrame = requestAnimationFrame(() => {
          paintFrame = 0;
          const value = pending,
            transfer = stage === "transfer",
            primary = w.querySelector(".swipe-underlay.primary"),
            l = primary?.querySelector(".under-label"),
            ii = primary?.querySelector(".under-icon");
          b.style.transform = `translate3d(${value}px,0,0)`;
          w.classList.toggle("swiping-right", value > 12);
          w.classList.toggle("swiping-left", value < -12);
          w.classList.toggle("armed", Boolean(stage));
          primary?.classList.toggle("is-transfer", transfer);
          const label = transfer ? "Move to Pantry" : x.completed ? "Restore" : "Bought";
          if (l && l.textContent !== label) l.textContent = label;
          if (ii && ii.dataset.icon !== String(transfer)) {
            ii.dataset.icon = String(transfer);
            ii.innerHTML = I(transfer ? "archive" : "check");
          }
        });
    };
    b.onpointerup = (q) => {
      if (b.hasPointerCapture(q.pointerId))
        b.releasePointerCapture(q.pointerId);
      const armed = stage;
      reset();
      const x = itemFor(w);
      if (!x || !horizontal) return (b.style.transform = "");
      // A quick flick counts even when it's short of the threshold.
      const speed = tracker.velocity().x,
        flick = Math.abs(speed) > FLICK_SPEED && Math.abs(last) > 24,
        action =
          armed ||
          (flick && Math.sign(speed) === Math.sign(last)
            ? speed > 0
              ? "primary"
              : "delete"
            : "");
      if (!action) return (b.style.transform = "");
      if (!armed) haptic(12);
      b.classList.add(action === "delete" ? "moving-left" : "completing");
      setTimeout(
        () =>
          action === "transfer"
            ? move(x, "pantry")
            : action === "primary"
              ? toggle(x)
              : remove(x),
        180,
      );
    };
    b.onpointercancel = () => {
      reset();
      b.style.transform = "";
    };
    b.onclick = () => {
      const x = itemFor(w);
      if (!drag && x) open(x);
    };
  });
}
function pullToClear() {
  pullListeners?.abort();
  pullListeners = null;
  const list = s.tab === "shopping" ? "shopping" : "grocery",
    section = document.getElementById(`${list}-section`),
    indicator = document.getElementById("clearPull");
  if (!section || !indicator) return;
  pullListeners = new AbortController();
  const { signal } = pullListeners;
  const threshold = 72;
  let startX = 0,
    startY = 0,
    amount = 0,
    tracking = false;
  const atBottom = () =>
    innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
  const inPullArea = (y) => {
    const listBottom = section
      .querySelector(".item-list")
      .getBoundingClientRect().bottom;
    return y >= listBottom - 4 || y >= innerHeight - 150;
  };
  const show = (value) => {
    amount = Math.max(0, Math.min(value, 96));
    indicator.style.transform = `translateY(${64 - Math.min(amount, 64)}px)`;
    indicator.style.setProperty("--pull", String(Math.min(amount / threshold, 1)));
    const armed = amount >= threshold;
    if (armed && !indicator.classList.contains("armed")) haptic(10);
    indicator.classList.toggle("armed", armed);
    indicator.querySelector(".pull-label").textContent = armed
      ? "Release to clear completed"
      : "Pull up to clear completed";
  };
  const finish = () => {
    if (!tracking) return;
    const armed = amount >= threshold;
    tracking = false;
    show(0);
    if (armed) {
      s.clearList = list;
      render();
    }
  };
  section.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      if (!touch || !atBottom() || !inPullArea(touch.clientY)) return;
      startX = touch.clientX;
      startY = touch.clientY;
      amount = 0;
      tracking = true;
    },
    { passive: true, signal },
  );
  section.addEventListener(
    "touchmove",
    (event) => {
      if (!tracking || event.touches.length !== 1) return;
      const touch = event.touches[0],
        up = startY - touch.clientY,
        sideways = Math.abs(startX - touch.clientX);
      if (up <= 0 || up <= sideways) return;
      event.preventDefault();
      show(up);
    },
    { passive: false, signal },
  );
  section.addEventListener("touchend", finish, { signal });
  section.addEventListener("touchcancel", finish, { signal });
  section.addEventListener("pointerdown", (event) => {
    if (
      event.pointerType !== "mouse" ||
      !atBottom() ||
      !inPullArea(event.clientY)
    )
      return;
    startX = event.clientX;
    startY = event.clientY;
    amount = 0;
    tracking = true;
  }, { signal });
  section.addEventListener("pointermove", (event) => {
    if (!tracking || event.pointerType !== "mouse") return;
    const up = startY - event.clientY,
      sideways = Math.abs(startX - event.clientX);
    if (up > 0 && up > sideways) show(up);
  }, { signal });
  section.addEventListener("pointerup", finish, { signal });
  section.addEventListener("pointercancel", finish, { signal });
}
const TABS = ["grocery", "pantry", "shopping", "settings"];
function selectTab(next) {
  if (innerWidth <= 680 && next === s.tab && next !== "settings") {
    s.oneHanded = !s.oneHanded;
    document
      .querySelector(".app-shell")
      ?.classList.toggle("one-handed", s.oneHanded);
    return scrollTabTop();
  }
  if (next === s.tab) return;
  const mobile = innerWidth <= 680,
    direction = Math.sign(TABS.indexOf(next) - TABS.indexOf(s.tab));
  transition("tab", direction, () => {
    s.oneHanded = false;
    s.query = "";
    s.tab = next;
    render();
    if (mobile) scrollTo(0, 0);
  });
}
const clicks = {
  signin: () => api?.signIn(),
  back: () => history.back(),
  add: () => open(),
  hist: () => openHistory(),
  install: () => installPrompt?.prompt(),
  signout: () => api?.signOut(),
  clearSearch: () => {
    const search = document.getElementById("search");
    s.query = "";
    if (search) search.value = "";
    render({ animate: false });
    search?.focus();
  },
  save: () => save(),
  cancel: () => close(),
  x: () => close(),
  delAsk: () => {
    s.del = true;
    render();
  },
  clearNo: async () => {
    await dismissDialogs(".dialog-backdrop.confirm");
    s.clearList = "";
    render();
  },
  clearYes: () => clearAll(),
  delNo: async () => {
    await dismissDialogs(".dialog-backdrop.confirm");
    s.del = false;
    render();
  },
  delYes: () => remove(),
};
// One set of listeners on the root, since elements are kept across renders.
root.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || !root.contains(button)) return;
  const { tab, pantryCategory, itemCategory, moveToGroceries, undoId } =
    button.dataset;
  if (tab) return selectTab(tab);
  if (pantryCategory) {
    if (pantryCategory === s.pantryCategory) return;
    const direction = Math.sign(
      PANTRY_CATEGORIES.indexOf(pantryCategory) -
        PANTRY_CATEGORIES.indexOf(s.pantryCategory),
    );
    return transition("category", direction, () => {
      s.pantryCategory = pantryCategory;
      s.query = "";
      render();
    });
  }
  if (itemCategory) {
    s.itemCategory = itemCategory;
    document.querySelectorAll("[data-item-category]").forEach((choice) => {
      const selected = choice.dataset.itemCategory === s.itemCategory;
      choice.classList.toggle("active", selected);
      choice.setAttribute("aria-pressed", String(selected));
    });
    return;
  }
  if (moveToGroceries) {
    const item = s.items.find((candidate) => candidate.id === moveToGroceries);
    if (item) void move(item, "grocery");
    return;
  }
  if (undoId) return void undoFromHistory(button);
  clicks[button.id]?.();
});
root.addEventListener("pointerdown", (event) => {
  ripple(event);
  dragSheet(event);
  edgeSwipeBack(event);
});
// iOS only applies :active press styles when a touch listener exists.
addEventListener("touchstart", () => {}, { passive: true });
root.addEventListener("input", (event) => {
  const { id, value } = event.target;
  if (id === "search") {
    s.query = value;
    s.pantryCategory = "All";
    render({ animate: false });
  } else if (id === "desc") s.desc = value;
  else if (id === "qty") s.qty = value;
});
addEventListener("beforeinstallprompt", (q) => {
  q.preventDefault();
  installPrompt = q;
  s.install = true;
  render();
});
addEventListener("popstate", () => {
  if (s.history) return void closeHistory();
  if (s.editor) return void close(true);
});
addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !s.editor || s.del) return;
  event.preventDefault();
  close();
});
window.visualViewport?.addEventListener("resize", syncVisualViewport);
window.visualViewport?.addEventListener("scroll", syncVisualViewport);
addEventListener("resize", syncVisualViewport);
syncVisualViewport();
if (!PREVIEW) {
  const setActor = (user) => {
    s.actor = user;
    s.authKnown = true;
    try {
      if (user) localStorage.setItem(SIGNED_IN_KEY, "1");
      else localStorage.removeItem(SIGNED_IN_KEY);
    } catch {}
  };
  addEventListener("jamjar:auth", (q) => {
    setActor(q.detail);
    render();
  });
  addEventListener("jamjar:data", (q) => {
    const nextItems = q.detail.items || [],
      nextLogs = q.detail.history || [],
      itemsChanged = !sameItems(s.items, nextItems),
      logsChanged = !sameLogs(s.logs, nextLogs),
      nextStatus = q.detail.fromCache
        ? "Offline · changes will sync"
        : "Up to date",
      statusChanged = s.status !== nextStatus,
      firstLoad = !s.loaded;
    s.loaded = true;
    s.items = nextItems;
    s.logs = nextLogs;
    if (s.undoPendingId && s.logs.some((log) => log.targetHistoryId === s.undoPendingId))
      s.undoPendingId = null;
    s.status = nextStatus;
    if (
      firstLoad ||
      itemsChanged ||
      statusChanged ||
      (logsChanged && (s.history || s.editor))
    )
      scheduleRender();
  });
  addEventListener("jamjar:write-error", (q) => toast(q.detail));
  addEventListener("jamjar:error", (q) => {
    s.status = q.detail || "Sync unavailable";
    s.loaded = true;
    render();
  });
  import("./firebase-client.js")
    .then((client) => {
      api = client.api;
      s.ready = true;
      if (client.current.user !== undefined) setActor(client.current.user);
      if (client.current.data) {
        s.items = client.current.data.items || [];
        s.logs = client.current.data.history || [];
        s.loaded = true;
      }
      render();
    })
    .catch(() => {
      s.status = "Sync unavailable";
      s.authKnown = true;
      render();
    });
  if ("serviceWorker" in navigator)
    navigator.serviceWorker.register("./sw.js").catch(() => {});
}
const mc = document.modelContext;
if (mc?.registerTool) {
  const ac = new AbortController();
  mc.registerTool(
    {
      name: "add_jamjar_item",
      title: "Add Jamjar item",
      description: "Add an item to the shared Groceries, Pantry, or Shopping list.",
      inputSchema: {
        type: "object",
        properties: {
          description: { type: "string", minLength: 1, maxLength: 120 },
          quantity: { type: "string", maxLength: 40 },
          list: { type: "string", enum: ["grocery", "pantry", "shopping"] },
          category: { type: "string", enum: ITEM_CATEGORIES },
        },
        required: ["description", "list"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (v) => {
        const d = v?.description?.trim(),
          list = v?.list;
        if (!d || !["grocery", "pantry", "shopping"].includes(list))
          throw Error("A valid description and list are required.");
        if (
          s.items.some(
            (i) =>
              i.list === list &&
              i.description.toLowerCase() === d.toLowerCase(),
          )
        )
          throw Error("That item is already on the list.");
        const quantity = list === "pantry" ? "" : v?.quantity?.trim() || "",
          category = list === "pantry" ? normalizedCategory(v?.category) : "",
          id = crypto.randomUUID(),
          now = Date.now();
        s.revealId = id;
        if (PREVIEW)
          local("added", {
            id,
            description: d,
            quantity,
            list,
            ...(list === "pantry" ? { category } : {}),
            completed: false,
            createdAt: now,
            updatedAt: now,
            listAddedAt: now,
          });
        else
          await api?.addItem({
            id,
            description: d,
            quantity,
            list,
            ...(list === "pantry" ? { category } : {}),
          });
        render();
        return { added: d, list, ...(list === "pantry" ? { category } : {}) };
      },
    },
    { signal: ac.signal },
  );
  mc.registerTool(
    {
      name: "find_pantry_items",
      title: "Find Pantry items",
      description: "Find currently stocked Pantry items by description.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", maxLength: 120 } },
        required: ["query"],
        additionalProperties: false,
      },
      // Descriptions are typed by either household member.
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (v) => {
        const q = String(v?.query || "")
          .trim()
          .toLowerCase();
        return {
          items: s.items
            .filter(
              (i) =>
                i.list === "pantry" && i.description.toLowerCase().includes(q),
            )
            .map((i) => ({
              description: i.description,
              category: normalizedCategory(i.category),
            })),
        };
      },
    },
    { signal: ac.signal },
  );
}
render();
