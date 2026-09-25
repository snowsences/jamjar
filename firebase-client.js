import { initializeApp } from "./vendor/firebase-app.js";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "./vendor/firebase-auth.js";

const CONFIG = {
  apiKey: "AIzaSyA30wwn_rx-LGPew8UUmr_bnZ8pFsz-WbY",
  authDomain: "jamjar-ec8c6.firebaseapp.com",
  projectId: "jamjar-ec8c6",
  storageBucket: "jamjar-ec8c6.firebasestorage.app",
  messagingSenderId: "281154655967",
  appId: "1:281154655967:web:686cdccf976ee98d87bb6a",
};
const HISTORY_LIMIT = 100;
const app = initializeApp(CONFIG, "jamjar");
const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});
// Firestore is the largest bundle; load it alongside auth instead of in front
// of it so the sign-in screen doesn't wait on it.
const ready = import("./vendor/firebase-firestore.js").then((fs) => {
  const db = fs.initializeFirestore(app, {
    localCache: fs.persistentLocalCache({
      tabManager: fs.persistentMultipleTabManager(),
    }),
  });
  return {
    fs,
    db,
    itemsRef: fs.collection(db, "jamjarHouseholds", "shared", "items"),
    historyRef: fs.collection(db, "jamjarHouseholds", "shared", "history"),
  };
});
let items = [];
let history = [];
let fromCache = false;
let stops = [];
let session = 0;
const fire = (name, detail) =>
  window.dispatchEvent(new CustomEvent(`jamjar:${name}`, { detail }));
const actor = () => ({
  actorUid: auth.currentUser.uid,
  actorEmail: auth.currentUser.email || "",
  actorName:
    auth.currentUser.displayName ||
    auth.currentUser.email?.split("@")[0] ||
    "Someone",
});
const itemSnapshot = (item) => ({
  id: item.id,
  description: item.description || "",
  quantity: item.quantity || "",
  list: item.list || "grocery",
  completed: Boolean(item.completed),
  category: item.category || "",
  createdAt: item.createdAt || Date.now(),
  updatedAt: item.updatedAt || Date.now(),
  listAddedAt: item.listAddedAt || item.createdAt || Date.now(),
});
const sameItem = (a, b) =>
  a.description === b.description &&
  a.quantity === b.quantity &&
  a.list === b.list &&
  a.completed === b.completed &&
  a.category === b.category;
const historyPayload = (action, item, extra = {}) => ({
  action,
  description: item.description,
  quantity: item.quantity || "",
  fromList: item.list || "",
  toList: extra.toList || "",
  createdAt: Date.now(),
  beforeItems: (extra.beforeItems || []).map(itemSnapshot),
  afterItems: (extra.afterItems || []).map(itemSnapshot),
  ...(extra.targetAction ? { targetAction: extra.targetAction } : {}),
  ...(extra.targetHistoryId ? { targetHistoryId: extra.targetHistoryId } : {}),
  ...actor(),
});
const writeError = (error) =>
  error?.code === "permission-denied"
    ? "This account can’t save to Jamjar."
    : "A change couldn’t be saved. Try again.";
// Writes the item change and its history entry in one batch. Resolves as soon
// as the batch is in the local cache (so it works offline) and returns the
// history entry, which can be passed to undoAction. Server rejections are
// reported via the jamjar:write-error event; Firestore rolls the cache back.
const commitItems = async (make, log) => {
  if (!auth.currentUser) throw Error("Sign in to save.");
  const { fs, db, itemsRef, historyRef } = await ready;
  const batch = fs.writeBatch(db);
  make(batch, (id) => fs.doc(itemsRef, id));
  const entry = {
    id: crypto.randomUUID(),
    ...historyPayload(log.action, log.item, log.extra),
  };
  const { id, ...payload } = entry;
  batch.set(fs.doc(historyRef, id), payload);
  batch.commit().catch((error) => {
    console.error("Jamjar write failed", error);
    fire("write-error", writeError(error));
  });
  return entry;
};
// Read by app.js if the module finished loading after these events fired.
export const current = { user: undefined, data: null };
function emit() {
  current.data = { items, history, fromCache };
  fire("data", current.data);
}

onAuthStateChanged(auth, async (user) => {
  const run = ++session;
  stops.forEach((stop) => stop());
  stops = [];
  current.user = user
    ? {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName,
        photoURL: user.photoURL,
      }
    : null;
  fire("auth", current.user);
  if (!user) return;
  const { fs, itemsRef, historyRef } = await ready;
  if (run !== session) return;
  stops.push(
    fs.onSnapshot(
      itemsRef,
      { includeMetadataChanges: true },
      (snap) => {
        items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        fromCache = snap.metadata.fromCache;
        emit();
      },
      (err) =>
        fire(
          "error",
          err.code === "permission-denied"
            ? "This Google account is not authorized for Jamjar."
            : "Sync is unavailable.",
        ),
    ),
  );
  stops.push(
    fs.onSnapshot(
      fs.query(
        historyRef,
        fs.orderBy("createdAt", "desc"),
        fs.limit(HISTORY_LIMIT),
      ),
      (snap) => {
        history = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          actorEmail: d.data().actorEmail || "",
          actorName: d.data().actorName || "",
        }));
        emit();
      },
      () => fire("error", "History is unavailable."),
    ),
  );
});

