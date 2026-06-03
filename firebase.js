const firebaseConfig = {
  apiKey: "AIzaSyC-vUrxs0mGYoOxvW7OcD8w-b5L_vjcr40",
  authDomain: "kristina-coach-website.firebaseapp.com",
  projectId: "kristina-coach-website",
  storageBucket: "kristina-coach-website.firebasestorage.app",
  messagingSenderId: "252574552077",
  appId: "1:252574552077:web:eccf8eede321d3172cc544"
};

const isFirebaseConfigured = !Object.values(firebaseConfig).some((value) =>
  String(value).startsWith("PASTE_")
);

let firestore = null;
let firebaseAuth = null;

if (isFirebaseConfigured && window.firebase) {
  firebase.initializeApp(firebaseConfig);
  firestore = firebase.firestore();

  if (firebase.auth) {
    firebaseAuth = firebase.auth();
  }
}

window.signInAdmin = async (email, password) => {
  if (!firebaseAuth) {
    throw new Error("Firebase Auth is not configured.");
  }

  return firebaseAuth.signInWithEmailAndPassword(email, password);
};

window.signOutAdmin = async () => {
  if (!firebaseAuth) {
    throw new Error("Firebase Auth is not configured.");
  }

  return firebaseAuth.signOut();
};

window.watchAdminAuth = (callback) => {
  if (!firebaseAuth) {
    callback(null);
    return () => {};
  }

  return firebaseAuth.onAuthStateChanged(callback);
};

window.saveReview = async (review) => {
  if (!firestore) {
    throw new Error("Firebase is not configured. Fill firebaseConfig in firebase.js.");
  }

  return firestore.collection("reviews").add({
    name: review.name,
    rating: review.rating,
    text: review.text,
    pageLanguage: review.pageLanguage,
    detectedLanguage: null,
    status: "pending",
    source: "website",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
};

window.loadReviews = async () => {
  if (!firestore) {
    throw new Error("Firebase is not configured. Fill firebaseConfig in firebase.js.");
  }

  const snapshot = await firestore
    .collection("reviews")
    .where("status", "==", "approved")
    .get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name || "",
        rating: data.rating || 0,
        text: data.text || "",
        language: data.detectedLanguage || data.pageLanguage || "",
        createdAt: data.createdAt,
      };
    })
    .sort((first, second) => {
      const firstTime = first.createdAt?.toMillis?.() || 0;
      const secondTime = second.createdAt?.toMillis?.() || 0;
      return secondTime - firstTime;
    });
};

window.loadAllReviews = async () => {
  if (!firestore) {
    throw new Error("Firebase is not configured. Fill firebaseConfig in firebase.js.");
  }

  const snapshot = await firestore.collection("reviews").get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name || "",
        rating: data.rating || 0,
        text: data.text || "",
        status: data.status || "pending",
        pageLanguage: data.pageLanguage || "",
        detectedLanguage: data.detectedLanguage || "",
        createdAt: data.createdAt,
      };
    })
    .sort((first, second) => {
      const statusOrder = { pending: 0, approved: 1 };
      const firstStatus = statusOrder[first.status] ?? 2;
      const secondStatus = statusOrder[second.status] ?? 2;

      if (firstStatus !== secondStatus) {
        return firstStatus - secondStatus;
      }

      const firstTime = first.createdAt?.toMillis?.() || 0;
      const secondTime = second.createdAt?.toMillis?.() || 0;
      return secondTime - firstTime;
    });
};

window.updateReviewStatus = async (reviewId, status) => {
  if (!firestore) {
    throw new Error("Firebase is not configured. Fill firebaseConfig in firebase.js.");
  }

  const update = { status };

  if (status === "approved") {
    update.approvedAt = firebase.firestore.FieldValue.serverTimestamp();
  }

  return firestore.collection("reviews").doc(reviewId).update(update);
};

window.deleteReview = async (reviewId) => {
  if (!firestore) {
    throw new Error("Firebase is not configured. Fill firebaseConfig in firebase.js.");
  }

  return firestore.collection("reviews").doc(reviewId).delete();
};
