// services/listings.js
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

/*
Current Firestore listing schema:

{
  Brand: string,
  ClothingType: string,
  Color: string,
  ConditionRating: string,
  CreatedAt: timestamp,
  Description: string,
  ImageURLs: string[],
  Name: string,
  Price: number,
  SellerID: string,
  Size: string,
  Status: string,
  Tags: string[],
  UpdatedAt: timestamp
}
*/

// Create a new listing
export async function createListing(listingData, userId) {
  try {
    const docRef = await addDoc(collection(db, "listings"), {
      Brand: listingData.Brand ?? "",
      ClothingType: listingData.ClothingType ?? "",
      Color: listingData.Color ?? "",
      ConditionRating: listingData.ConditionRating ?? "",
      Description: listingData.Description ?? "",
      ImageURLs: Array.isArray(listingData.ImageURLs) ? listingData.ImageURLs : [],
      Name: listingData.Name ?? "",
      Price: Number(listingData.Price) || 0,
      SellerID: userId,
      Size: listingData.Size ?? "",
      Status: listingData.Status ?? "Available",
      Tags: Array.isArray(listingData.Tags) ? listingData.Tags : [],
      CreatedAt: serverTimestamp(),
      UpdatedAt: serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating listing:", error);
    return { success: false, error };
  }
}

// Get all available listings
export async function getAvailableListings() {
  try {
    const q = query(
      collection(db, "listings"),
      where("Status", "==", "Available"),
      orderBy("CreatedAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
  } catch (error) {
    console.error("Error fetching available listings:", error);
    return [];
  }
}

// Get newest listings with a limit
export async function getNewListings(maxCount = 6) {
  try {
    const q = query(
      collection(db, "listings"),
      where("Status", "==", "Available"),
      orderBy("CreatedAt", "desc"),
      limit(maxCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
  } catch (error) {
    console.error("Error fetching new listings:", error);
    return [];
  }
}

// Get one listing by document ID
export async function getListingById(listingId) {
  try {
    const docRef = doc(db, "listings", listingId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  } catch (error) {
    console.error("Error fetching listing by ID:", error);
    return null;
  }
}

// Get listings for one seller
export async function getListingsBySeller(userId) {
  try {
    const q = query(
      collection(db, "listings"),
      where("SellerID", "==", userId),
      orderBy("CreatedAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
  } catch (error) {
    console.error("Error fetching seller listings:", error);
    return [];
  }
}

// Simple search by exact clothing type
export async function getListingsByClothingType(clothingType) {
  try {
    const q = query(
      collection(db, "listings"),
      where("Status", "==", "Available"),
      where("ClothingType", "==", clothingType),
      orderBy("CreatedAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
  } catch (error) {
    console.error("Error fetching listings by clothing type:", error);
    return [];
  }
}

// Update listing
export async function updateListing(listingId, updatedFields) {
  try {
    const docRef = doc(db, "listings", listingId);

    await updateDoc(docRef, {
      ...updatedFields,
      UpdatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating listing:", error);
    return { success: false, error };
  }
}

// Soft mark as sold
export async function markListingAsSold(listingId) {
  try {
    const docRef = doc(db, "listings", listingId);

    await updateDoc(docRef, {
      Status: "Sold",
      UpdatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking listing as sold:", error);
    return { success: false, error };
  }
}

// Delete listing
export async function deleteListing(listingId) {
  try {
    const docRef = doc(db, "listings", listingId);
    await deleteDoc(docRef);

    return { success: true };
  } catch (error) {
    console.error("Error deleting listing:", error);
    return { success: false, error };
  }
}

// Realtime listener for catalog
export function subscribeToAvailableListings(callback) {
  const q = query(
    collection(db, "listings"),
    where("Status", "==", "Available"),
    orderBy("CreatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const listings = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      callback(listings);
    },
    (error) => {
      console.error("Realtime listings listener error:", error);
      callback([]);
    }
  );
}