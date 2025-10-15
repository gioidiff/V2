
export interface Character {
  name: string;
  description: string;
}

export interface Scene {
  scene_id: number;
  setting: string;
  time: string;
  location: string;
  characters: Character[];
  dialogue: string;
  scene_length_seconds: number;
}

export type SceneArray = Scene[];
