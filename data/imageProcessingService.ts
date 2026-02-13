
import { AnimationSettings } from '../domain/entities';
import { CHROMA_KEY } from '../domain/constants';
import gifenc from 'gifenc';

const { quantize, applyPalette } = gifenc;

export class ImageProcessingService {
  private _sharpeningBuffer: Uint8ClampedArray | null = null;

  async loadImage(src: string): Promise<HTMLImageElement | ImageBitmap> {
    if (typeof window === 'undefined') {
      // Worker environment
      const response = await fetch(src);
      const blob = await response.blob();
      return await createImageBitmap(blob);
    } else {
      // Main thread
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("VRAM_LOAD_ERROR"));
        img.src = src;
      });
    }
  }

  createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(width, height);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  getFrameDimensions(settings: AnimationSettings): { width: number; height: number } {
    const { targetResolution, aspectRatio } = settings;
    let width = targetResolution;
    let height = targetResolution;

    const [wRatio, hRatio] = aspectRatio.split(':').map(Number);
    const ratio = wRatio / hRatio;

    // Logic: targetResolution specifies the VERTICAL height (rows), width is derived.
    // This ensures consistency across character sprites (which usually share a height).
    height = targetResolution;
    width = Math.round(targetResolution * ratio);

    return { width, height };
  }

  processFrame(
    source: HTMLImageElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas,
    frameIndex: number,
    settings: AnimationSettings,
    style: string,
    targetCanvas?: HTMLCanvasElement | OffscreenCanvas,
    targetCtx?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  ): HTMLCanvasElement | OffscreenCanvas {
    const { cols, rows } = settings;
    const { width: targetW, height: targetH } = this.getFrameDimensions(settings);

    const sw = source.width / cols;
    const sh = source.height / rows;
    const sx = (frameIndex % cols) * sw;
    const sy = Math.floor(frameIndex / cols) * sh;

    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = targetCtx || null;

    if (ctx) {
      canvas = ctx.canvas;
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      } else {
        ctx.clearRect(0, 0, targetW, targetH);
      }
    } else {
      canvas = targetCanvas || this.createCanvas(targetW, targetH);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      } else if (targetCanvas) {
        const tempCtx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
        if (tempCtx) tempCtx.clearRect(0, 0, targetW, targetH);
      }
      ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    }

    if (!ctx) return canvas;

    ctx.imageSmoothingEnabled = false;
    
    // Apply visual filters via CSS filters on the context (Note: OffscreenCanvas might not support filter in all browsers, but we check)
    if ('filter' in ctx) {
      (ctx as any).filter = `hue-rotate(${settings.hue}deg) saturate(${settings.saturation}%) contrast(${settings.contrast}%) brightness(${settings.brightness}%)`;
    }
    
    ctx.drawImage(source as any, sx, sy, sw, sh, 0, 0, targetW, targetH);
    
    if ('filter' in ctx) {
      (ctx as any).filter = 'none';
    }

    // Performance Optimization: Skip expensive pixel manipulation if not needed
    const needsPixelManipulation = settings.vectorRite || settings.autoTransparency || settings.paletteLock;

    if (needsPixelManipulation) {
      let imageData = ctx.getImageData(0, 0, targetW, targetH);

      // Vector-to-Grid Rite: Sharp Silhouette Filter
      if (settings.vectorRite) {
        this.applyVectorSharpening(imageData);
      }

      // Chroma Key Transparency (Refined HSL Logic)
      if (settings.autoTransparency) {
        const { data } = imageData;
      
        for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Optimization: Skip obviously non-magenta pixels to save cycles
        // Magenta is high Red, low Green, high Blue.
        // Check 1: Green dominance check (if G is greater than R or B, it's not Magenta-dominant)
        if (g > r || g > b) continue;

        // Check 2: Brightness/Vividness heuristic (Dark pixels are not vivid magenta)
        if (r < 50 || b < 50) continue;

        // Check 3: Legacy whiteness skip (Protect light/white pixels)
        if (g > 150) continue;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        if (max === min) continue; // Achromatic (Gray/White/Black)

        // Integer-based Lightness Check
        // l = (max + min) / 2. isBright: l > 0.2 => (max + min) > 102
        const lSum = max + min;
        if (lSum <= 102) continue;

        const d = max - min;
        
        // Integer-based Saturation Check (isVivid: s > 0.5)
        let isVivid = false;
        if (lSum > 255) {
           // Light half: s = d / (2 - l). s > 0.5 => 2*d > (510 - lSum)
           if (2 * d > (510 - lSum)) isVivid = true;
        } else {
           // Dark half: s = d / l. s > 0.5 => 2*d > lSum
           if (2 * d > lSum) isVivid = true;
        }

        if (!isVivid) continue;

        // Strict Magenta Hue Range (280 - 320 degrees)
        // Optimized check without full HSL conversion
        let isMagentaHue = false;

        // If max is Red (Hue range ~300-360 or 0-60), Magenta side is 300-360.
        // We want <= 320 degrees.
        // Formula: h = (g - b) / d + 6 (for normalized).
        // Condition derived: 3 * (b - g) >= 2 * d
        if (max === r) {
           if (b > g && 3 * (b - g) >= 2 * d) isMagentaHue = true;
        }
        // If max is Blue (Hue range ~180-300), Magenta side is 240-300.
        // We want >= 280 degrees.
        // Formula: h = (r - g) / d + 4.
        // Condition derived: 3 * (r - g) >= 2 * d
        else if (max === b) {
           if (r > g && 3 * (r - g) >= 2 * d) isMagentaHue = true;
        }

        if (isMagentaHue) {
          data[i + 3] = 0;
        }
      }
    }

    // Hardware Palette Emulation (Quantization) or Neural Palette Application
    if (settings.paletteLock && typeof quantize === 'function' && typeof applyPalette === 'function') {
      const { data } = imageData;
      let palette: number[][] | null = null;

      // 1. Check for Neural Custom Palette
      if (settings.customPalette && settings.customPalette.length > 0) {
        palette = settings.customPalette.map(c => [c.r, c.g, c.b]);
      } else {
        // 2. Default Hardware Palettes
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
           palette = quantize(data, { colors: colorCount });
        } catch (e) {
           console.warn("Alchemy error: Quantization failed", e);
        }
      }

      if (palette) {
        try {
          // If custom palette is used, we might want to preserve transparency if not explicitly in palette?
          // gifenc applyPalette maps to nearest color.
          const index = applyPalette(data, palette);
          for (let i = 0; i < index.length; i++) {
            const color = palette[index[i]];
            const offset = i * 4;
            // Only overwrite if original alpha was not fully transparent (handled by Chroma Key above)
            if (data[offset + 3] > 0) {
              data[offset] = color[0];
              data[offset + 1] = color[1];
              data[offset + 2] = color[2];
              data[offset + 3] = 255; // Ensure full opacity for mapped colors
            }
          }
        } catch (e) {
           console.warn("Alchemy error: Palette application failed", e);
        }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }
    return canvas;
  }

  private applyVectorSharpening(imageData: ImageData) {
    const { data, width, height } = imageData;

    // Reuse buffer to avoid allocation pressure
    if (!this._sharpeningBuffer || this._sharpeningBuffer.length < data.length) {
      this._sharpeningBuffer = new Uint8ClampedArray(data.length);
    }
    this._sharpeningBuffer.set(data);
    const temp = this._sharpeningBuffer;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = (y * width + x) * 4;
        const alpha = temp[i + 3];

        if (alpha > 0 && alpha < 255) {
          if (alpha > 140) {
            data[i + 3] = 255;
            let rSum = 0, gSum = 0, bSum = 0, count = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const ni = ((y + dy) * width + (x + dx)) * 4;
                if (temp[ni + 3] > 220) {
                  rSum += temp[ni];
                  gSum += temp[ni + 1];
                  bSum += temp[ni + 2];
                  count++;
                }
              }
            }
            if (count > 0) {
              data[i] = Math.round(rSum / count);
              data[i + 1] = Math.round(gSum / count);
              data[i + 2] = Math.round(bSum / count);
            }
          } else {
            data[i + 3] = 0;
          }
        }

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
          if (data[ni + 3] > 100) neighbors++;
        }
      }
    }
    return neighbors === 0;
  }
}

export const imageProcessingService = new ImageProcessingService();
