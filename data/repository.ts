
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

  /**
   * Serializes the entire application state into a single object for export.
   */
  async exportProject(): Promise<string> {
    const history = await this.getHistory();
    const session = this.loadSession();
    
    const projectData = {
      version: '1.0',
      timestamp: Date.now(),
      history,
      settings: session.settings,
      lastPrompt: session.prompt
    };

    return JSON.stringify(projectData);
  }

  /**
   * Deserializes project data and restores history and settings.
   */
  async importProject(json: string): Promise<{ history: GeneratedArt[], settings: AnimationSettings | null, prompt: string }> {
    const data = JSON.parse(json);
    
    // Validate basic structure
    if (!data.history || !Array.isArray(data.history)) {
      throw new Error("Invalid .forge project file.");
    }

    // Restore History to IndexedDB
    for (const art of data.history) {
      await pixelDB.putArt(art);
    }

    // Restore Settings to LocalStorage
    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    if (data.lastPrompt) {
      localStorage.setItem(STORAGE_KEYS.PROMPT, data.lastPrompt);
    }

    return {
      history: await this.getHistory(),
      settings: data.settings || null,
      prompt: data.lastPrompt || ''
    };
  }
}

export const pixelRepository = new PixelRepository();
