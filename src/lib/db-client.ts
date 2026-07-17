import { auth } from "./firebase.js";

export const getRoadmapFromCloud = async (): Promise<any[] | null> => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return null;
    const response = await fetch("/api/roadmap", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch roadmap from db:", error);
    return null;
  }
};

export const saveRoadmapToCloud = async (items: any[]) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    const response = await fetch("/api/roadmap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ items })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to save roadmap to db:", error);
  }
};

export const getChatHistoryFromCloud = async (): Promise<any[] | null> => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return null;
    const response = await fetch("/api/chat", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch chat history from db:", error);
    return null;
  }
};

export const saveChatHistoryToCloud = async (history: any[]) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ history })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to save chat history to db:", error);
  }
};