// Checks the cached copy of each item still matches the action being undone,
// then writes the reverse. Used offline, where a transaction can't run; the
// batch syncs when the connection returns.
const undoLocally = (before, after, beforeIds, afterById, ids, item, log) => {
  ids.forEach((id) => {
    const expected = afterById.get(id),
      found = items.find((candidate) => candidate.id === id),
      now = found ? itemSnapshot(found) : null;
    if (expected ? !now || !sameItem(now, expected) : now)
      throw Object.assign(Error("That changed since, so it can’t be undone."), {
        code: "jamjar/conflict",
      });
  });
  return commitItems(
    (batch, ref) => {
      after.forEach((entry) => {
        if (!beforeIds.has(entry.id)) batch.delete(ref(entry.id));
      });
      before.forEach((entry) => batch.set(ref(entry.id), entry));
    },
    {
      action: "undid",
      item,
      extra: {
        beforeItems: after,
        afterItems: before,
        targetAction: log.action || "changed",
        targetHistoryId: log.id,
      },
    },
  );
};

export const api = {
  signIn: () => signInWithPopup(auth, new GoogleAuthProvider()),
  signOut: () => signOut(auth),
  addItem: (input) => {
    const id = input.id || crypto.randomUUID(),
      now = Date.now(),
      item = {
        ...input,
        id,
        quantity: input.quantity || "",
        completed: false,
        createdAt: now,
        updatedAt: now,
        listAddedAt: now,
      };
    return commitItems((batch, ref) => batch.set(ref(id), item), {
      action: "added",
      item,
      extra: { beforeItems: [], afterItems: [item] },
    });
  },
  updateItem: (id, input) => {
    const old = items.find((i) => i.id === id),
      next = {
        ...old,
        ...input,
        quantity: input.quantity || "",
        updatedAt: Date.now(),
      };
    return commitItems((batch, ref) => batch.set(ref(id), next), {
      action: "updated",
      item: next,
      extra: { beforeItems: old ? [old] : [], afterItems: [next] },
    });
  },
  deleteItem: (item) =>
    commitItems((batch, ref) => batch.delete(ref(item.id)), {
      action: "deleted",
      item,
      extra: { beforeItems: [item], afterItems: [] },
    }),
  toggleBought: (item) => {
    const next = {
      ...item,
      completed: !item.completed,
      updatedAt: Date.now(),
      ...(!item.completed ? {} : { listAddedAt: Date.now() }),
    };
    return commitItems((batch, ref) => batch.set(ref(item.id), next), {
      action: next.completed ? "bought" : "restored",
      item,
      extra: { beforeItems: [item], afterItems: [next] },
    });
  },
  moveItem: (item, toList) => {
    const next = {
      ...item,
      list: toList,
      completed: false,
      quantity: "",
      category: item.category || (toList === "pantry" ? "Other" : ""),
      listAddedAt: Date.now(),
      updatedAt: Date.now(),
    };
    return commitItems((batch, ref) => batch.set(ref(item.id), next), {
      action: toList === "pantry" ? "moved_to_pantry" : "moved_to_grocery",
      item,
      extra: { toList, beforeItems: [item], afterItems: [next] },
    });
  },
  clearCompleted: (done, sourceList) => {
    const item = {
      description: `${done.length} completed ${done.length === 1 ? "item" : "items"}`,
      quantity: "",
      list: sourceList,
    };
    return commitItems(
      (batch, ref) => done.forEach((item) => batch.delete(ref(item.id))),
      {
        action: "cleared_completed",
        item,
        extra: { beforeItems: done, afterItems: [] },
      },
    );
  },
  // Online, runs as a transaction so an undo never overwrites a change someone
  // made after the original action. Offline, checks against the local cache.
  undoAction: async (log) => {
    if (!auth.currentUser) throw Error("Sign in to save.");
    const { fs, db, itemsRef, historyRef } = await ready;
    const before = (log.beforeItems || []).map(itemSnapshot),
      after = (log.afterItems || []).map(itemSnapshot),
      beforeIds = new Set(before.map((item) => item.id)),
      afterById = new Map(after.map((item) => [item.id, item])),
      ids = [...new Set([...beforeIds, ...afterById.keys()])],
      item = {
        description: log.description || "action",
        quantity: "",
        list: log.fromList || "",
      };
    const offline = () =>
      undoLocally(before, after, beforeIds, afterById, ids, item, log);
    if (!navigator.onLine || fromCache) return offline();
    try {
      // Transactions read from the server, so let the action being undone
      // (possibly still queued locally) land first.
      await Promise.race([
        fs.waitForPendingWrites(db),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(Object.assign(Error(), { code: "unavailable" })),
            10000,
          ),
        ),
      ]);
      await fs.runTransaction(db, async (tx) => {
        const snaps = await Promise.all(
          ids.map((id) => tx.get(fs.doc(itemsRef, id))),
        );
        snaps.forEach((snap, index) => {
          const expected = afterById.get(ids[index]),
            current = snap.exists()
              ? itemSnapshot({ id: snap.id, ...snap.data() })
              : null;
          if (expected ? !current || !sameItem(current, expected) : current)
            throw Object.assign(Error("Changed since"), {
              code: "jamjar/conflict",
            });
        });
        after.forEach((item) => {
          if (!beforeIds.has(item.id)) tx.delete(fs.doc(itemsRef, item.id));
        });
        before.forEach((item) => tx.set(fs.doc(itemsRef, item.id), item));
        tx.set(
          fs.doc(historyRef, crypto.randomUUID()),
          historyPayload("undid", item, {
            beforeItems: after,
            afterItems: before,
            targetAction: log.action || "changed",
            targetHistoryId: log.id,
          }),
        );
      });
    } catch (error) {
      if (error?.code === "jamjar/conflict")
        throw Object.assign(
          Error("That changed since, so it can’t be undone."),
          { code: error.code },
        );
      if (!navigator.onLine || error?.code === "unavailable") return offline();
      throw error;
    }
  },
};
