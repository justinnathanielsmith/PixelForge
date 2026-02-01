import { AnimationSettings, PixelStyle, GeneratedArt } from '../domain/entities';
import { imageProcessingService } from './imageProcessingService';

export class ExportService {
  private worker: Worker | null = null;

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('../workers/exportWorker.ts', import.meta.url), { type: 'module' });
    }
    return this.worker;
  }

  private async runWorkerTask(type: string, payload: any): Promise<Blob> {
    const worker = this.getWorker();
    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        if (e.data.type === 'SUCCESS') {
          worker.removeEventListener('message', handler);
          resolve(e.data.payload);
        } else if (e.data.type === 'ERROR') {
          worker.removeEventListener('message', handler);
          reject(new Error(e.data.payload));
        }
      };
      worker.addEventListener('message', handler);
      worker.postMessage({ type, payload });
    });
  }

  async exportToPng(imageUrl: string, settings: AnimationSettings, style: PixelStyle): Promise<string> {
    const img = await imageProcessingService.loadImage(imageUrl);
    const { cols, rows, targetResolution } = settings;
    
    const finalW = targetResolution * cols;
    const finalH = targetResolution * rows;

    const canvas = document.createElement('canvas');
    canvas.width = finalW;
    canvas.height = finalH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('CANVAS_FAIL');

    ctx.imageSmoothingEnabled = false;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const frameIndex = r * cols + c;
        const frameCanvas = imageProcessingService.processFrame(img, frameIndex, settings, style);
        ctx.drawImage(frameCanvas, c * targetResolution, r * targetResolution);
      }
    }

    return canvas.toDataURL('image/png');
  }

  async exportMobileBundle(art: GeneratedArt, settings: AnimationSettings): Promise<string> {
    const blob = await this.runWorkerTask('EXPORT_MOBILE', { art, settings });
    return URL.createObjectURL(blob);
  }

  async exportAsepriteData(art: GeneratedArt, settings: AnimationSettings): Promise<string> {
    const { cols, rows, targetResolution, fps } = settings;
    const frameDuration = Math.round(1000 / fps);
    
    const frames: Record<string, any> = {};
    const primaryAction = art.actions && art.actions.length > 0 ? art.actions[0] : 'none';
    const frameTags = [
      {
        name: primaryAction !== 'none' ? primaryAction.toUpperCase() : "STATIC_ENTITY",
        from: 0,
        to: (cols * rows) - 1,
        direction: "forward"
      }
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const key = `${art.category}_${art.id}_${i}.png`;
        frames[key] = {
          frame: { x: c * targetResolution, y: r * targetResolution, w: targetResolution, h: targetResolution },
          rotated: false,
          trimmed: false,
          spriteSourceSize: { x: 0, y: 0, w: targetResolution, h: targetResolution },
          sourceSize: { w: targetResolution, h: targetResolution },
          duration: frameDuration
        };
      }
    }

    const slices = art.sliceData ? [
      {
        name: "9slice",
        color: "#0000ff",
        keys: [
          {
            frame: 0,
            bounds: { 
              x: art.sliceData.left, 
              y: art.sliceData.top, 
              w: targetResolution - (art.sliceData.left + art.sliceData.right), 
              h: targetResolution - (art.sliceData.top + art.sliceData.bottom) 
            }
          }
        ]
      }
    ] : [];

    const data = {
      frames,
      meta: {
        app: "Arcane Pixel Forge",
        version: "1.0",
        image: `pxl_flux_${art.id}.png`,
        format: "RGBA8888",
        size: { w: targetResolution * cols, h: targetResolution * rows },
        scale: "1",
        frameTags,
        slices
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  async exportToGif(imageUrl: string, settings: AnimationSettings, style: PixelStyle): Promise<string> {
    const blob = await this.runWorkerTask('EXPORT_GIF', { imageUrl, settings, style });
    return URL.createObjectURL(blob);
  }

  async exportToVideo(imageUrl: string, settings: AnimationSettings, style: PixelStyle): Promise<string> {
    const pngUrl = await this.exportToPng(imageUrl, settings, style);
    const processedSpriteSheet = await imageProcessingService.loadImage(pngUrl);
    
    const { cols, rows, fps, targetResolution } = settings;
    const displayRes = 512;
    
    const canvas = document.createElement('canvas');
    canvas.width = displayRes;
    canvas.height = displayRes;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('CTX_FAIL');

    const stream = (canvas as any).captureStream ? (canvas as any).captureStream(fps) : null;
    if (!stream) throw new Error("VIDEO_STREAM_NOT_SUPPORTED");
    
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

    return new Promise((resolve) => {
      mediaRecorder.onstop = () => resolve(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })));
      mediaRecorder.start();

      let frame = 0;
      const total = cols * rows;
      
      const interval = setInterval(() => {
        if (frame >= total * 2) {
          clearInterval(interval);
          mediaRecorder.stop();
          return;
        }
        
        const i = frame % total;
        const c = i % cols;
        const r = Math.floor(i / cols);

        ctx.fillStyle = '#000'; 
        ctx.fillRect(0, 0, displayRes, displayRes);
        ctx.imageSmoothingEnabled = false;
        
        ctx.drawImage(
          processedSpriteSheet as HTMLImageElement, 
          c * targetResolution, r * targetResolution, 
          targetResolution, targetResolution, 
          0, 0, displayRes, displayRes
        );
        
        frame++;
      }, 1000 / fps);
    });
  }
}

export const exportService = new ExportService();