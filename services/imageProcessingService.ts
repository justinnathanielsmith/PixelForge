
import { AnimationSettings } from '../types';
import * as gifenc from 'gifenc';

const gifencMod = (gifenc as any).default || gifenc;
const quantize = gifencMod.quantize;
const applyPalette = gifencMod.applyPalette;

export class ImageProcessingService {
  
  async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("VRAM_LOAD_ERROR"));
      img.src = src;
    });
  }

  processFrame(
    source: HTMLImageElement | HTMLCanvasElement,
    frameIndex: number,
    settings: AnimationSettings,
    style: string
  ): HTMLCanvasElement {
    const { cols, rows, targetResolution } = settings;
    
    const sw = source.width / cols;
    const sh = source.height / rows;
    const sx = (frameIndex % cols) * sw;
    const sy = Math.floor(frameIndex / cols) * sh;

    const canvas = document.createElement('canvas');
    canvas.width = targetResolution;
    canvas.height = targetResolution;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvas;

    ctx.imageSmoothingEnabled = false;
    ctx.filter = `hue-rotate(${settings.hue}deg) saturate(${settings.saturation}%) contrast(${settings.contrast}%) brightness(${settings.brightness}%)`;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, targetResolution, targetResolution);
    ctx.filter = 'none';

    let imageData = ctx.getImageData(0, 0, targetResolution, targetResolution);

    if (settings.autoTransparency) {
      const { data } = imageData;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 180 && data[i + 1] < 80 && data[i + 2] > 180) {
          data[i + 3] = 0;
        }
      }
    }

    if (settings.paletteLock && quantize && applyPalette) {
      const { data } = imageData;
      const colorCount = style === 'nes' ? 4 : 16;
      const palette = quantize(data, colorCount);
      const index = applyPalette(data, palette);
      for (let i = 0; i < index.length; i++) {
        const color = palette[index[i]];
        const offset = i * 4;
        data[offset] = color[0];
        data[offset + 1] = color[1];
        data[offset + 2] = color[2];
        data[offset + 3] = color[3];
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
}

export const imageProcessingService = new ImageProcessingService();
