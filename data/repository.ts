
import { GeneratedArt, PixelForgeState, AnimationSettings } from '../domain/entities';
import { pixelDB } from './db';

const STORAGE_KEYS = {
  SETTINGS: 'pixelforge_settings_v1',
  PROMPT: 'pixelforge_last_prompt_v1'
};

export class PixelRepository {
  async getHistory(): Promise<GeneratedArt[]> {
    return await pixelDB.getAllHistory();
  }

  async saveArt(art: GeneratedArt): Promise<GeneratedArt[]> {
    await pixelDB.putArt(art);
    return await this.getHistory();
  }

  async updateArt(updatedArt: GeneratedArt): Promise<GeneratedArt[]> {
    await pixelDB.putArt(updatedArt);
    return await this.getHistory();
  }

  saveSession(state: Partial<PixelForgeState>): void {
    if (state.animationSettings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.animationSettings));
    }
    if (state.prompt !== undefined) {
      localStorage.setItem(STORAGE_KEYS.PROMPT, state.prompt);
    }
  }

  loadSession(): { settings: AnimationSettings | null, prompt: string } {
    let settings = null;
    let prompt = '';
    try {
      const sData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (sData) settings = JSON.parse(sData);
      const pData = localStorage.getItem(STORAGE_KEYS.PROMPT);
      if (pData) prompt = pData;
    } catch (e) {}
    return { settings, prompt };
  }
}

export const pixelRepository = new PixelRepository();
