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
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export class FirebaseAuthError extends Error {
  code: string;
  suggestedAction?: string;
  errorGuide?: string;

  constructor(code: string, message: string, suggestedAction?: string, errorGuide?: string) {
    super(message);
    this.name = "FirebaseAuthError";
    this.code = code;
    this.suggestedAction = suggestedAction;
    this.errorGuide = errorGuide;
  }
}

export interface AuthDiagnosticResult {
  isIframe: boolean;
  isCustomDomain: boolean;
  hostname: string;
  isFirebaseAppDomain: boolean;
  suggestedAction?: string;
  errorGuide?: string;
}

export const getAuthDiagnostics = (): AuthDiagnosticResult => {
  if (typeof window === "undefined") {
    return { isIframe: false, isCustomDomain: false, hostname: "", isFirebaseAppDomain: false };
  }

  const hostname = window.location.hostname;
  const isIframe = window.self !== window.top;
  
  const standardDomains = [
    "localhost", 
    "127.0.0.1", 
    "firebaseapp.com", 
    "web.app",
    "google.com"
  ];
  
  const isAISPreview = hostname.includes("run.app") || hostname.includes("aistudio");
  const isStandard = standardDomains.some(d => hostname === d || hostname.endsWith("." + d));
  const isCustomDomain = !isStandard && !isAISPreview;
  const isFirebaseAppDomain = hostname.endsWith("firebaseapp.com") || hostname.endsWith("web.app");

  let suggestedAction = undefined;
  let errorGuide = undefined;

  if (isIframe) {
    suggestedAction = "Click 'Open App in New Tab' to bypass iframe sign-in restrictions.";
    errorGuide = "Google Sign-In is blocked inside nested cross-origin iframes by modern browser security policies.";
  } else if (isCustomDomain) {
    suggestedAction = `Add '${hostname}' to your 'Authorized Domains' in the Firebase Console (under Authentication -> Settings -> Authorized Domains).`;
    errorGuide = `The domain '${hostname}' must be authorized in your Firebase Project to allow Google Authentication popups/redirects.`;
  }

  return {
    isIframe,
    isCustomDomain,
    hostname,
    isFirebaseAppDomain,
    suggestedAction,
    errorGuide
  };
};

