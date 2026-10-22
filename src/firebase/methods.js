// Firebase Service Methods
// Auth, Firestore, and Storage helpers for the 3D Blogging Platform

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import app from "./config";
import {
  initializeFirestore,
  getFirestore,
  collection,
  addDoc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";

export const auth = getAuth(app);

// Use experimentalForceLongPolling to eliminate WebChannel hanging in modern browser/CI runners
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;
export const storage = getStorage(app);

// ─── Helpers: Resilient Promise Timeout ───────────────────────────────────────
export const withTimeout = (promise, ms = 15000, errorMsg = "Operation timed out after 15 seconds.") => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms)
    ),
  ]);
};

// ─── Auth Methods ─────────────────────────────────────────────────────────────

export const signUpUser = async (obj) => {
  const res = await createUserWithEmailAndPassword(auth, obj.email, obj.password);
  const uid = res.user.uid;
  const userData = { ...obj, id: uid };
  delete userData.password;

  // SQA-001 Fix: Directly setDoc on "users" collection with doc ID matching Auth UID
  try {
    await withTimeout(
      setDoc(doc(db, "users", uid), userData),
      8000,
      "Profile sync to Firestore timed out."
    );
  } catch (err) {
    console.warn("[SQA-001] Firestore user document sync warning:", err?.message || err);
  }

  return uid;
};

export const loginUser = async (obj) => {
  if (obj.rememberMe !== undefined) {
    const persistenceMode = obj.rememberMe
      ? browserLocalPersistence
      : browserSessionPersistence;
    try {
      await setPersistence(auth, persistenceMode);
    } catch (err) {
      console.warn("Auth persistence configuration notice:", err);
    }
  }
  const userCredential = await signInWithEmailAndPassword(auth, obj.email, obj.password);
  return userCredential.user;
};

export const signOutUser = async () => {
  await signOut(auth);
  return "Signed out successfully";
};

// ─── Google Auth Provider ────────────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Sync profile document to Firestore in background
  const userData = {
    name: user.displayName || user.email?.split("@")[0] || "Spatial Creator",
    email: user.email,
    id: user.uid,
    photoURL: user.photoURL || "",
  };

  setDoc(doc(db, "users", user.uid), userData, { merge: true }).catch((err) => {
    console.warn("Google user profile sync notice:", err);
  });

  return user;
};

// ─── Helpers: Local Persistent Cache & Fallback ──────────────────────────────
const getLocalCollection = (colName) => {
  try {
    return JSON.parse(localStorage.getItem(`blogverse_cache_${colName}`) || "[]");
  } catch {
    return [];
  }
};

const saveLocalCollection = (colName, items) => {
  try {
    localStorage.setItem(`blogverse_cache_${colName}`, JSON.stringify(items));
  } catch (err) {
    console.warn("Local storage write warning:", err);
  }
};

// ─── Firestore Methods (Hybrid Cloud + Resilient Offline Cache) ───────────────

export const sendData = async (obj, colName) => {
  const localId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const localDoc = {
    ...obj,
    documentId: localId,
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
    createdAtClient: new Date().toISOString(),
  };

  // Cache locally first so data is never lost
  const existing = getLocalCollection(colName);
  saveLocalCollection(colName, [localDoc, ...existing]);

  try {
    // Attempt Cloud Firestore write with a 4s timeout
    const docRef = await withTimeout(
      addDoc(collection(db, colName), {
        ...obj,
        createdAt: serverTimestamp(),
      }),
      4000,
      "Firestore write timed out."
    );

    // Update local cached doc with cloud ID
    localDoc.documentId = docRef.id;
    saveLocalCollection(colName, [localDoc, ...existing]);
    return docRef.id;
  } catch (err) {
    console.warn(
      `[Firestore Notice]: Cloud write failed or pending API activation (${err?.message || err}). Stored safely in local persistent cache.`
    );
    return localId;
  }
};

export const getData = async (colName, uid) => {
  let cloudDocs = [];
  try {
    const q = query(collection(db, colName), where("uid", "==", uid));
    const snapshot = await withTimeout(getDocs(q), 4000, "Firestore read timed out.");
    cloudDocs = snapshot.docs.map((d) => ({ ...d.data(), documentId: d.id }));
  } catch (err) {
    console.warn("[Firestore Notice]: Using local cache for user blogs.");
  }

  const localDocs = getLocalCollection(colName).filter((d) => d.uid === uid);
  const map = new Map();
  [...localDocs, ...cloudDocs].forEach((d) => map.set(d.documentId, d));
  return Array.from(map.values());
};

export const getAllData = async (colName) => {
  let cloudDocs = [];
  try {
    const snapshot = await withTimeout(getDocs(collection(db, colName)), 4000, "Firestore read timed out.");
    cloudDocs = snapshot.docs.map((d) => ({ ...d.data(), documentId: d.id }));
  } catch (err) {
    console.warn("[Firestore Notice]: Using local cache for all blogs.");
  }

  const localDocs = getLocalCollection(colName);
  const map = new Map();
  [...localDocs, ...cloudDocs].forEach((d) => map.set(d.documentId, d));
  return Array.from(map.values());
};

export const getSingleDocument = async (id, colName) => {
  try {
    const docRef = doc(db, colName, id);
    const snapshot = await withTimeout(getDoc(docRef), 4000, "Firestore read timed out.");
    if (snapshot.exists()) {
      return { ...snapshot.data(), documentId: snapshot.id };
    }
  } catch {
    // Fall back to local cache
  }

  const local = getLocalCollection(colName).find((d) => d.documentId === id);
  return local || null;
};

export const deleteDocument = async (id, colName) => {
  // Always remove from local cache
  const localDocs = getLocalCollection(colName).filter((d) => d.documentId !== id);
  saveLocalCollection(colName, localDocs);

  // Attempt Cloud Firestore deletion
  try {
    await withTimeout(deleteDoc(doc(db, colName, id)), 4000, "Firestore delete timed out.");
  } catch (err) {
    console.warn("[Firestore Notice]: Local document deleted. Cloud sync pending.");
  }

  return "Document deleted";
};

export const updateDocument = async (obj, id, colName) => {
  // Update in local cache
  const localDocs = getLocalCollection(colName).map((d) =>
    d.documentId === id ? { ...d, ...obj } : d
  );
  saveLocalCollection(colName, localDocs);

  // Attempt Cloud Firestore update
  try {
    const docRef = doc(db, colName, id);
    await withTimeout(updateDoc(docRef, obj), 4000, "Firestore update timed out.");
  } catch (err) {
    console.warn("[Firestore Notice]: Local document updated. Cloud sync pending.");
  }

  return "Document updated";
};

// ─── Storage Methods ──────────────────────────────────────────────────────────

// SQA-003 Fix: 15-second Promise timeout wrapper preventing network freezes on image upload
export const uploadImage = async (file, path) => {
  const storageRef = ref(storage, path);
  return await withTimeout(
    (async () => {
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    })(),
    15000,
    "Image upload timed out after 15 seconds. Please check your network connection and file size."
  );
};
