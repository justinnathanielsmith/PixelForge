
import { GeneratedArt, PixelForgeState, AnimationSettings } from '../domain/entities';

const STORAGE_KEYS = {
  HISTORY: 'pixelforge_history_v1',
  SETTINGS: 'pixelforge_settings_v1',
  PROMPT: 'pixelforge_last_prompt_v1'
};

export class PixelRepository {
  getHistory(): GeneratedArt[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveArt(art: GeneratedArt): GeneratedArt[] {
    const history = this.getHistory();
    const updated = [art, ...history].slice(0, 24);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    return updated;
  }

  updateArt(updatedArt: GeneratedArt): GeneratedArt[] {
    const history = this.getHistory();
    const index = history.findIndex(a => a.id === updatedArt.id);
    if (index !== -1) {
      history[index] = updatedArt;
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    }
    return history;
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