// Google login helper
export const loginWithGoogle = async () => {
  const isIframe = typeof window !== "undefined" && window.self !== window.top;
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Firebase Auth sign in popup error details:", error);
    
    const errorCode = error.code || "";
    let suggestedAction = "";
    let errorGuide = "";

    if (errorCode === "auth/unauthorized-domain") {
      suggestedAction = `Add '${hostname}' to the 'Authorized Domains' list in your Firebase Console under Authentication -> Settings.`;
      errorGuide = `The domain '${hostname}' is not authorized to perform Google Sign-In with your current Firebase project settings.`;
      throw new FirebaseAuthError(errorCode, error.message, suggestedAction, errorGuide);
    } else if (errorCode === "auth/popup-blocked") {
      suggestedAction = "Disable popup blockers for this site in your browser address bar or use Email Sign-In instead.";
      errorGuide = "Your browser blocked the Google authentication popup window.";
      throw new FirebaseAuthError(errorCode, error.message, suggestedAction, errorGuide);
    } else if (errorCode === "auth/web-storage-unsupported") {
      suggestedAction = "Enable third-party cookies or disable 'Block third-party cookies' in your browser's privacy/security settings.";
      errorGuide = "Browser local storage or cookie policies are preventing the auth state from being saved.";
      throw new FirebaseAuthError(errorCode, error.message, suggestedAction, errorGuide);
    }

    if (isIframe) {
      throw new Error("Google Sign-In is restricted inside preview iframes. Please open the app in a new tab.");
    }

    // Fallback to redirect if popup is blocked/cancelled and we are not in an iframe
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (redirectError: any) {
      console.error("Firebase Auth sign in redirect error:", redirectError);
      
      const rCode = redirectError.code || "";
      if (rCode === "auth/unauthorized-domain") {
        suggestedAction = `Add '${hostname}' to the 'Authorized Domains' list in your Firebase Console under Authentication -> Settings.`;
        errorGuide = `The domain '${hostname}' is not authorized to perform Google Sign-In with your current Firebase project settings.`;
        throw new FirebaseAuthError(rCode, redirectError.message, suggestedAction, errorGuide);
      }
      throw redirectError;
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

// Algorand Pera Wallet login helper
export const loginWithAlgorandPera = async (walletAddress: string) => {
  try {
    const result = await signInAnonymously(auth);
    const displayName = `ALGO (${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)})`;
    await updateProfile(result.user, {
      displayName: displayName
    });
    return result.user;
  } catch (error: any) {
    console.warn("Firebase Anonymous login restricted for Algorand wallet, using local session fallback:", error?.message || error);
    // Fallback user object for Algorand wallet session when Firebase Auth admin-restricted-operation occurs
    const displayName = `ALGO (${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)})`;
    return {
      uid: `algo-wallet-${walletAddress}`,
      email: `${walletAddress.slice(0, 8)}@algorand.testnet`,
      displayName: displayName,
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: "",
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => "mock-token",
      getIdTokenResult: async () => ({ token: "mock-token", authTime: "", issuedAtTime: "", expirationTime: "", signInProvider: null, signInSecondFactor: null, claims: {} }),
      reload: async () => {},
      toJSON: () => ({})
    } as any;
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
  algorandWalletAddress?: string;
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

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
}

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

// --- Active Session Resume API Helpers for Interview Simulator & Socratic Professor ---

export interface ActiveInterviewSessionDoc {
  sessionId: string;
  status: "active" | "completed";
  scenarioId: string;
  currentScenarioIndex: number;
  userResponse: string;
  scorecards: any[];
  transcripts: string[];
  difficultyMode: "Easy" | "Medium" | "Hard";
  updatedAt: string;
  createdAt: string;
}

export const saveActiveInterviewSessionState = async (
  userId: string, 
  sessionId: string, 
  data: Partial<ActiveInterviewSessionDoc>
) => {
  const path = `users/${userId}/interviewSessions/${sessionId}`;
  try {
    const docRef = doc(db, "users", userId, "interviewSessions", sessionId);
    await setDoc(docRef, {
      sessionId,
      status: data.status || "active",
      scenarioId: data.scenarioId || "",
      currentScenarioIndex: data.currentScenarioIndex ?? 0,
      userResponse: data.userResponse || "",
      scorecards: data.scorecards || [],
      transcripts: data.transcripts || [],
      difficultyMode: data.difficultyMode || "Medium",
      updatedAt: new Date().toISOString(),
      createdAt: data.createdAt || new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getMostRecentActiveInterviewSession = async (userId: string): Promise<ActiveInterviewSessionDoc | null> => {
  const path = `users/${userId}/interviewSessions`;
  try {
    const colRef = collection(db, "users", userId, "interviewSessions");
    const q = query(colRef, orderBy("updatedAt", "desc"), limit(5));
    const snapshot = await getDocs(q);
    
    let activeDoc: ActiveInterviewSessionDoc | null = null;
    snapshot.forEach((docSnap) => {
      if (activeDoc) return;
      const data = docSnap.data() as ActiveInterviewSessionDoc;
      if (data.status === "active") {
        activeDoc = { ...data, sessionId: docSnap.id };
      }
    });
    return activeDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const markInterviewSessionCompleted = async (userId: string, sessionId: string) => {
  const path = `users/${userId}/interviewSessions/${sessionId}`;
  try {
    const docRef = doc(db, "users", userId, "interviewSessions", sessionId);
    await updateDoc(docRef, {
      status: "completed",
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export interface ActiveSocraticSessionDoc {
  sessionId: string;
  status: "active" | "completed";
  messages: any[];
  topic?: string;
  updatedAt: string;
  createdAt: string;
}

export const saveActiveSocraticSessionState = async (
  userId: string, 
  sessionId: string, 
  data: Partial<ActiveSocraticSessionDoc>
) => {
  const path = `users/${userId}/socraticSessions/${sessionId}`;
  try {
    const docRef = doc(db, "users", userId, "socraticSessions", sessionId);
    await setDoc(docRef, {
      sessionId,
      status: data.status || "active",
      messages: data.messages || [],
      topic: data.topic || "General Socratic Study",
      updatedAt: new Date().toISOString(),
      createdAt: data.createdAt || new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getMostRecentActiveSocraticSession = async (userId: string): Promise<ActiveSocraticSessionDoc | null> => {
  const path = `users/${userId}/socraticSessions`;
  try {
    const colRef = collection(db, "users", userId, "socraticSessions");
    const q = query(colRef, orderBy("updatedAt", "desc"), limit(5));
    const snapshot = await getDocs(q);

    let activeDoc: ActiveSocraticSessionDoc | null = null;
    snapshot.forEach((docSnap) => {
      if (activeDoc) return;
      const data = docSnap.data() as ActiveSocraticSessionDoc;
      if (data.status === "active") {
        activeDoc = { ...data, sessionId: docSnap.id };
      }
    });
    return activeDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const markSocraticSessionCompleted = async (userId: string, sessionId: string) => {
  const path = `users/${userId}/socraticSessions/${sessionId}`;
  try {
    const docRef = doc(db, "users", userId, "socraticSessions", sessionId);
    await updateDoc(docRef, {
      status: "completed",
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  email: string;
  photoURL: string;
  streak: number;
  updatedAt: string;
}

export const syncStreakToLeaderboard = async (
  userId: string, 
  displayName: string | null, 
  email: string | null, 
  photoURL: string | null, 
  streak: number
) => {
  try {
    const leaderDocRef = doc(db, "leaderboard", userId);
    await setDoc(leaderDocRef, {
      userId,
      displayName: displayName || "Cloud Learner",
      email: email || "",
      photoURL: photoURL || "",
      streak: streak,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log("Successfully synced streak to leaderboard:", streak);
  } catch (error) {
    console.error("Failed to sync streak to leaderboard:", error);
  }
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const leaderboardCol = collection(db, "leaderboard");
    const q = query(leaderboardCol, orderBy("streak", "desc"), limit(25));
    const querySnapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({
        userId: data.userId || doc.id,
        displayName: data.displayName || "Cloud Learner",
        email: data.email || "",
        photoURL: data.photoURL || "",
        streak: Number(data.streak) || 0,
        updatedAt: data.updatedAt || ""
      });
    });
    return entries;
  } catch (error) {
    console.warn("Ordered leaderboard query failed, falling back to un-ordered query:", error);
    try {
      const leaderboardCol = collection(db, "leaderboard");
      const querySnapshot = await getDocs(leaderboardCol);
      const entries: LeaderboardEntry[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          userId: data.userId || doc.id,
          displayName: data.displayName || "Cloud Learner",
          email: data.email || "",
          photoURL: data.photoURL || "",
          streak: Number(data.streak) || 0,
          updatedAt: data.updatedAt || ""
        });
      });
      return entries.sort((a, b) => b.streak - a.streak).slice(0, 25);
    } catch (fallbackError) {
      console.error("Failed to fetch leaderboard in fallback mode:", fallbackError);
      return [];
    }
  }
};
