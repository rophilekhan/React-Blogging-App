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
  updateProfile,
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
  arrayUnion,
  arrayRemove,
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

// ─── Bookmark / Save Post Methods ───────────────────────────────────────────
export const getUserSavedPostIds = async (userId) => {
  if (!userId) return [];
  try {
    const userDocRef = doc(db, "users", userId);
    const snap = await withTimeout(getDoc(userDocRef), 3500, "Fetch saved posts timed out");
    if (snap.exists() && Array.isArray(snap.data()?.savedPosts)) {
      const list = snap.data().savedPosts;
      try {
        localStorage.setItem(`synthscroll_saved_${userId}`, JSON.stringify(list));
      } catch {}
      return list;
    }
  } catch (err) {
    console.warn("Using local cache for saved posts:", err);
  }

  try {
    return JSON.parse(localStorage.getItem(`synthscroll_saved_${userId}`) || "[]");
  } catch {
    return [];
  }
};

export const toggleSavePost = async (userId, postOrId) => {
  if (!userId || !postOrId) return { isSaved: false, savedPosts: [] };

  const targetId =
    typeof postOrId === "string"
      ? postOrId
      : postOrId.documentId || postOrId.id || postOrId.sourceUrl || postOrId.title;

  let currentSaved = [];
  try {
    currentSaved = JSON.parse(localStorage.getItem(`synthscroll_saved_${userId}`) || "[]");
  } catch {
    currentSaved = [];
  }

  // Find if already saved by matching string ID or object documentId/id/sourceUrl/title
  const existingIndex = currentSaved.findIndex((item) => {
    if (!item) return false;
    if (typeof item === "string") return item === targetId;
    if (typeof item === "object") {
      return (
        item.documentId === targetId ||
        item.id === targetId ||
        (postOrId.sourceUrl && item.sourceUrl === postOrId.sourceUrl) ||
        (postOrId.title && item.title === postOrId.title)
      );
    }
    return false;
  });

  const isAlreadySaved = existingIndex >= 0;
  let updatedSaved = [];

  if (isAlreadySaved) {
    // Remove from array
    updatedSaved = currentSaved.filter((_, idx) => idx !== existingIndex);
  } else {
    // If saving an external post object, store the complete post object with attribution
    const isExternalPost =
      typeof postOrId === "object" &&
      (postOrId.isExternal ||
        postOrId.sourceName ||
        postOrId.sourceUrl ||
        postOrId.uid === "system_seeder" ||
        String(postOrId.documentId || "").startsWith("api_"));

    const itemToSave = isExternalPost
      ? {
          documentId: postOrId.documentId || postOrId.id || `api_${Date.now()}`,
          id: postOrId.documentId || postOrId.id || `api_${Date.now()}`,
          title: postOrId.title || "External Story",
          content: postOrId.content || "",
          imageUrl: postOrId.imageUrl || postOrId.coverImage || "",
          coverImage: postOrId.imageUrl || postOrId.coverImage || "",
          authorName: postOrId.authorName || "Wire Desk",
          authorEmail: postOrId.authorEmail || "wire@synthscroll.dev",
          category: postOrId.category || "Technology",
          sourceUrl: postOrId.sourceUrl || postOrId.url || "",
          sourceName: postOrId.sourceName || "External Feed",
          isExternal: true,
          likes: postOrId.likes || 0,
          createdAtClient: postOrId.createdAtClient || new Date().toISOString(),
        }
      : typeof postOrId === "string"
      ? postOrId
      : postOrId.documentId || targetId;

    updatedSaved = [itemToSave, ...currentSaved];
  }

  try {
    localStorage.setItem(`synthscroll_saved_${userId}`, JSON.stringify(updatedSaved));
  } catch {}

  try {
    const userDocRef = doc(db, "users", userId);
    await withTimeout(
      setDoc(
        userDocRef,
        {
          savedPosts: updatedSaved,
        },
        { merge: true }
      ),
      4000,
      "Firestore save post timed out"
    );
  } catch (err) {
    console.warn("Cloud saved post sync warning:", err);
  }

  return { isSaved: !isAlreadySaved, savedPosts: updatedSaved };
};

// ─── Comments Subcollection Methods ─────────────────────────────────────────
export const addCommentToBlog = async (blogId, commentObj) => {
  const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newComment = {
    ...commentObj,
    id: commentId,
    createdAtClient: new Date().toISOString(),
  };

  // Cache locally
  try {
    const localComments = JSON.parse(
      localStorage.getItem(`synthscroll_comments_${blogId}`) || "[]"
    );
    localStorage.setItem(
      `synthscroll_comments_${blogId}`,
      JSON.stringify([newComment, ...localComments])
    );
  } catch {}

  try {
    const commentsCol = collection(db, "blogs", blogId, "comments");
    await withTimeout(
      addDoc(commentsCol, {
        ...commentObj,
        createdAt: serverTimestamp(),
      }),
      4000,
      "Add comment timed out"
    );
  } catch (err) {
    console.warn("Comment cloud sync warning:", err);
  }

  return newComment;
};

export const getBlogComments = async (blogId) => {
  let cloudComments = [];
  try {
    const commentsCol = collection(db, "blogs", blogId, "comments");
    const q = query(commentsCol, orderBy("createdAt", "desc"));
    const snap = await withTimeout(getDocs(q), 4000, "Get comments timed out");
    cloudComments = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  } catch (err) {
    // fallback to local
  }

  let localComments = [];
  try {
    localComments = JSON.parse(
      localStorage.getItem(`synthscroll_comments_${blogId}`) || "[]"
    );
  } catch {}

  const map = new Map();
  [...localComments, ...cloudComments].forEach((c) => {
    const key = c.id || `${c.uid}_${c.createdAtClient}`;
    map.set(key, c);
  });
  return Array.from(map.values()).sort((a, b) => {
    const timeA = a.createdAt?.seconds
      ? a.createdAt.seconds * 1000
      : new Date(a.createdAtClient || 0).getTime();
    const timeB = b.createdAt?.seconds
      ? b.createdAt.seconds * 1000
      : new Date(b.createdAtClient || 0).getTime();
    return timeB - timeA;
  });
};

// ─── User Profile Update Method ─────────────────────────────────────────────
export const updateUserProfileData = async (user, { displayName, photoURL }) => {
  if (!user) throw new Error("No authenticated user");

  const updateObj = {};
  if (displayName !== undefined) updateObj.displayName = displayName;
  if (photoURL !== undefined) updateObj.photoURL = photoURL;

  // 1. Update Firebase Auth user
  await updateProfile(user, updateObj);

  // 2. Update Firestore user document
  try {
    const userDocRef = doc(db, "users", user.uid);
    await withTimeout(
      setDoc(
        userDocRef,
        {
          name: displayName || user.displayName,
          photoURL: photoURL || user.photoURL,
          email: user.email,
        },
        { merge: true }
      ),
      4000,
      "Firestore user update timed out"
    );
  } catch (err) {
    console.warn("Profile document update warning:", err);
  }

  return user;
};
