import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signOut, 
  onAuthStateChanged,
  User,
  signInAnonymously
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc 
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Google login helper
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Firebase Auth sign in popup error, trying redirect:", error);
    // Fallback to redirect if popup is blocked
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (redirectError) {
      console.error("Firebase Auth sign in redirect error:", redirectError);
      throw error;
    }
  }
};

// Anonymous login helper
export const loginAnonymously = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error("Firebase Anonymous login error:", error);
    throw error;
  }
};

// Sign out helper
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Firebase Signout error:", error);
    throw error;
  }
};

// Sync user study progress to/from firestore
export interface CloudProgress {
  totalStudyMinutes: number;
  todayStudyMinutes: number;
  dailyStudyGoal: number;
  studyHistory: { [key: string]: "known" | "review" | null };
  quizHistory: any;
}

export const saveProgressToCloud = async (userId: string, progress: CloudProgress) => {
  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, {
      ...progress,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Failed to save progress to cloud:", error);
  }
};

export const getProgressFromCloud = async (userId: string): Promise<CloudProgress | null> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        totalStudyMinutes: data.totalStudyMinutes || 0,
        todayStudyMinutes: data.todayStudyMinutes || 0,
        dailyStudyGoal: data.dailyStudyGoal || 15,
        studyHistory: data.studyHistory || {},
        quizHistory: data.quizHistory || {}
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch progress from cloud:", error);
    return null;
  }
};
