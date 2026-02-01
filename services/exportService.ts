
import { AnimationSettings } from '../types';
import * as gifenc from 'gifenc';
import { imageProcessingService } from './imageProcessingService';

const gifencMod = (gifenc as any).default || gifenc;
const GIFEncoder = gifencMod.GIFEncoder;
const quantize = gifencMod.quantize;
const applyPalette = gifencMod.applyPalette;

export class ExportService {

  async exportToPng(imageUrl: string, settings: AnimationSettings, style: string): Promise<string> {
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

  async exportToGif(imageUrl: string, settings: AnimationSettings, style: string): Promise<string> {
    const img = await imageProcessingService.loadImage(imageUrl);
    const { cols, rows, fps, targetResolution } = settings;

    if (!GIFEncoder) throw new Error("GIF_ENCODER_NOT_FOUND");
    const gif = GIFEncoder();
    const totalFrames = cols * rows;

    for (let i = 0; i < totalFrames; i++) {
      const frameCanvas = imageProcessingService.processFrame(img, i, settings, style);
      const ctx = frameCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) continue;

      const { data } = ctx.getImageData(0, 0, targetResolution, targetResolution);
      const targetColors = settings.paletteLock ? (style === 'nes' ? 4 : 16) : 256;
      
      if (quantize && applyPalette) {
        const palette = quantize(data, targetColors);
        const index = applyPalette(data, palette);
        
        gif.writeFrame(index, targetResolution, targetResolution, { 
          palette, 
          delay: 1000 / fps,
          transparent: true,
          transparentIndex: 0
        });
      }
    }

    gif.finish();
    return URL.createObjectURL(new Blob([gif.bytes()], { type: 'image/gif' }));
  }

  async exportToVideo(imageUrl: string, settings: AnimationSettings, style: string): Promise<string> {
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
        if (frame >= total * 4) {
          clearInterval(interval);
          mediaRecorder.stop();
          return;
        }
        
        const i = frame % total;
        const c = i % cols;
        const r = Math.floor(i / cols);

        ctx.clearRect(0, 0, displayRes, displayRes);
        ctx.fillStyle = '#000'; 
        ctx.fillRect(0, 0, displayRes, displayRes);
        ctx.imageSmoothingEnabled = false;
        
        ctx.drawImage(
          processedSpriteSheet, 
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
