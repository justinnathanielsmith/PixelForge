import { AnimationSettings } from '../domain/entities';
import { CHROMA_KEY } from '../domain/constants';
import gifenc from 'gifenc';

// Define a local interface for gifenc as the library types might not be perfectly resolved via ESM
interface GifEnc {
  quantize: (data: Uint8ClampedArray, options: { colors: number }) => any;
  applyPalette: (data: Uint8ClampedArray, palette: any) => Uint8Array;
}

const { quantize, applyPalette } = gifenc as unknown as GifEnc;

export class ImageProcessingService {
  // Use a pair of scratch canvases to handle cases where two processed frames are needed simultaneously (e.g., onion skinning or normal map lighting)
  private scratchA: HTMLCanvasElement | null = null;
  private scratchB: HTMLCanvasElement | null = null;
  private nextScratchIdx = 0;

  private getScratchCanvas(width: number, height: number): HTMLCanvasElement {
    let canvas: HTMLCanvasElement;
    if (this.nextScratchIdx === 0) {
      if (!this.scratchA) this.scratchA = document.createElement('canvas');
      canvas = this.scratchA;
      this.nextScratchIdx = 1;
    } else {
      if (!this.scratchB) this.scratchB = document.createElement('canvas');
      canvas = this.scratchB;
      this.nextScratchIdx = 0;
    }

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    return canvas;
  }

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

    const canvas = this.getScratchCanvas(targetResolution, targetResolution);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvas;

    // Reset canvas for fresh frame
    ctx.clearRect(0, 0, targetResolution, targetResolution);
    ctx.imageSmoothingEnabled = false;
    
    // Apply visual filters via CSS filters on the context
    ctx.filter = `hue-rotate(${settings.hue}deg) saturate(${settings.saturation}%) contrast(${settings.contrast}%) brightness(${settings.brightness}%)`;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, targetResolution, targetResolution);
    ctx.filter = 'none';

    let imageData = ctx.getImageData(0, 0, targetResolution, targetResolution);

    // Vector-to-Grid Rite: Sharp Silhouette Filter
    if (settings.vectorRite) {
      this.applyVectorSharpening(imageData);
    }

    // Chroma Key Transparency
    if (settings.autoTransparency) {
      const { data } = imageData;
      // Convert 0-50% tolerance to a Manhattan distance threshold
      const threshold = (settings.chromaTolerance || 5) * 4; 
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Manhattan distance to target Chroma Key
        const dist = Math.abs(r - CHROMA_KEY.RGB.r) + Math.abs(g - CHROMA_KEY.RGB.g) + Math.abs(b - CHROMA_KEY.RGB.b);
        
        if (dist <= threshold) {
          data[i + 3] = 0;
        }
      }
    }

    // Hardware Palette Emulation (Quantization)
    if (settings.paletteLock && typeof quantize === 'function' && typeof applyPalette === 'function') {
      const { data } = imageData;
      let colorCount = 256;
      switch (style) {
        case '8-bit':
        case 'gameboy':
            colorCount = 4;
            break;
        case '16-bit':
            colorCount = 16;
            break;
        case 'hi-bit':
            colorCount = 64;
            break;
        default:
            colorCount = 32;
      }

      try {
        const palette = quantize(data, { colors: colorCount });
        const index = applyPalette(data, palette);
        for (let i = 0; i < index.length; i++) {
          const color = palette[index[i]];
          const offset = i * 4;
          data[offset] = color[0];
          data[offset + 1] = color[1];
          data[offset + 2] = color[2];
          data[offset + 3] = color[3];
        }
      } catch (e) {
        console.warn("Alchemy error: Quantization failed", e);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  private applyVectorSharpening(imageData: ImageData) {
    const { data, width, height } = imageData;
    const temp = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = (y * width + x) * 4;
        
        // Pixel-snapping: Force alpha to binary states to eliminate AI-generated "soft" edges
        const alpha = data[i + 3];
        if (alpha > 0 && alpha < 255) {
          data[i + 3] = alpha > 127 ? 255 : 0;
        }

        // Noise Reduction: Remove isolated floating pixels
        const isIsolated = this.isPixelIsolated(temp, x, y, width, height);
        if (isIsolated) {
          data[i + 3] = 0;
        }
      }
    }
  }

  private isPixelIsolated(data: Uint8ClampedArray, x: number, y: number, w: number, h: number): boolean {
    const i = (y * w + x) * 4;
    if (data[i + 3] === 0) return false;
    
    let neighbors = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const ni = (ny * w + nx) * 4;
          if (data[ni + 3] > 0) neighbors++;
        }
      }
    }
    return neighbors === 0;
  }
}

export const imageProcessingService = new ImageProcessingService();