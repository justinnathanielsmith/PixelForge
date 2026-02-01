import { AnimationSettings, PixelStyle, GeneratedArt, GifEnc } from '../domain/entities';
import gifenc from 'gifenc';
import JSZip from 'jszip';
import { imageProcessingService } from './imageProcessingService';

const { GIFEncoder, quantize, applyPalette } = gifenc as unknown as GifEnc;

export class ExportService {

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

  /**
   * Generates a ZIP file containing Android and iOS density-specific variants.
   * Organized into Android-compatible folders and iOS-compatible Asset Catalog.
   */
  async exportMobileBundle(art: GeneratedArt, settings: AnimationSettings): Promise<string> {
    const img = await imageProcessingService.loadImage(art.imageUrl);
    const { cols, rows, targetResolution } = settings;
    
    const baseWidth = targetResolution * cols;
    const baseHeight = targetResolution * rows;

    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = baseWidth;
    baseCanvas.height = baseHeight;
    const ctx = baseCanvas.getContext('2d');
    if (!ctx) throw new Error('CANVAS_FAIL');

    ctx.imageSmoothingEnabled = false;

    // Render the base sheet
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const frameIndex = r * cols + c;
        const frameCanvas = imageProcessingService.processFrame(img, frameIndex, settings, art.style);
        ctx.drawImage(frameCanvas, c * targetResolution, r * targetResolution);
      }
    }

    const zip = new JSZip();
    const safeName = art.prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20) || 'asset';
    const fileName = `${art.category}_${safeName}`;

    // Platforms configurations
    const androidScales = [
      { multiplier: 1, folder: 'android/drawable-mdpi' },
      { multiplier: 2, folder: 'android/drawable-xhdpi' },
      { multiplier: 3, folder: 'android/drawable-xxhdpi' },
      { multiplier: 4, folder: 'android/drawable-xxxhdpi' }
    ];

    const iosScales = [
      { multiplier: 1, suffix: '' },
      { multiplier: 2, suffix: '@2x' },
      { multiplier: 3, suffix: '@3x' }
    ];

    // Create iOS imageset folder
    const iosImagesetPath = `ios/Assets.xcassets/${fileName}.imageset`;
    const iosFolder = zip.folder(iosImagesetPath);

    const maxMultiplier = 4;
    for (let i = 1; i <= maxMultiplier; i++) {
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = baseWidth * i;
      scaledCanvas.height = baseHeight * i;
      const sCtx = scaledCanvas.getContext('2d');
      if (!sCtx) continue;

      sCtx.imageSmoothingEnabled = false; 
      sCtx.drawImage(baseCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

      const blob = await new Promise<Blob | null>(resolve => scaledCanvas.toBlob(resolve, 'image/png'));
      if (!blob) continue;

      // Add to Android structures
      const androidCfg = androidScales.find(s => s.multiplier === i);
      if (androidCfg) {
        zip.file(`${androidCfg.folder}/${fileName}.png`, blob);
      }

      // Add to iOS structure
      const iosCfg = iosScales.find(s => s.multiplier === i);
      if (iosCfg && iosFolder) {
        iosFolder.file(`${fileName}${iosCfg.suffix}.png`, blob);
      }
    }

    // Generate iOS Contents.json for Xcode
    const iosManifest = {
      images: [
        { idiom: "universal", scale: "1x", filename: `${fileName}.png` },
        { idiom: "universal", scale: "2x", filename: `${fileName}@2x.png` },
        { idiom: "universal", scale: "3x", filename: `${fileName}@3x.png` }
      ],
      info: { version: 1, author: "ArcanePixelForge" }
    };

    if (iosFolder) {
      iosFolder.file("Contents.json", JSON.stringify(iosManifest, null, 2));
    }

    const content = await zip.generateAsync({ type: 'blob' });
    return URL.createObjectURL(content);
  }

  /**
   * Generates a JSON Metadata file compatible with Aseprite / Game Engines (Aseprite Flux)
   */
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
    const img = await imageProcessingService.loadImage(imageUrl);
    const { cols, rows, fps, targetResolution } = settings;

    const gif = GIFEncoder();
    const totalFrames = cols * rows;

    let targetColors = 256;
    if (settings.paletteLock) {
      switch(style) {
        case '8-bit':
        case 'gameboy':
          targetColors = 4;
          break;
        case '16-bit':
          targetColors = 16;
          break;
        case 'hi-bit':
          targetColors = 64;
          break;
      }
    }

    for (let i = 0; i < totalFrames; i++) {
      const frameCanvas = imageProcessingService.processFrame(img, i, settings, style);
      const ctx = frameCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) continue;

      const { data } = ctx.getImageData(0, 0, targetResolution, targetResolution);
      
      const palette = quantize(data, { colors: targetColors });
      const index = applyPalette(data, palette);
        
      gif.writeFrame(index, targetResolution, targetResolution, { 
        palette, 
        delay: 1000 / fps,
        repeat: 0,
        transparent: true,
        transparentIndex: 0
      });
    }

    gif.finish();
    return URL.createObjectURL(new Blob([gif.bytes()], { type: 'image/gif' }));
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
        // Record 2 loops
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