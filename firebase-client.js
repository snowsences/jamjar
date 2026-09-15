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
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  onSnapshot,
  writeBatch,
} from "./vendor/firebase-firestore.js";

const CONFIG = {
  apiKey: "AIzaSyA30wwn_rx-LGPew8UUmr_bnZ8pFsz-WbY",
  authDomain: "jamjar-ec8c6.firebaseapp.com",
  projectId: "jamjar-ec8c6",
  storageBucket: "jamjar-ec8c6.firebasestorage.app",
  messagingSenderId: "281154655967",
  appId: "1:281154655967:web:686cdccf976ee98d87bb6a",
};
const app = initializeApp(CONFIG, "jamjar");
const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
const itemsRef = collection(db, "jamjarHouseholds", "shared", "items");
const historyRef = collection(db, "jamjarHouseholds", "shared", "history");
let items = [];
let history = [];
let stops = [];
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
const record = (batch, action, item, extra = {}) => {
  const id = crypto.randomUUID();
  batch.set(doc(historyRef, id), {
    action,
    description: item.description,
    quantity: item.quantity || "",
    fromList: item.list || "",
    toList: extra.toList || "",
    createdAt: Date.now(),
    beforeItems: (extra.beforeItems || []).map(itemSnapshot),
    afterItems: (extra.afterItems || []).map(itemSnapshot),
    ...(extra.targetAction ? { targetAction: extra.targetAction } : {}),
    ...(extra.targetHistoryId
      ? { targetHistoryId: extra.targetHistoryId }
      : {}),
    ...actor(),
  });
};
const commit = async (make) => {
  if (!auth.currentUser) throw Error("Sign in to save.");
  const batch = writeBatch(db);
  make(batch);
  await batch.commit();
};
function emit(metadata) {
  window.JamjarData = {
    items,
    history,
    fromCache: metadata?.fromCache ?? false,
  };
  fire("data", window.JamjarData);
}

onAuthStateChanged(auth, (user) => {
  stops.forEach((stop) => stop());
  stops = [];
  window.JamjarCurrentUser = user
    ? {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName,
        photoURL: user.photoURL,
      }
    : null;
  fire("auth", window.JamjarCurrentUser);
  if (!user) return;
  stops.push(
    onSnapshot(
      itemsRef,
      { includeMetadataChanges: true },
      (snap) => {
        items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit(snap.metadata);
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
    onSnapshot(
      historyRef,
      { includeMetadataChanges: true },
      (snap) => {
        history = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          actorEmail: d.data().actorEmail || "",
          actorName: d.data().actorName || "",
        }));
        emit(snap.metadata);
      },
      () => fire("error", "History is unavailable."),
    ),
  );
});

window.JamjarFirebase = {
  signIn: () => signInWithPopup(auth, new GoogleAuthProvider()),
  signOut: () => signOut(auth),
  addItem: (input) =>
    commit((batch) => {
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
      batch.set(doc(itemsRef, id), item);
      record(batch, "added", item, { beforeItems: [], afterItems: [item] });
    }),
  updateItem: (id, input) =>
    commit((batch) => {
      const old = items.find((i) => i.id === id);
      const next = {
        ...old,
        ...input,
        quantity: input.quantity || "",
        updatedAt: Date.now(),
      };
      batch.set(doc(itemsRef, id), next);
      record(batch, "updated", next, {
        beforeItems: old ? [old] : [],
        afterItems: [next],
      });
    }),
  deleteItem: (item) =>
    commit((batch) => {
      batch.delete(doc(itemsRef, item.id));
      record(batch, "deleted", item, {
        beforeItems: [item],
        afterItems: [],
      });
    }),
  toggleBought: (item) =>
    commit((batch) => {
      const next = {
        ...item,
        completed: !item.completed,
        updatedAt: Date.now(),
        ...(!item.completed ? {} : { listAddedAt: Date.now() }),
      };
      batch.set(doc(itemsRef, item.id), next);
      record(batch, next.completed ? "bought" : "restored", item, {
        beforeItems: [item],
        afterItems: [next],
      });
    }),
  moveItem: (item, toList) =>
    commit((batch) => {
      const next = {
        ...item,
        list: toList,
        completed: false,
        quantity: "",
        category: item.category || (toList === "pantry" ? "Other" : ""),
        listAddedAt: Date.now(),
        updatedAt: Date.now(),
      };
      batch.set(doc(itemsRef, item.id), next);
      record(
        batch,
        toList === "pantry" ? "moved_to_pantry" : "moved_to_grocery",
        item,
        { toList, beforeItems: [item], afterItems: [next] },
      );
    }),
  clearCompleted: (done, sourceList) =>
    commit((batch) => {
      done.forEach((item) => {
        batch.delete(doc(itemsRef, item.id));
      });
      record(
        batch,
        "cleared_completed",
        {
          description: `${done.length} completed ${done.length === 1 ? "item" : "items"}`,
          quantity: "",
          list: sourceList,
        },
        { beforeItems: done, afterItems: [] },
      );
    }),
  undoAction: (log) =>
    commit((batch) => {
      const before = (log.beforeItems || []).map(itemSnapshot),
        after = (log.afterItems || []).map(itemSnapshot),
        beforeIds = new Set(before.map((item) => item.id));
      after.forEach((item) => {
        if (!beforeIds.has(item.id)) batch.delete(doc(itemsRef, item.id));
      });
      before.forEach((item) => batch.set(doc(itemsRef, item.id), item));
      record(
        batch,
        "undid",
        {
          description: log.description || "action",
          quantity: "",
          list: log.fromList || "",
        },
        {
          beforeItems: after,
          afterItems: before,
          targetAction: log.action || "changed",
          targetHistoryId: log.id,
        },
      );
    }),
};
fire("firebase-ready");
