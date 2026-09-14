const root = document.getElementById("app");
const PREVIEW = ["terminal.local", "localhost", "127.0.0.1"].includes(
  location.hostname,
);
const PALETTES = {
  grocery: ["#E32960", "#F9732F", "#FEA000"],
  pantry: ["#007DC2", "#00AB6C", "#8AD928"],
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
    createdAt: 4,
    updatedAt: 4,
  },
  {
    id: "s5",
    description: "Fish sauce",
    quantity: "1 bottle",
    list: "pantry",
    createdAt: 3,
    updatedAt: 3,
  },
  {
    id: "s6",
    description: "Dried chickpeas",
    quantity: "1 bag",
    list: "pantry",
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
  editor: false,
  editId: null,
  desc: "",
  qty: "",
  error: "",
  clear: false,
  del: false,
  status: PREVIEW ? "Preview data" : "Connecting…",
  install: false,
};
let installPrompt = null;
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
  trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 11v6M14 11v6"/>',
};
const I = (n) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[n] || ""}</svg>`;
const jar = (x) =>
  `<div class="jar-mark${x ? " small" : ""}" aria-hidden="true"><span></span></div>`;
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
const rowColors = (list, index, total) => {
  const base = gradientColor(PALETTES[list], gradientPosition(index, total));
  return {
    top: mixColor(base, "#ffffff", 0.0225),
    bottom: mixColor(base, "#000000", 0.0225),
  };
};
const active = () =>
    s.items
      .filter((x) => x.list === "grocery" && !x.completed)
      .sort((a, b) => b.createdAt - a.createdAt),
  done = () =>
    s.items
      .filter((x) => x.list === "grocery" && x.completed)
      .sort((a, b) => b.updatedAt - a.updatedAt),
  pantry = () =>
    s.items
      .filter(
        (x) =>
          x.list === "pantry" &&
          x.description.toLowerCase().includes(s.query.trim().toLowerCase()),
      )
      .sort((a, b) => a.description.localeCompare(b.description));
function local(action, item, patch = {}) {
  const now = Date.now();
  if (action === "add") s.items = [{ ...item, ...patch }, ...s.items];
  else if (["delete", "cleared"].includes(action))
    s.items = s.items.filter((x) => x.id !== item.id);
  else
    s.items = s.items.map((x) =>
      x.id === item.id ? { ...x, ...patch, updatedAt: now } : x,
    );
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
      toList: patch.list || "",
    },
    ...s.logs,
  ];
}
function gate() {
  root.innerHTML = `<main class="gate"><div class="gate-card">${jar()}<h1>Jamjar</h1>${!s.authKnown ? `<p>${s.ready ? "Sign in with Google to share your grocery list and pantry." : "Opening your lists…"}</p>` : ""}<button class="btn google-button" id="signin" ${!s.ready ? "disabled" : ""}>Sign in with Google</button>${s.authKnown ? `<small>${e(s.status)}</small>` : ""}</div></main>`;
  document
    .getElementById("signin")
    ?.addEventListener("click", () => window.JamjarFirebase?.signIn());
}
function renderHistory() {
  const h = [...s.logs]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(
      (l) =>
        `<li><span class="history-icon">${I(l.action.includes("pantry") ? "package" : l.action.includes("grocery") || l.action === "bought" ? "basket" : l.action === "deleted" || l.action === "cleared" ? "trash" : "check")}</span><div><strong>${e(l.actorName || String(l.actorEmail || "").split("@")[0])} ${e(l.action.replaceAll("_", " "))} “${e(l.description)}”</strong><small>${e(new Date(l.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }))}${l.quantity ? ` · ${e(l.quantity)}` : ""}</small></div></li>`,
    )
    .join("");
  root.innerHTML = `<main class="history-screen"><header class="screen-head"><button id="back" aria-label="Back">${I("back")}</button><h1>History Log</h1></header><ol class="history-list">${h || '<li class="empty-state">Actions will appear here as you use Jamjar.</li>'}</ol></main>`;
  document.getElementById("back").onclick = () => window.window.history.back();
}
function row(x, i, n) {
  const colors = rowColors(x.list, i, n);
  return `<li class="swipe-wrap${x.completed ? " is-done" : ""}" data-id="${e(x.id)}"><div class="swipe-underlay${x.list === "pantry" ? " from-right" : ""}"><span class="under-icon">${I(x.list === "grocery" ? "check" : "basket")}</span><span class="under-label">${x.list === "grocery" ? (x.completed ? "Restore" : "Bought") : "Move to Grocery"}</span></div><button class="item-row" aria-label="Edit ${e(x.description)}" style="--band-top:${colors.top};--band-bottom:${colors.bottom}"><span class="item-copy"><span data-text="${e(x.description)}">${e(x.description)}</span>${x.list === "grocery" && x.quantity ? `<small>${e(x.quantity)}</small>` : ""}</span></button></li>`;
}
function editor() {
  if (!s.editor) return "";
  const x = s.items.find((i) => i.id === s.editId),
    hasQuantity = (x?.list || s.tab) === "grocery",
    opts = [
      ...new Set([
        ...s.items.map((i) => i.description),
        ...s.logs.map((l) => l.description),
      ]),
    ].sort();
  return `<div class="dialog-backdrop editor"><section class="dialog dialog-wrap" role="dialog" aria-modal="true"><button class="close-x" id="x" aria-label="Close editor">×</button><h2>${x ? "Edit item" : `Add to ${s.tab === "pantry" ? "Pantry" : "Grocery"}`}</h2><div class="form-stack"><label>Description<input id="desc" maxlength="120" list="suggestions" value="${e(s.desc)}" placeholder="What do you need?"></label><datalist id="suggestions">${opts.map((v) => `<option value="${e(v)}"></option>`).join("")}</datalist>${hasQuantity ? `<label>Quantity <span>Optional</span><input id="qty" maxlength="40" value="${e(s.qty)}" placeholder="2, 3 cans, 1 lb…"></label>` : ""}${s.error ? `<p class="form-error">${e(s.error)}</p>` : ""}</div><div class="dialog-actions">${x ? `<button class="btn ghost delete-button" id="delAsk">${I("trash")}Delete</button>` : ""}<button class="btn ghost" id="cancel">Cancel</button><button class="btn" id="save">Save</button></div></section></div>`;
}
function confirm() {
  if (s.clear) {
    const n = done().length;
    return `<div class="dialog-backdrop"><section class="dialog confirm-dialog"><h2>Clear completed items?</h2><p>This removes all ${n} completed ${n === 1 ? "item" : "items"} from Grocery. The action will remain in History.</p><div class="dialog-actions"><button class="btn ghost" id="clearNo">Cancel</button><button class="btn" id="clearYes">Clear completed</button></div></section></div>`;
  }
  if (s.del) {
    const x = s.items.find((i) => i.id === s.editId);
    return `<div class="dialog-backdrop"><section class="dialog confirm-dialog"><h2>Delete “${e(x?.description || "")}”?</h2><p>This removes it from Jamjar. The action will remain in History.</p><div class="dialog-actions"><button class="btn ghost" id="delNo">Cancel</button><button class="btn destructive" id="delYes">Delete</button></div></section></div>`;
  }
  return "";
}
function app() {
  const a = active(),
    d = done(),
    p = pantry(),
    u = s.actor || {},
    initial = (u.displayName?.[0] || u.email?.[0] || "?").toUpperCase();
  root.innerHTML = `<div class="app-shell tab-${s.tab}"><header class="topbar"><div class="brand">${jar(1)}<span>Jamjar</span></div><span class="sync-status">${e(s.status)}</span></header><main class="list-main"><section id="grocery-section" ${s.tab !== "grocery" ? "hidden" : ""}><ul class="item-list">${a.map((x, i) => row(x, i, a.length)).join("")}${a.length ? "" : '<li class="empty-state">Your grocery list is empty.</li>'}${d.map((x, i) => row(x, i, d.length)).join("")}</ul>${d.length ? `<div class="clear-pull" id="clearPull" aria-hidden="true">${I("trash")}<span>Pull up to clear completed</span></div>` : ""}</section><section id="pantry-section" ${s.tab !== "pantry" ? "hidden" : ""}><label class="search-field">${I("search")}<span class="sr-only">Search Pantry</span><input id="search" value="${e(s.query)}" placeholder="Filter pantry"></label><ul class="item-list">${p.map((x, i) => row(x, i, p.length)).join("")}${p.length ? "" : `<li class="empty-state">${s.query ? "No pantry items match." : "Your pantry is empty."}</li>`}</ul></section><section ${s.tab !== "settings" ? "hidden" : ""}><div class="settings-page"><button class="settings-row" id="hist"><span class="setting-icon">${I("history")}</span><span><strong>History Log</strong><small>See every change and who made it</small></span><span>›</span></button><div class="settings-row static"><span class="avatar">${e(initial)}</span><span><strong>${e(u.displayName || u.email || "")}</strong><small>${e(u.email || "")}</small></span></div>${s.install ? `<button class="settings-row" id="install"><span class="setting-icon">${I("package")}</span><span><strong>Install Jamjar</strong><small>Add it to this device</small></span><span>›</span></button>` : ""}<button class="settings-row danger-row" id="signout"><span class="setting-icon">${I("logout")}</span><span><strong>Sign out</strong><small>Keep shared data in Jamjar</small></span></button></div></section></main>${s.tab !== "settings" ? `<button class="fab" id="add">${I("plus")}</button>` : ""}<nav class="bottom-tabs"><button class="tab-trigger ${s.tab === "grocery" ? "active" : ""}" data-tab="grocery">${I("basket")}<span>Grocery</span>${a.length ? `<b>${a.length}</b>` : ""}</button><button class="tab-trigger ${s.tab === "pantry" ? "active" : ""}" data-tab="pantry">${I("package")}<span>Pantry</span></button><button class="tab-trigger ${s.tab === "settings" ? "active" : ""}" data-tab="settings">${I("settings")}<span>Settings</span></button></nav></div>${editor()}${confirm()}`;
  bind();
}
function captureLayout() {
  const positions = new Map(),
    states = new Map();
  document.querySelectorAll(".swipe-wrap[data-id]").forEach((row) => {
    positions.set(row.dataset.id, row.getBoundingClientRect().top);
    states.set(row.dataset.id, row.classList.contains("is-done"));
  });
  return { positions, states };
}
function animateLayout(previous) {
  if (!previous.positions.size) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".swipe-wrap[data-id]").forEach((row) => {
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
function render() {
  const previous = captureLayout();
  if (!s.authKnown && !PREVIEW) return gate();
  if (!s.actor && !PREVIEW) return gate();
  if (s.history) return renderHistory();
  app();
  animateLayout(previous);
}
function open(x = null) {
  s.editId = x?.id || null;
  s.desc = x?.description || "";
  s.qty = x?.list === "pantry" ? "" : x?.quantity || "";
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
  if (!fromPop && window.history.state?.editor) window.history.back();
  else render();
}
async function save() {
  const desc = s.desc.trim(),
    x = s.items.find((i) => i.id === s.editId),
    list = x?.list || (s.tab === "pantry" ? "pantry" : "grocery"),
    qty = list === "pantry" ? "" : s.qty.trim();
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
    s.error = `${desc} is already in ${list === "grocery" ? "Grocery" : "Pantry"}.`;
    return render();
  }
  try {
    if (x) {
      if (PREVIEW) local("updated", x, { description: desc, quantity: qty });
      else
        await window.JamjarFirebase?.updateItem(x.id, {
          description: desc,
          quantity: qty,
        });
    } else {
      const n = {
        id: crypto.randomUUID(),
        description: desc,
        quantity: qty,
        list,
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      if (PREVIEW) local("add", n);
      else
        await window.JamjarFirebase?.addItem({
          description: desc,
          quantity: qty,
          list,
        });
    }
    close();
  } catch (error) {
    console.error("Jamjar save failed", error);
    s.error =
      error?.code === "permission-denied"
        ? "Jamjar’s Firestore rules need to be published."
        : "Jamjar couldn’t save that change. Try again.";
    render();
  }
}
async function toggle(x) {
  if (PREVIEW) {
    local(x.completed ? "restored" : "bought", x, { completed: !x.completed });
    render();
  } else await window.JamjarFirebase?.toggleBought(x);
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
    s.status = `Already in ${to === "pantry" ? "Pantry" : "Grocery"}`;
    return render();
  }
  if (PREVIEW) {
    local(to === "pantry" ? "moved_to_pantry" : "moved_to_grocery", x, {
      list: to,
      completed: false,
      quantity: "",
    });
    render();
  } else await window.JamjarFirebase?.moveItem(x, to);
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
  else render();
}
async function clearAll() {
  const list = done();
  if (PREVIEW) list.forEach((x) => local("cleared", x));
  else await window.JamjarFirebase?.clearCompleted(list);
  s.clear = false;
  render();
}
function swipes() {
  document.querySelectorAll(".swipe-wrap").forEach((w) => {
    const b = w.querySelector(".item-row"),
      u = w.querySelector(".swipe-underlay"),
      l = w.querySelector(".under-label"),
      ii = w.querySelector(".under-icon"),
      x = s.items.find((v) => v.id === w.dataset.id);
    let start = 0,
      startY = 0,
      last = 0,
      drag = false,
      horizontal = false,
      vertical = false;
    if (!x) return;
    b.onpointerdown = (q) => {
      if (q.button !== 0) return;
      start = q.clientX;
      startY = q.clientY;
      last = 0;
      drag = false;
      horizontal = false;
      vertical = false;
      b.setPointerCapture(q.pointerId);
    };
    b.onpointermove = (q) => {
      if (!b.hasPointerCapture(q.pointerId) || vertical) return;
      const raw = q.clientX - start,
        y = q.clientY - startY,
        dir = x.list === "grocery" ? 1 : -1,
        next = raw * dir > 0 ? raw : raw * 0.08;
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
      drag = true;
      b.classList.add("dragging");
      b.style.transform = `translateX(${next}px)`;
      w.classList.toggle(
        "swiping-right",
        x.list === "grocery" && next > 12,
      );
      w.classList.toggle(
        "swiping-left",
        x.list === "pantry" && next < -12,
      );
      const transfer =
        x.list === "grocery" && Math.abs(next) >= innerWidth * 0.5;
      u.classList.toggle("is-transfer", transfer);
      l.textContent = transfer
        ? x.list === "grocery"
          ? "Move to Pantry"
          : "Move to Grocery"
        : x.list === "grocery"
          ? x.completed
            ? "Restore"
            : "Bought"
          : "Move to Grocery";
      ii.innerHTML = I(
        transfer ? "archive" : x.list === "grocery" ? "check" : "basket",
      );
    };
    b.onpointerup = (q) => {
      if (b.hasPointerCapture(q.pointerId))
        b.releasePointerCapture(q.pointerId);
      const d = Math.abs(last);
      b.classList.remove("dragging");
      w.classList.remove("swiping-right", "swiping-left");
      if (x.list === "grocery" && d >= innerWidth * 0.5) {
        b.classList.add("completing");
        navigator.vibrate?.(12);
        return setTimeout(() => move(x, "pantry"), 180);
      }
      if (d >= 64) {
        b.classList.add(x.list === "grocery" ? "completing" : "moving-left");
        navigator.vibrate?.(12);
        return setTimeout(
          () => (x.list === "grocery" ? toggle(x) : move(x, "grocery")),
          180,
        );
      }
      b.style.transform = "";
    };
    b.onpointercancel = () => {
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
  const section = document.getElementById("grocery-section"),
    indicator = document.getElementById("clearPull");
  if (!section || !indicator) return;
  const threshold = 72;
  let startX = 0,
    startY = 0,
    amount = 0,
    tracking = false;
  const atBottom = () =>
    innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
  const nearListEnd = (y) => {
    const bottom = section.getBoundingClientRect().bottom;
    return y >= Math.min(innerHeight - 150, bottom - 120);
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
      s.clear = true;
      render();
    }
  };
  section.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      if (!touch || !atBottom() || !nearListEnd(touch.clientY)) return;
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
      !nearListEnd(event.clientY)
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
        s.tab = b.dataset.tab;
        render();
      }),
  );
  document.getElementById("add")?.addEventListener("click", () => open());
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
    render();
    const z = document.getElementById("search");
    z?.focus();
    z?.setSelectionRange(s.query.length, s.query.length);
  });
  document
    .getElementById("desc")
    ?.addEventListener("input", (q) => (s.desc = q.target.value));
  document
    .getElementById("qty")
    ?.addEventListener("input", (q) => (s.qty = q.target.value));
  document.getElementById("save")?.addEventListener("click", save);
  document.getElementById("cancel")?.addEventListener("click", () => close());
  document.getElementById("x")?.addEventListener("click", () => close());
  document.getElementById("delAsk")?.addEventListener("click", () => {
    s.del = true;
    render();
  });
  document.getElementById("clearNo")?.addEventListener("click", () => {
    s.clear = false;
    render();
  });
  document.getElementById("clearYes")?.addEventListener("click", clearAll);
  document.getElementById("delNo")?.addEventListener("click", () => {
    s.del = false;
    render();
  });
  document.getElementById("delYes")?.addEventListener("click", remove);
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
    s.items = q.detail.items || [];
    s.logs = q.detail.history || [];
    s.status = q.detail.fromCache
      ? "Offline · changes will sync"
      : "Up to date";
    render();
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
      description: "Add an item to the shared Grocery or Pantry list.",
      inputSchema: {
        type: "object",
        properties: {
          description: { type: "string", minLength: 1, maxLength: 120 },
          quantity: { type: "string", maxLength: 40 },
          list: { type: "string", enum: ["grocery", "pantry"] },
        },
        required: ["description", "list"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (v) => {
        const d = v?.description?.trim(),
          list = v?.list;
        if (!d || !["grocery", "pantry"].includes(list))
          throw Error("A valid description and list are required.");
        if (
          s.items.some(
            (i) =>
              i.list === list &&
              i.description.toLowerCase() === d.toLowerCase(),
          )
        )
          throw Error("That item is already on the list.");
        const quantity = list === "pantry" ? "" : v?.quantity?.trim() || "";
        if (PREVIEW)
          local("add", {
            id: crypto.randomUUID(),
            description: d,
            quantity,
            list,
            completed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        else
          await window.JamjarFirebase?.addItem({
            description: d,
            quantity,
            list,
          });
        render();
        return { added: d, list };
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
            .map((i) => ({ description: i.description })),
        };
      },
    },
    { signal: ac.signal },
  );
}
render();
