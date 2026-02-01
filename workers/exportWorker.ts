
import gifenc from 'gifenc';
import JSZip from 'jszip';
import { ImageProcessingService } from '../data/imageProcessingService';

const { GIFEncoder, quantize, applyPalette } = gifenc;
const processor = new ImageProcessingService();

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;
  
  try {
    switch (type) {
      case 'EXPORT_GIF': {
        const { imageUrl, settings, style } = payload;
        const img = await processor.loadImage(imageUrl);
        const { cols, rows, fps, targetResolution } = settings;
        const gif = GIFEncoder();
        const totalFrames = cols * rows;

        let targetColors = 256;
        let palette: number[][] | null = null;

        // Custom Palette Priority
        if (settings.paletteLock) {
           if (settings.customPalette && settings.customPalette.length > 0) {
              palette = settings.customPalette.map((c: any) => [c.r, c.g, c.b]);
           } else {
              switch(style) {
                case '8-bit':
                case 'gameboy': targetColors = 4; break;
                case '16-bit': targetColors = 16; break;
                case 'hi-bit': targetColors = 64; break;
              }
           }
        }

        for (let i = 0; i < totalFrames; i++) {
          const frameCanvas = processor.processFrame(img, i, settings, style);
          const ctx = frameCanvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
          const { data } = ctx.getImageData(0, 0, targetResolution, targetResolution);
          
          let framePalette = palette;
          if (!framePalette) {
             framePalette = quantize(data, { colors: targetColors });
          }
          
          const index = applyPalette(data, framePalette);
            
          gif.writeFrame(index, targetResolution, targetResolution, { 
            palette: framePalette, 
            delay: 1000 / fps,
            repeat: 0,
            transparent: true,
            transparentIndex: 0
          });
        }

        gif.finish();
        const blob = new Blob([gif.bytes()], { type: 'image/gif' });
        self.postMessage({ type: 'SUCCESS', payload: blob });
        break;
      }

      case 'EXPORT_MOBILE': {
        const { art, settings } = payload;
        const img = await processor.loadImage(art.imageUrl);
        const { cols, rows, targetResolution } = settings;
        
        const baseWidth = targetResolution * cols;
        const baseHeight = targetResolution * rows;
        const baseCanvas = processor.createCanvas(baseWidth, baseHeight);
        const ctx = baseCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
        ctx.imageSmoothingEnabled = false;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const frameIndex = r * cols + c;
            const frameCanvas = processor.processFrame(img, frameIndex, settings, art.style);
            ctx.drawImage(frameCanvas, c * targetResolution, r * targetResolution);
          }
        }

        const zip = new JSZip();
        const safeName = art.prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20) || 'asset';
        const fileName = `${art.category}_${safeName}`;

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

        const iosImagesetPath = `ios/Assets.xcassets/${fileName}.imageset`;
        for (let i = 1; i <= 4; i++) {
          const scaledCanvas = processor.createCanvas(baseWidth * i, baseHeight * i);
          const sCtx = scaledCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
          sCtx.imageSmoothingEnabled = false; 
          sCtx.drawImage(baseCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

          const blob = await (scaledCanvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
          const androidCfg = androidScales.find(s => s.multiplier === i);
          if (androidCfg) zip.file(`${androidCfg.folder}/${fileName}.png`, blob);
          const iosCfg = iosScales.find(s => s.multiplier === i);
          if (iosCfg) zip.file(`${iosImagesetPath}/${fileName}${iosCfg.suffix}.png`, blob);
        }

        const iosManifest = {
          images: [
            { idiom: "universal", scale: "1x", filename: `${fileName}.png` },
            { idiom: "universal", scale: "2x", filename: `${fileName}@2x.png` },
            { idiom: "universal", scale: "3x", filename: `${fileName}@3x.png` }
          ],
          info: { version: 1, author: "ArcanePixelForge" }
        };
        zip.file(`${iosImagesetPath}/Contents.json`, JSON.stringify(iosManifest, null, 2));

        const content = await zip.generateAsync({ type: 'blob' });
        self.postMessage({ type: 'SUCCESS', payload: content });
        break;
      }
      
      case 'EXPORT_ATLAS': {
        const { art, settings } = payload;
        const img = await processor.loadImage(art.imageUrl);
        const { cols, rows, targetResolution } = settings;
        
        // 1. Generate Full Sheet PNG
        const baseWidth = targetResolution * cols;
        const baseHeight = targetResolution * rows;
        const baseCanvas = processor.createCanvas(baseWidth, baseHeight);
        const ctx = baseCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
        ctx.imageSmoothingEnabled = false;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const frameIndex = r * cols + c;
            const frameCanvas = processor.processFrame(img, frameIndex, settings, art.style);
            ctx.drawImage(frameCanvas, c * targetResolution, r * targetResolution);
          }
        }
        
        const pngBlob = await (baseCanvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
        
        // 2. Generate JSON Atlas definition
        const frames: any = {};
        const safeName = art.prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20) || 'asset';
        const imageName = `${safeName}.png`;
        
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
             // Naming Logic
             let regionName = '';
             if (art.category === 'icon_set') {
                const index = r * cols + c;
                regionName = `icon_${index}`;
             } else {
                let action = 'idle';
                if (art.actions && art.actions.length > 0) {
                   // If multi-sheet, assume row maps to action index
                   if (art.type === 'multi-sheet' || (art.actions.length === rows)) {
                      action = art.actions[r % art.actions.length];
                   } else {
                      action = art.actions[0];
                   }
                }
                const index = (art.type === 'multi-sheet') ? c : (r * cols + c);
                regionName = `${action}_${index}`;
             }

             frames[regionName] = {
                frame: { x: c * targetResolution, y: r * targetResolution, w: targetResolution, h: targetResolution },
                rotated: false,
                trimmed: false,
                spriteSourceSize: { x: 0, y: 0, w: targetResolution, h: targetResolution },
                sourceSize: { w: targetResolution, h: targetResolution }
             };
          }
        }
        
        const atlasJson = {
           frames,
           meta: {
              app: "Arcane Pixel Forge",
              version: "1.0",
              image: imageName,
              format: "RGBA8888",
              size: { w: baseWidth, h: baseHeight },
              scale: "1"
           }
        };

        // 3. Zip it up
        const zip = new JSZip();
        zip.file(imageName, pngBlob);
        zip.file(`${safeName}.json`, JSON.stringify(atlasJson, null, 2));
        
        const content = await zip.generateAsync({ type: 'blob' });
        self.postMessage({ type: 'SUCCESS', payload: content });
        break;
      }

      default:
        self.postMessage({ type: 'ERROR', payload: 'Unknown task type' });
    }
  } catch (err: any) {
    self.postMessage({ type: 'ERROR', payload: err.message });
  }
};
