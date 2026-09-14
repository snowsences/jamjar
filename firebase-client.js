import { initializeApp } from './vendor/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from './vendor/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, onSnapshot, writeBatch } from './vendor/firebase-firestore.js';

const CONFIG = { apiKey:'AIzaSyAmBvHoVCBm7mbOx_v9wPQeq-FwQ0F59eo', authDomain:'cream-corn-8e8ea.firebaseapp.com', projectId:'cream-corn-8e8ea', storageBucket:'cream-corn-8e8ea.firebasestorage.app', messagingSenderId:'323631470609', appId:'1:323631470609:web:f1547cb37954e4fa0bb9b0' };
const app = initializeApp(CONFIG, 'jamjar');
const auth = getAuth(app);
await setPersistence(auth, browserLocalPersistence);
const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
const itemsRef = collection(db, 'jamjarHouseholds', 'shared', 'items');
const historyRef = collection(db, 'jamjarHouseholds', 'shared', 'history');
let items = []; let history = []; let stops = [];
const fire = (name, detail) => window.dispatchEvent(new CustomEvent(`jamjar:${name}`, { detail }));
const actor = () => ({ actorUid: auth.currentUser.uid, actorEmail: auth.currentUser.email || '', actorName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Someone' });
const record = (batch, action, item, extra = {}) => { const id = crypto.randomUUID(); batch.set(doc(historyRef, id), { action, description:item.description, quantity:item.quantity || '', fromList:item.list || '', toList:extra.toList || '', createdAt:Date.now(), ...actor() }); };
const commit = async make => { if (!auth.currentUser) throw Error('Sign in to save.'); const batch = writeBatch(db); make(batch); await batch.commit(); };
function emit(metadata){ window.JamjarData = { items, history, fromCache: metadata?.fromCache ?? false }; fire('data', window.JamjarData); }

onAuthStateChanged(auth, user => {
  stops.forEach(stop => stop()); stops = [];
  window.JamjarCurrentUser = user ? { uid:user.uid, email:user.email || '', displayName:user.displayName, photoURL:user.photoURL } : null;
  fire('auth', window.JamjarCurrentUser);
  if (!user) return;
  stops.push(onSnapshot(itemsRef, { includeMetadataChanges:true }, snap => { items = snap.docs.map(d => ({ id:d.id, ...d.data() })); emit(snap.metadata); }, err => fire('error', err.code === 'permission-denied' ? 'This Google account is not authorized for Jamjar.' : 'Sync is unavailable.')));
  stops.push(onSnapshot(historyRef, { includeMetadataChanges:true }, snap => { history = snap.docs.map(d => ({ id:d.id, ...d.data(), actorEmail:d.data().actorEmail || '', actorName:d.data().actorName || '' })); emit(snap.metadata); }, () => fire('error', 'History is unavailable.')));
});

window.JamjarFirebase = {
  signIn: () => signInWithPopup(auth, new GoogleAuthProvider()),
  signOut: () => signOut(auth),
  addItem: input => commit(batch => { const id=crypto.randomUUID(), now=Date.now(), item={...input,id,quantity:input.quantity||'',completed:false,createdAt:now,updatedAt:now}; batch.set(doc(itemsRef,id),item); record(batch,'added',item); }),
  updateItem: (id,input) => commit(batch => { const old=items.find(i=>i.id===id); const next={...old,...input,quantity:input.quantity||'',updatedAt:Date.now()}; batch.set(doc(itemsRef,id),next); record(batch,'updated',next); }),
  deleteItem: item => commit(batch => { batch.delete(doc(itemsRef,item.id)); record(batch,'deleted',item); }),
  toggleBought: item => commit(batch => { const next={...item,completed:!item.completed,updatedAt:Date.now()}; batch.set(doc(itemsRef,item.id),next); record(batch,next.completed?'bought':'restored',item); }),
  moveItem: (item,toList) => commit(batch => { const next={...item,list:toList,completed:false,updatedAt:Date.now()}; batch.set(doc(itemsRef,item.id),next); record(batch,toList==='pantry'?'moved_to_pantry':'moved_to_grocery',item,{toList}); }),
  clearCompleted: done => commit(batch => done.forEach(item => { batch.delete(doc(itemsRef,item.id)); record(batch,'cleared',item); }))
};
fire('firebase-ready');
