import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// Users
export async function createUser(userData) {
  const docRef = await addDoc(collection(db, "users"), {
    ...userData,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserById(userId) {
  const docRef = doc(db, "users", userId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  return { id: snapshot.id, ...snapshot.data() };
}

// Listings
export async function createListing(listingData) {
  const docRef = await addDoc(collection(db, "listings"), {
    ...listingData,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function getAllListings() {
  const snapshot = await getDocs(collection(db, "listings"));
  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

export async function getListingsBySeller(sellerId) {
  const q = query(collection(db, "listings"), where("seller_id", "==", sellerId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

export async function updateListing(listingId, updatedFields) {
  const docRef = doc(db, "listings", listingId);
  await updateDoc(docRef, {
    ...updatedFields,
    updated_at: serverTimestamp(),
  });
}

export async function deleteListing(listingId) {
  const docRef = doc(db, "listings", listingId);
  await deleteDoc(docRef);
}