import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";

export const logSearchQuery = async (term: string, userId?: string) => {
  if (!term || term.trim().length === 0) return;

  const path = "search_queries";
  try {
    await addDoc(collection(db, path), {
      term: term.trim(),
      userId: userId || null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Silent error logging for SEO tracking
    try {
      handleFirestoreError(error, OperationType.CREATE, path);
    } catch (e) {
      console.error("SEO Tracking Error:", e);
    }
  }
};
