
import { GeneratedArt, PixelForgeState, AnimationSettings } from '../types';

const STORAGE_KEYS = {
  HISTORY: 'pixelforge_history_v1',
  SETTINGS: 'pixelforge_settings_v1',
  PROMPT: 'pixelforge_last_prompt_v1'
};

export class PixelRepository {
  /**
   * Retrieves the full history of generated art.
   */
  getHistory(): GeneratedArt[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("REPO_ERROR: History corruption detected.", e);
      return [];
    }
  }

  /**
   * Appends a new piece of art to the history and limits the stack size.
   */
  saveArt(art: GeneratedArt): GeneratedArt[] {
    const history = this.getHistory();
    const updated = [art, ...history].slice(0, 24); // Keep last 24 summons
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    return updated;
  }

  /**
   * Persists the current workspace state.
   */
  saveSession(state: Partial<PixelForgeState>): void {
    if (state.animationSettings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.animationSettings));
    }
    if (state.prompt !== undefined) {
      localStorage.setItem(STORAGE_KEYS.PROMPT, state.prompt);
    }
  }

  /**
   * Loads the previously saved workspace configuration.
   */
  loadSession(): { settings: AnimationSettings | null, prompt: string } {
    let settings = null;
    let prompt = '';
    
    try {
      const sData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (sData) settings = JSON.parse(sData);
      
      const pData = localStorage.getItem(STORAGE_KEYS.PROMPT);
      if (pData) prompt = pData;
    } catch (e) {
      console.warn("REPO_WARN: Session recovery partially failed.");
    }

    return { settings, prompt };
  }

  /**
   * Clears the entire local scroll (History + Settings).
   */
  purgeAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
}

export const pixelRepository = new PixelRepository();
