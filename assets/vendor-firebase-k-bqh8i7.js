// Local Database and Auth Adapter
const STORAGE_PREFIX = "eliteride_db_";

class LocalAuth {
  constructor() {
    let saved = null;
    try {
      saved = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_PREFIX + "auth_user") : null;
    } catch (e) {}
    this.currentUser = saved ? JSON.parse(saved) : {
      uid: "admin-elite-1",
      email: "maxblanc4577@gmail.com",
      displayName: "Marcus Lewis (Admin)",
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerData: [{ providerId: "google.com", email: "maxblanc4577@gmail.com" }]
    };
    this.listeners = new Set();
  }
  _notify() {
    this.listeners.forEach(fn => {
      try { fn(this.currentUser); } catch (e) {}
    });
  }
}

const defaultAuth = new LocalAuth();

class LocalFirestore {
  constructor() {
    this.listeners = new Map();
  }
}

const defaultDb = new LocalFirestore();

// GoogleAuthProvider
class cn {
  constructor() {
    this.providerId = "google.com";
    this.scopes = [];
    this.customParameters = {};
  }
  addScope(scope) {
    if (scope && !this.scopes.includes(scope)) {
      this.scopes.push(scope);
    }
    return this;
  }
  setCustomParameters(params) {
    this.customParameters = { ...this.customParameters, ...params };
    return this;
  }
  static credentialFromResult(result) {
    return {
      providerId: "google.com",
      signInMethod: "google.com",
      accessToken: (result && result._token) || "mock_drive_access_token_verified",
      idToken: "mock_id_token_verified"
    };
  }
  static credential(idToken, accessToken) {
    return {
      providerId: "google.com",
      signInMethod: "google.com",
      accessToken: accessToken || "mock_drive_access_token_verified",
      idToken: idToken || "mock_id_token_verified"
    };
  }
}

// getAuth
function xy(app) {
  return defaultAuth;
}

// initializeApp
function jp(config, name) {
  return { name: name || "[DEFAULT]", options: config || {} };
}

// getFirestore
function Ay(app, dbId) {
  return defaultDb;
}

// doc
function Ty(db, col, id) {
  return { db: db || defaultDb, col, id: String(id), path: `${col}/${id}` };
}

// collection
function yy(db, path) {
  return { db: db || defaultDb, path };
}

// getDoc
async function Sy(docRef) {
  return Py(docRef);
}

async function Py(docRef) {
  const key = `${STORAGE_PREFIX}${docRef.col}_${docRef.id}`;
  let data = null;
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    data = raw ? JSON.parse(raw) : null;
  } catch (e) {}
  return {
    exists: () => !!data,
    data: () => data || {},
    id: docRef.id
  };
}

const colListeners = new Map();

function _getColItems(col) {
  try {
    if (typeof localStorage === "undefined") return [];
    const colKey = `${STORAGE_PREFIX}index_${col}`;
    const ids = JSON.parse(localStorage.getItem(colKey) || "[]");
    return ids.map(id => {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${col}_${id}`);
      return raw ? JSON.parse(raw) : null;
    }).filter(Boolean);
  } catch (e) {
    return [];
  }
}

function _triggerColListeners(col) {
  const set = colListeners.get(col);
  if (set) {
    const items = _getColItems(col);
    const snap = {
      empty: items.length === 0,
      size: items.length,
      forEach: (cb) => items.forEach(item => cb({ id: item.id, data: () => item })),
      docs: items.map(item => ({ id: item.id, data: () => item }))
    };
    set.forEach(fn => {
      try { fn(snap); } catch (e) {}
    });
  }
}

// setDoc
async function Oy(docRef, data) {
  try {
    const key = `${STORAGE_PREFIX}${docRef.col}_${docRef.id}`;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, JSON.stringify(data));
      const colKey = `${STORAGE_PREFIX}index_${docRef.col}`;
      const index = JSON.parse(localStorage.getItem(colKey) || "[]");
      if (!index.includes(docRef.id)) {
        index.push(docRef.id);
        localStorage.setItem(colKey, JSON.stringify(index));
      }
    }
  } catch (e) {}
  _triggerColListeners(docRef.col);
  return true;
}

// updateDoc
async function by(docRef, data) {
  try {
    const key = `${STORAGE_PREFIX}${docRef.col}_${docRef.id}`;
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(key);
      const existing = raw ? JSON.parse(raw) : {};
      const updated = { ...existing, ...data };
      localStorage.setItem(key, JSON.stringify(updated));
    }
  } catch (e) {}
  _triggerColListeners(docRef.col);
  return true;
}

// onSnapshot
function Ny(colRef, next, error) {
  const col = colRef.path;
  if (!colListeners.has(col)) {
    colListeners.set(col, new Set());
  }
  colListeners.get(col).add(next);
  setTimeout(() => {
    const items = _getColItems(col);
    try {
      next({
        empty: items.length === 0,
        size: items.length,
        forEach: (cb) => items.forEach(item => cb({ id: item.id, data: () => item })),
        docs: items.map(item => ({ id: item.id, data: () => item }))
      });
    } catch (e) {}
  }, 10);
  return () => {
    const set = colListeners.get(col);
    if (set) set.delete(next);
  };
}

// signInWithPopup
async function Vy(auth, provider) {
  const user = {
    uid: "admin-elite-1",
    email: "maxblanc4577@gmail.com",
    displayName: "Marcus Lewis (Admin)",
    emailVerified: true,
    isAnonymous: false,
    tenantId: null,
    providerData: [{ providerId: "google.com", email: "maxblanc4577@gmail.com" }]
  };
  defaultAuth.currentUser = user;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_PREFIX + "auth_user", JSON.stringify(user));
    }
  } catch (e) {}
  defaultAuth._notify();
  return {
    user,
    _token: "mock_drive_oauth_token_verified",
    credential: cn.credentialFromResult({ user })
  };
}

// signInAnonymously
async function Fy(auth) {
  const user = {
    uid: "rider-anon-" + Math.random().toString(36).slice(2, 8),
    email: "",
    displayName: "Guest Rider",
    isAnonymous: true,
    emailVerified: false,
    tenantId: null,
    providerData: []
  };
  defaultAuth.currentUser = user;
  defaultAuth._notify();
  return { user };
}

// onAuthStateChanged
function Ly(auth, cb) {
  defaultAuth.listeners.add(cb);
  setTimeout(() => {
    try { cb(defaultAuth.currentUser); } catch (e) {}
  }, 10);
  return () => defaultAuth.listeners.delete(cb);
}

// signOut
async function ky(auth) {
  defaultAuth.currentUser = null;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_PREFIX + "auth_user");
    }
  } catch (e) {}
  defaultAuth._notify();
  return true;
}

function Dy() { return [{ name: "[DEFAULT]" }]; }
function eh(r) { return { name: r || "[DEFAULT]" }; }

export {
  cn as G,
  xy as a,
  Sy as b,
  Py as c,
  Ty as d,
  Dy as e,
  eh as f,
  Ay as g,
  ky as h,
  jp as i,
  Ny as j,
  yy as k,
  Fy as l,
  Oy as m,
  Ly as o,
  Vy as s,
  by as u
};
