import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signOut, 
  onAuthStateChanged,
  User,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
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
  const isIframe = typeof window !== "undefined" && window.self !== window.top;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Firebase Auth sign in popup error:", error);
    if (isIframe) {
      // Do not fallback to redirect inside an iframe, because Google blocks iframe rendering.
      throw new Error("Google Sign-In is restricted inside preview iframes. Please open the app in a new tab.");
    }
    // Fallback to redirect if popup is blocked and we are not in an iframe
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

// Email registration helper
export const registerWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Firebase Email registration error:", error);
    throw error;
  }
};

// Email login helper
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Firebase Email login error:", error);
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
  dailyMinutesLog?: { [dateKey: string]: number };
}

export const saveProgressToCloud = async (userId: string, progress: CloudProgress) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.warn("No auth token available for saveProgressToCloud");
      return;
    }
    const response = await fetch("/api/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(progress)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to save progress to cloud:", error);
  }
};

export const getProgressFromCloud = async (userId: string): Promise<CloudProgress | null> => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.warn("No auth token available for getProgressFromCloud");
      return null;
    }
    const response = await fetch("/api/progress", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch progress from cloud:", error);
    return null;
  }
};

export interface InterviewSessionData {
  scenarioId: string;
  transcript: string;
  scorecard: any;
  createdAt: string;
}

export const saveInterviewSessionToCloud = async (userId: string, sessionId: string, sessionData: InterviewSessionData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.warn("No auth token available for saveInterviewSessionToCloud");
      return;
    }
    const response = await fetch("/api/interview-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        sessionId,
        scenarioId: sessionData.scenarioId,
        transcript: sessionData.transcript,
        scorecard: sessionData.scorecard,
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to save interview session to cloud:", error);
  }
};
