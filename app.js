const root = document.getElementById("app");
const PREVIEW = ["terminal.local", "localhost", "127.0.0.1"].includes(
  location.hostname,
);
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
const appIcon = (className = "") =>
  `<img class="app-icon ${className}" src="./icon-192.png" alt="">`;
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
      return items.sort(
        (a, b) =>
          (a.listAddedAt || a.createdAt || 0) -
          (b.listAddedAt || b.createdAt || 0),
      );
    }
    return items.sort((a, b) => {
      const categoryOrder =
        ITEM_CATEGORIES.indexOf(normalizedCategory(a.category)) -
        ITEM_CATEGORIES.indexOf(normalizedCategory(b.category));
      return (
        categoryOrder ||
        a.description.localeCompare(b.description, undefined, {
          sensitivity: "base",
          numeric: true,
        })
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
  const now = Date.now();
  s.logs = [
    {
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
    },
    ...s.logs,
  ];
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
  addLocalLog(action, item, before ? [before] : [], after ? [after] : [], {
    toList: patch.list || "",
  });
}
function gate() {
  root.innerHTML = `<main class="gate"><div class="gate-card">${appIcon("gate-icon")}<h1>Jamjar</h1>${!s.authKnown ? `<p>${s.ready ? "Sign in with Google to share your grocery list and pantry." : "Opening your lists…"}</p>` : ""}<button class="btn google-button" id="signin" ${!s.ready ? "disabled" : ""}>Sign in with Google</button></div></main>`;
  document
    .getElementById("signin")
    ?.addEventListener("click", () => window.JamjarFirebase?.signIn());
}
function renderHistory() {
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
  root.innerHTML = `<main class="history-screen"><header class="screen-head"><button id="back" aria-label="Back">${I("back")}</button><h1>History Log</h1></header><ol class="history-list">${h || '<li class="empty-state">Actions will appear here as you use Jamjar.</li>'}</ol></main>`;
  document.getElementById("back").onclick = () => window.window.history.back();
  document.querySelector("[data-undo-id]")?.addEventListener("click", async (event) => {
    const button = event.currentTarget,
      log = s.logs.find((entry) => entry.id === button.dataset.undoId);
    if (!log) return;
    s.undoPendingId = log.id;
    button.disabled = true;
    button.textContent = "Undoing…";
    try {
      if (PREVIEW) undoLocal(log);
      else await window.JamjarFirebase?.undoAction(log);
      render();
    } catch (error) {
      console.error("Jamjar undo failed", error);
      s.undoPendingId = null;
      button.disabled = false;
      button.textContent = "Try again";
    }
  });
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
function pantryPage(items, emptyText) {
  return `<div class="pantry-page"><ul class="item-list">${pantryRows(items)}${items.length ? "" : `<li class="empty-state">${emptyText}</li>`}</ul></div>`;
}
function editor() {
  if (!s.editor) return "";
  const x = s.items.find((i) => i.id === s.editId),
    editorList = x?.list || s.tab,
    hasQuantity = editorList === "grocery" || editorList === "shopping",
    opts = [
      ...new Set([
        ...s.items.map((i) => i.description),
        ...s.logs.map((l) => l.description),
      ]),
    ].sort();
  const descriptionPlaceholder = hasQuantity
    ? "What do you need?"
    : "What do you have?";
  const categorySelector = hasQuantity
    ? ""
    : `<div class="category-selector" role="group" aria-label="Category">${ITEM_CATEGORIES.map((category) => `<button type="button" class="category-choice${s.itemCategory === category ? " active" : ""}" data-item-category="${e(category)}" aria-pressed="${s.itemCategory === category}">${e(category)}</button>`).join("")}</div>`;
  const actions = `<div class="dialog-actions"><button class="btn ghost" id="cancel">Cancel</button><button class="btn" id="save" ${s.saving ? "disabled" : ""}>${s.saving ? "Saving…" : "Save"}</button>${x ? `<button class="btn ghost delete-button" id="delAsk">${I("trash")}Delete</button>` : ""}</div>`;
  return `<div class="dialog-backdrop editor"><section class="dialog dialog-wrap" role="dialog" aria-modal="true"><button class="close-x" id="x" aria-label="Close editor">×</button><h2>${x ? "Edit item" : `Add to ${listLabel(editorList)}`}</h2><div class="form-stack"><label>Description<input id="desc" maxlength="120" list="suggestions" value="${e(s.desc)}" placeholder="${descriptionPlaceholder}"></label><datalist id="suggestions">${opts.map((v) => `<option value="${e(v)}"></option>`).join("")}</datalist>${categorySelector}${hasQuantity ? `<label>Quantity <span>Optional</span><input id="qty" maxlength="40" value="${e(s.qty)}" placeholder="2, 3 cans, 1 lb…"></label>` : ""}${s.error ? `<p class="form-error" role="alert">${e(s.error)}</p>` : ""}</div>${actions}</section></div>`;
}
function confirm() {
  if (s.clearList) {
    const n = listDone(s.clearList).length;
    return `<div class="dialog-backdrop"><section class="dialog confirm-dialog"><h2>Clear completed items?</h2><p>This removes all ${n} completed ${n === 1 ? "item" : "items"} from ${e(listLabel(s.clearList))}. The action can be undone from History.</p><div class="dialog-actions"><button class="btn ghost" id="clearNo">Cancel</button><button class="btn" id="clearYes">Clear completed</button></div></section></div>`;
  }
  if (s.del) {
    const x = s.items.find((i) => i.id === s.editId);
    return `<div class="dialog-backdrop"><section class="dialog confirm-dialog"><h2>Delete “${e(x?.description || "")}”?</h2><p>This removes it from Jamjar. The action will remain in History.</p><div class="dialog-actions"><button class="btn ghost" id="delNo">Cancel</button><button class="btn destructive" id="delYes">Delete</button></div></section></div>`;
  }
  return "";
}
function app() {
  const groceries = listActive("grocery"),
    groceryDone = listDone("grocery"),
    shopping = listActive("shopping"),
    shoppingDone = listDone("shopping"),
    p = pantry(),
    u = s.actor || {},
    initial = (u.displayName?.[0] || u.email?.[0] || "?").toUpperCase();
  const categoryTabs = PANTRY_CATEGORIES.map(
    (category) =>
      `<button type="button" class="pantry-category-tab${s.pantryCategory === category ? " active" : ""}" data-pantry-category="${e(category)}" aria-pressed="${s.pantryCategory === category}">${e(category)}</button>`,
  ).join("");
  const listMarkup = (list, activeItems, completedItems, emptyText) =>
    `<section id="${list}-section" ${s.tab !== list ? "hidden" : ""}><div class="list-content"><ul class="item-list">${activeItems.map((x, i) => row(x, i, activeItems.length)).join("")}${activeItems.length ? "" : `<li class="empty-state">${emptyText}</li>`}${completedItems.map((x, i) => row(x, i, completedItems.length)).join("")}</ul>${completedItems.length ? `<div class="clear-pull" id="clearPull" aria-hidden="true">${I("trash")}<span>Pull up to clear completed</span></div>` : ""}</div></section>`;
  root.innerHTML = `<div class="app-shell tab-${s.tab}${s.oneHanded ? " one-handed" : ""}">
    <header class="topbar"><div class="brand">${appIcon("brand-icon")}<span>Jamjar</span></div><span class="sync-status">${e(s.status)}</span></header>
    <main class="list-main">
      ${listMarkup("grocery", groceries, groceryDone, "Your grocery list is empty.")}
      <section id="pantry-section" ${s.tab !== "pantry" ? "hidden" : ""}><div class="list-content"><div class="pantry-controls"><div class="search-field">${I("search")}<label class="sr-only" for="search">Search Pantry</label><input id="search" value="${e(s.query)}" placeholder="Search">${s.query ? `<button type="button" class="search-clear" id="clearSearch" aria-label="Clear search">${I("x")}</button>` : ""}</div><nav class="pantry-categories" aria-label="Pantry categories">${categoryTabs}</nav></div><div class="pantry-page-surface">${pantryPage(p, s.query ? "No pantry items match." : s.pantryCategory === "All" ? "Your pantry is empty." : "No items in this category.")}</div></div></section>
      ${listMarkup("shopping", shopping, shoppingDone, "Your shopping list is empty.")}
      <section ${s.tab !== "settings" ? "hidden" : ""}><div class="settings-page"><button class="settings-row" id="hist"><span class="setting-icon">${I("history")}</span><span><strong>History Log</strong><small>See every change and who made it</small></span><span>›</span></button><div class="settings-row static"><span class="avatar">${e(initial)}</span><span><strong>${e(u.displayName || u.email || "")}</strong><small>${e(u.email || "")}</small></span></div>${s.install ? `<button class="settings-row" id="install"><span class="setting-icon">${I("package")}</span><span><strong>Install Jamjar</strong><small>Add it to this device</small></span><span>›</span></button>` : ""}<button class="settings-row danger-row" id="signout"><span class="setting-icon">${I("logout")}</span><span><strong>Sign out</strong><small>Keep shared data in Jamjar</small></span></button></div></section>
    </main>
    ${s.tab !== "settings" ? `<button class="fab" id="add">${I("plus")}</button>` : ""}
    <nav class="bottom-tabs">
      <button class="tab-trigger ${s.tab === "grocery" ? "active" : ""}" data-tab="grocery">${I("basket")}<span>Groceries</span>${groceries.length ? `<b>${groceries.length}</b>` : ""}</button>
      <button class="tab-trigger ${s.tab === "pantry" ? "active" : ""}" data-tab="pantry">${I("package")}<span>Pantry</span></button>
      <button class="tab-trigger ${s.tab === "shopping" ? "active" : ""}" data-tab="shopping">${I("shopping")}<span>Shopping</span>${shopping.length ? `<b>${shopping.length}</b>` : ""}</button>
      <button class="tab-trigger ${s.tab === "settings" ? "active" : ""}" data-tab="settings">${I("settings")}<span>Settings</span></button>
    </nav>
  </div>${editor()}${confirm()}`;
  bind();
}
function captureLayout() {
  const positions = new Map(),
    states = new Map();
  visibleRows().forEach((row) => {
    positions.set(row.dataset.id, row.getBoundingClientRect().top);
    states.set(row.dataset.id, row.classList.contains("is-done"));
  });
  return { positions, states };
}
function visibleRows() {
  return [...document.querySelectorAll(".swipe-wrap[data-id]")].filter(
    (row) =>
      !row.closest(".pantry-page-adjacent") &&
      !row.closest("section[hidden]"),
  );
}
function animateLayout(previous) {
  if (!previous.positions.size) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  visibleRows().forEach((row) => {
    const id = row.dataset.id,
      wasDone = previous.states.get(id),
      isDone = row.classList.contains("is-done"),
      label = row.querySelector(".item-copy > span");
    if (!reduced && wasDone === false && isDone)
      label?.classList.add("strike-entering");
    else if (!reduced && wasDone === true && !isDone)
      label?.classList.add("strike-leaving");
    if (
      label?.classList.contains("strike-entering") ||
      label?.classList.contains("strike-leaving")
    )
      setTimeout(
        () => label.classList.remove("strike-entering", "strike-leaving"),
        500,
      );
    if (reduced || !row.animate) return;
    const oldTop = previous.positions.get(id),
      newTop = row.getBoundingClientRect().top;
    if (oldTop !== undefined && Math.abs(oldTop - newTop) > 0.5)
      row.animate(
        [
          { transform: `translateY(${oldTop - newTop}px)` },
          { transform: "translateY(0)" },
        ],
        { duration: 300, easing: "cubic-bezier(0.37, 0, 0.63, 1)" },
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
function pagePantryCategory(direction) {
  const current = PANTRY_CATEGORIES.indexOf(s.pantryCategory),
    next = Math.max(
      0,
      Math.min(PANTRY_CATEGORIES.length - 1, current + direction),
    );
  if (next === current) return;
  const outgoing = document
    .querySelector("#pantry-section .pantry-page")
    ?.cloneNode(true);
  s.pantryCategory = PANTRY_CATEGORIES[next];
  s.query = "";
  render();
  animatePantryPage(outgoing, direction);
  requestAnimationFrame(() => {
    const activeTab = [...document.querySelectorAll(".pantry-category-tab")].find(
      (tab) => tab.dataset.pantryCategory === s.pantryCategory,
    );
    activeTab?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  });
}
function animatePantryPage(outgoing, direction) {
  const incoming = document.querySelector("#pantry-section .pantry-page"),
    host = incoming?.parentElement;
  if (
    !outgoing ||
    !incoming ||
    !host ||
    !incoming.animate ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const forward = direction > 0,
    easing = "cubic-bezier(0.37, 0, 0.63, 1)",
    options = { duration: 300, easing, fill: "both" };
  host.classList.add("category-transitioning");
  outgoing.classList.add("category-page-outgoing");
  outgoing.setAttribute("aria-hidden", "true");
  outgoing.style.top = `${incoming.offsetTop}px`;
  host.insertBefore(outgoing, incoming);
  const outgoingAnimation = outgoing.animate(
      [
        { transform: "translate3d(0,0,0)" },
        { transform: `translate3d(${forward ? "-100%" : "100%"},0,0)` },
      ],
      options,
    ),
    incomingAnimation = incoming.animate(
      [
        { transform: `translate3d(${forward ? "100%" : "-100%"},0,0)` },
        { transform: "translate3d(0,0,0)" },
      ],
      options,
    );
  Promise.allSettled([
    outgoingAnimation.finished,
    incomingAnimation.finished,
  ]).then(() => {
    outgoing.remove();
    host.classList.remove("category-transitioning");
  });
}
function pantryCategorySwipes() {
  const surface = document.querySelector(".pantry-page-surface"),
    currentPage = surface?.querySelector(".pantry-page:not(.pantry-page-adjacent)");
  if (!surface || !currentPage || s.tab !== "pantry") return;
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
  };
  const flushDragFrame = () => {
    if (!dragFrame) return;
    cancelAnimationFrame(dragFrame);
    paintDrag(pendingX);
  };
  const clearDrag = () => {
    if (dragFrame) cancelAnimationFrame(dragFrame);
    dragFrame = 0;
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
      duration = reduced ? 0 : commit ? 260 : 220,
      options = {
        duration,
        easing: "cubic-bezier(0.37, 0, 0.63, 1)",
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
    startX = event.clientX;
    startY = event.clientY;
    lastX = 0;
    pendingX = 0;
    startTime = performance.now();
    pointerId = event.pointerId;
    horizontal = false;
    vertical = false;
  });
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
  });
  surface.addEventListener("pointerup", finish);
  surface.addEventListener("pointercancel", finish);
  surface.addEventListener(
    "click",
    (event) => {
      if (performance.now() >= suppressClickUntil) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
  const prepareAdjacentPages = () => {
    if (!surface.isConnected || s.tab !== "pantry") return;
    makeAdjacentPage(-1);
    makeAdjacentPage(1);
  };
  if ("requestIdleCallback" in window)
    requestIdleCallback(prepareAdjacentPages, { timeout: 220 });
  else setTimeout(prepareAdjacentPages, 80);
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
function render() {
  if (renderFrame) {
    cancelAnimationFrame(renderFrame);
    renderFrame = 0;
  }
  const previous = captureLayout();
  if (!s.authKnown && !PREVIEW) return gate();
  if (!s.actor && !PREVIEW) return gate();
  if (s.history) return renderHistory();
  app();
  animateLayout(previous);
  revealPendingItem();
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
  setTimeout(() => document.getElementById("desc")?.focus(), 0);
}
function close(fromPop = false) {
  s.editor = false;
  s.editId = null;
  s.error = "";
  s.saving = false;
  if (!fromPop && window.history.state?.editor) window.history.back();
  render();
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
      const patch = { description: desc, quantity: qty };
      if (list === "pantry") patch.category = category;
      if (PREVIEW) local("updated", x, patch);
      else
        await window.JamjarFirebase?.updateItem(x.id, patch);
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
        await window.JamjarFirebase?.addItem({
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
async function toggle(x) {
  if (PREVIEW) {
    local(x.completed ? "restored" : "bought", x, {
      completed: !x.completed,
      ...(x.completed ? { listAddedAt: Date.now() } : {}),
    });
    render();
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
    await window.JamjarFirebase?.toggleBought(x);
  } catch (error) {
    console.error("Jamjar bought update failed", error);
    s.items = s.items.map((item) => (item.id === x.id ? x : item));
    s.status = "Couldn’t update that item. Try again.";
    render();
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
    s.status = `Already in ${listLabel(to)}`;
    return render();
  }
  if (PREVIEW) {
    local(to === "pantry" ? "moved_to_pantry" : "moved_to_grocery", x, {
      list: to,
      completed: false,
      quantity: "",
      category: x.category || (to === "pantry" ? "Other" : ""),
      listAddedAt: Date.now(),
    });
    render();
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
    await window.JamjarFirebase?.moveItem(x, to);
    return true;
  } catch (error) {
    console.error("Jamjar move failed", error);
    s.items = s.items.map((item) => (item.id === x.id ? x : item));
    s.status = "Couldn’t move that item. Try again.";
    render();
    return false;
  }
}
async function remove() {
  const x = s.items.find((i) => i.id === s.editId);
  if (!x) return;
  if (PREVIEW) local("deleted", x);
  else await window.JamjarFirebase?.deleteItem(x);
  s.del = false;
  s.editor = false;
  s.editId = null;
  if (window.history.state?.editor) window.history.back();
  render();
}
async function clearAll() {
  const source = s.clearList,
    items = listDone(source);
  if (PREVIEW) {
    s.items = s.items.filter((item) => !items.some((done) => done.id === item.id));
    addLocalLog(
      "cleared_completed",
      {
        description: `${items.length} completed ${items.length === 1 ? "item" : "items"}`,
        quantity: "",
        list: source,
      },
      items,
      [],
    );
  } else await window.JamjarFirebase?.clearCompleted(items, source);
  s.clearList = "";
  render();
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
function swipes() {
  document.querySelectorAll(".swipe-wrap").forEach((w) => {
    const b = w.querySelector(".item-row"),
      primary = w.querySelector(".swipe-underlay.primary"),
      l = primary?.querySelector(".under-label"),
      ii = primary?.querySelector(".under-icon"),
      x = s.items.find((v) => v.id === w.dataset.id);
    let start = 0,
      startY = 0,
      last = 0,
      pending = 0,
      paintFrame = 0,
      drag = false,
      horizontal = false,
      vertical = false;
    if (!x) return;
    if (x.list === "pantry") {
      b.onclick = () => open(x);
      return;
    }
    b.onpointerdown = (q) => {
      if (q.button !== 0) return;
      start = q.clientX;
      startY = q.clientY;
      last = 0;
      pending = 0;
      if (paintFrame) cancelAnimationFrame(paintFrame);
      paintFrame = 0;
      drag = false;
      horizontal = false;
      vertical = false;
      b.setPointerCapture(q.pointerId);
    };
    b.onpointermove = (q) => {
      if (!b.hasPointerCapture(q.pointerId) || vertical) return;
      const raw = q.clientX - start,
        y = q.clientY - startY,
        next = raw;
      if (!horizontal && Math.abs(y) > 8 && Math.abs(y) > Math.abs(raw)) {
        vertical = true;
        drag = true;
        return;
      }
      if (!horizontal && Math.abs(raw) > 8 && Math.abs(raw) > Math.abs(y))
        horizontal = true;
      if (!horizontal) return;
      q.preventDefault();
      last = next;
      pending = next;
      drag = true;
      b.classList.add("dragging");
      if (!paintFrame)
        paintFrame = requestAnimationFrame(() => {
          paintFrame = 0;
          const value = pending,
            transfer = x.list === "grocery" && value >= innerWidth * 0.5;
          b.style.transform = `translate3d(${value}px,0,0)`;
          w.classList.toggle("swiping-right", value > 12);
          w.classList.toggle("swiping-left", value < -12);
          primary?.classList.toggle("is-transfer", transfer);
          if (l)
            l.textContent = transfer
              ? "Move to Pantry"
              : x.completed
                ? "Restore"
                : "Bought";
          if (ii) ii.innerHTML = I(transfer ? "archive" : "check");
        });
    };
    b.onpointerup = (q) => {
      if (paintFrame) cancelAnimationFrame(paintFrame);
      paintFrame = 0;
      if (b.hasPointerCapture(q.pointerId))
        b.releasePointerCapture(q.pointerId);
      b.classList.remove("dragging");
      w.classList.remove("swiping-right", "swiping-left");
      if (x.list === "grocery" && last >= innerWidth * 0.5) {
        b.classList.add("completing");
        navigator.vibrate?.(12);
        return setTimeout(() => move(x, "pantry"), 180);
      }
      if ((x.list === "grocery" || x.list === "shopping") && last >= 64) {
        b.classList.add("completing");
        navigator.vibrate?.(12);
        return setTimeout(() => toggle(x), 180);
      }
      if ((x.list === "grocery" || x.list === "shopping") && last <= -64) {
        b.classList.add("moving-left");
        navigator.vibrate?.(12);
        return setTimeout(() => {
          s.editId = x.id;
          s.del = true;
          render();
        }, 180);
      }
      b.style.transform = "";
    };
    b.onpointercancel = () => {
      if (paintFrame) cancelAnimationFrame(paintFrame);
      paintFrame = 0;
      b.classList.remove("dragging");
      w.classList.remove("swiping-right", "swiping-left");
      b.style.transform = "";
    };
    b.onclick = () => {
      if (!drag) open(x);
    };
  });
}
function pullToClear() {
  const list = s.tab === "shopping" ? "shopping" : "grocery",
    section = document.getElementById(`${list}-section`),
    indicator = document.getElementById("clearPull");
  if (!section || !indicator) return;
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
    const armed = amount >= threshold;
    indicator.classList.toggle("armed", armed);
    indicator.querySelector("span").textContent = armed
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
    { passive: true },
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
    { passive: false },
  );
  section.addEventListener("touchend", finish);
  section.addEventListener("touchcancel", finish);
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
  });
  section.addEventListener("pointermove", (event) => {
    if (!tracking || event.pointerType !== "mouse") return;
    const up = startY - event.clientY,
      sideways = Math.abs(startX - event.clientX);
    if (up > 0 && up > sideways) show(up);
  });
  section.addEventListener("pointerup", finish);
  section.addEventListener("pointercancel", finish);
}
function bind() {
  document.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        const next = b.dataset.tab;
        if (innerWidth <= 680 && next === s.tab && next !== "settings") {
          s.oneHanded = !s.oneHanded;
          document
            .querySelector(".app-shell")
            ?.classList.toggle("one-handed", s.oneHanded);
          return scrollTabTop();
        }
        if (next === s.tab) return;
        const mobile = innerWidth <= 680;
        s.oneHanded = false;
        s.query = "";
        s.tab = next;
        render();
        if (mobile) scrollTabTop();
      }),
  );
  document.getElementById("add")?.addEventListener("click", () => open());
  document.querySelectorAll("[data-pantry-category]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.pantryCategory === s.pantryCategory) return;
      const scrollLeft = button.parentElement.scrollLeft;
      s.pantryCategory = button.dataset.pantryCategory;
      s.query = "";
      render();
      requestAnimationFrame(() => {
        const tabs = document.querySelector(".pantry-categories");
        if (tabs) tabs.scrollLeft = scrollLeft;
      });
    });
  });
  document.querySelectorAll("[data-item-category]").forEach((button) => {
    button.addEventListener("click", () => {
      s.itemCategory = button.dataset.itemCategory;
      document.querySelectorAll("[data-item-category]").forEach((choice) => {
        const selected = choice.dataset.itemCategory === s.itemCategory;
        choice.classList.toggle("active", selected);
        choice.setAttribute("aria-pressed", String(selected));
      });
    });
  });
  document.getElementById("hist")?.addEventListener("click", () => {
    s.history = true;
    window.history.pushState({ history: true }, "");
    render();
  });
  document
    .getElementById("install")
    ?.addEventListener("click", () => installPrompt?.prompt());
  document
    .getElementById("signout")
    ?.addEventListener("click", () => window.JamjarFirebase?.signOut());
  document.getElementById("search")?.addEventListener("input", (q) => {
    s.query = q.target.value;
    s.pantryCategory = "All";
    render();
    const z = document.getElementById("search");
    z?.focus();
    z?.setSelectionRange(s.query.length, s.query.length);
  });
  document.getElementById("clearSearch")?.addEventListener("click", () => {
    s.query = "";
    render();
    document.getElementById("search")?.focus();
  });
  document
    .getElementById("desc")
    ?.addEventListener("input", (q) => (s.desc = q.target.value));
  document
    .getElementById("qty")
    ?.addEventListener("input", (q) => (s.qty = q.target.value));
  document.getElementById("save")?.addEventListener("click", save);
  document.querySelectorAll("[data-move-to-groceries]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const item = s.items.find(
        (candidate) => candidate.id === button.dataset.moveToGroceries,
      );
      if (item) void move(item, "grocery");
    });
  });
  document.getElementById("cancel")?.addEventListener("click", () => close());
  document.getElementById("x")?.addEventListener("click", () => close());
  document.getElementById("delAsk")?.addEventListener("click", () => {
    s.del = true;
    render();
  });
  document.getElementById("clearNo")?.addEventListener("click", () => {
    s.clearList = "";
    render();
  });
  document.getElementById("clearYes")?.addEventListener("click", clearAll);
  document.getElementById("delNo")?.addEventListener("click", () => {
    s.del = false;
    render();
  });
  document.getElementById("delYes")?.addEventListener("click", remove);
  pantryCategorySwipes();
  swipes();
  pullToClear();
}
addEventListener("beforeinstallprompt", (q) => {
  q.preventDefault();
  installPrompt = q;
  s.install = true;
  render();
});
addEventListener("popstate", () => {
  if (s.history) {
    s.history = false;
    return render();
  }
  if (s.editor) return close(true);
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
  addEventListener("jamjar:firebase-ready", () => {
    s.ready = true;
    render();
  });
  addEventListener("jamjar:auth", (q) => {
    s.actor = q.detail;
    s.authKnown = true;
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
      statusChanged = s.status !== nextStatus;
    s.items = nextItems;
    s.logs = nextLogs;
    if (s.undoPendingId && s.logs.some((log) => log.targetHistoryId === s.undoPendingId))
      s.undoPendingId = null;
    s.status = nextStatus;
    if (itemsChanged || statusChanged || (logsChanged && (s.history || s.editor)))
      scheduleRender();
  });
  addEventListener("jamjar:error", (q) => {
    s.status = q.detail || "Sync unavailable";
    render();
  });
  import("./firebase-client.js")
    .then(() => {
      if (window.JamjarFirebase) s.ready = true;
      if (window.JamjarCurrentUser !== undefined) {
        s.actor = window.JamjarCurrentUser;
        s.authKnown = true;
      }
      if (window.JamjarData) {
        s.items = window.JamjarData.items || [];
        s.logs = window.JamjarData.history || [];
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
          local("add", {
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
          await window.JamjarFirebase?.addItem({
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
      annotations: { readOnlyHint: true, untrustedContentHint: false },
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
