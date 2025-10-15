
import { Scene, SceneArray } from '../types';

// QUAN TRỌNG: Thay đổi URL này thành URL của backend service trên Render.com của bạn
// Khi chạy local, backend sẽ chạy ở cổng 3001
const BACKEND_URL = 'http://localhost:3001'; 
// VÍ DỤ KHI DEPLOY: const BACKEND_URL = 'https://your-backend-app-name.onrender.com';

const callApi = async (endpoint: string, body: object): Promise<SceneArray> => {
    try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error(`Error calling backend API at ${endpoint}:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to communicate with the server: ${error.message}`);
        }
        throw new Error("An unknown network error occurred.");
    }
}

export const generateScenes = async (transcript: string, characterDescription: string): Promise<SceneArray> => {
  return callApi('/api/generate', { transcript, characterDescription });
};

export const expandScript = async (existingScenes: SceneArray, scenesToAdd: number): Promise<SceneArray> => {
    return callApi('/api/expand', { existingScenes, scenesToAdd });
};
