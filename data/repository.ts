
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

  async deleteArt(id: string): Promise<GeneratedArt[]> {
    await pixelDB.deleteArt(id);
    return await this.getHistory();
  }

  async saveSession(state: Partial<PixelForgeState>): Promise<void> {
    if (state.animationSettings) {
      await pixelDB.putSessionValue(STORAGE_KEYS.SETTINGS, state.animationSettings);
    }
    if (state.prompt !== undefined) {
      await pixelDB.putSessionValue(STORAGE_KEYS.PROMPT, state.prompt);
    }
  }

  async loadSession(): Promise<{ settings: AnimationSettings | null, prompt: string }> {
    const settings = await pixelDB.getSessionValue(STORAGE_KEYS.SETTINGS) || null;
    const prompt = await pixelDB.getSessionValue(STORAGE_KEYS.PROMPT) || '';
    return { settings, prompt };
  }

  /**
   * Serializes the entire application state into a single object for export.
   */
  async exportProject(): Promise<string> {
    const history = await this.getHistory();
    const session = await this.loadSession();
    
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

    // Restore Settings to IndexedDB
    if (data.settings) {
      await pixelDB.putSessionValue(STORAGE_KEYS.SETTINGS, data.settings);
    }
    if (data.lastPrompt) {
      await pixelDB.putSessionValue(STORAGE_KEYS.PROMPT, data.lastPrompt);
    }

    return {
      history: await this.getHistory(),
      settings: data.settings || null,
      prompt: data.lastPrompt || ''
    };
  }
}

export const pixelRepository = new PixelRepository();
