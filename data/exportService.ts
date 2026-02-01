
import { AnimationSettings, PixelStyle, GeneratedArt } from '../domain/entities';
import { imageProcessingService } from './imageProcessingService';
import { generateAsepriteMetadata } from '../utils/asepriteFormatter';

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
    const { cols, rows } = settings;
    const { width: frameW, height: frameH } = imageProcessingService.getFrameDimensions(settings);
    
    const finalW = frameW * cols;
    const finalH = frameH * rows;

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
        ctx.drawImage(frameCanvas, c * frameW, r * frameH);
      }
    }

    return canvas.toDataURL('image/png');
  }

  async exportMobileBundle(art: GeneratedArt, settings: AnimationSettings): Promise<string> {
    const blob = await this.runWorkerTask('EXPORT_MOBILE', { art, settings });
    return URL.createObjectURL(blob);
  }
  
  async exportLittleKTAtlas(art: GeneratedArt, settings: AnimationSettings): Promise<string> {
    const blob = await this.runWorkerTask('EXPORT_ATLAS', { art, settings });
    return URL.createObjectURL(blob);
  }

  async exportAsepriteData(art: GeneratedArt, settings: AnimationSettings): Promise<string> {
    const metadata = generateAsepriteMetadata(art, settings);
    const blob = new Blob([metadata], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  async exportToGif(imageUrl: string, settings: AnimationSettings, style: PixelStyle): Promise<string> {
    const blob = await this.runWorkerTask('EXPORT_GIF', { imageUrl, settings, style });
    return URL.createObjectURL(blob);
  }

  async exportToVideo(imageUrl: string, settings: AnimationSettings, style: PixelStyle): Promise<string> {
    const pngUrl = await this.exportToPng(imageUrl, settings, style);
    const processedSpriteSheet = await imageProcessingService.loadImage(pngUrl);
    
    const { cols, rows, fps } = settings;
    const { width: frameW, height: frameH } = imageProcessingService.getFrameDimensions(settings);
    
    // Calculate display dimensions maintaining aspect ratio within 512px box
    const ratio = frameW / frameH;
    let displayW, displayH;
    if (frameW > frameH) {
      displayW = 512;
      displayH = Math.round(512 / ratio);
    } else {
      displayH = 512;
      displayW = Math.round(512 * ratio);
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = displayW;
    canvas.height = displayH;
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
        ctx.fillRect(0, 0, displayW, displayH);
        ctx.imageSmoothingEnabled = false;
        
        ctx.drawImage(
          processedSpriteSheet as HTMLImageElement, 
          c * frameW, r * frameH, 
          frameW, frameH, 
          0, 0, displayW, displayH
        );
        
        frame++;
      }, 1000 / fps);
    });
  }
}

export const exportService = new ExportService();
