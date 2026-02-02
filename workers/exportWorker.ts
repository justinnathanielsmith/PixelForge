
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
        const { cols, rows, fps } = settings;
        const { width: frameW, height: frameH } = processor.getFrameDimensions(settings);

        const gif = GIFEncoder();
        const totalFrames = cols * rows;

        let targetColors = 256;
        let palette: number[][] | null = null;

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
          const { data } = ctx.getImageData(0, 0, frameW, frameH);
          
          let framePalette = palette;
          if (!framePalette) {
             framePalette = quantize(data, { colors: targetColors });
          }
          
          const index = applyPalette(data, framePalette);
            
          gif.writeFrame(index, frameW, frameH, { 
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
        const { art, settings, adaptiveIcons, useWebp } = payload;
        const img = await processor.loadImage(art.imageUrl);
        const { cols, rows } = settings;
        const { width: frameW, height: frameH } = processor.getFrameDimensions(settings);
        
        const baseWidth = frameW * cols;
        const baseHeight = frameH * rows;
        const baseCanvas = processor.createCanvas(baseWidth, baseHeight);
        const ctx = baseCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
        ctx.imageSmoothingEnabled = false;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const frameIndex = r * cols + c;
            const frameCanvas = processor.processFrame(img, frameIndex, settings, art.style);
            ctx.drawImage(frameCanvas, c * frameW, r * frameH);
          }
        }

        const zip = new JSZip();
        const safeName = art.prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20) || 'asset';
        const fileName = `${art.category}_${safeName}`;

        const androidScales = [
          { multiplier: 1, folder: 'android/res/drawable-mdpi' },
          { multiplier: 2, folder: 'android/res/drawable-xhdpi' },
          { multiplier: 3, folder: 'android/res/drawable-xxhdpi' },
          { multiplier: 4, folder: 'android/res/drawable-xxxhdpi' }
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

          // Android Scaled Export
          const androidCfg = androidScales.find(s => s.multiplier === i);
          if (androidCfg) {
            const mimeType = useWebp ? 'image/webp' : 'image/png';
            const ext = useWebp ? 'webp' : 'png';
            const androidBlob = await (scaledCanvas as OffscreenCanvas).convertToBlob({ type: mimeType });
            zip.file(`${androidCfg.folder}/${fileName}.${ext}`, androidBlob);
          }

          // iOS Scaled Export (Always PNG for xcassets standard)
          const iosCfg = iosScales.find(s => s.multiplier === i);
          if (iosCfg) {
            const iosBlob = await (scaledCanvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
            zip.file(`${iosImagesetPath}/${fileName}${iosCfg.suffix}.png`, iosBlob);
          }
        }

        // --- Android Adaptive Icons Polish ---
        if (adaptiveIcons && (art.category === 'icon_set' || art.category === 'ui_panel' || art.category === 'character' || art.category === 'playing_card')) {
          const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`;
          zip.file(`android/res/mipmap-anydpi-v26/ic_launcher.xml`, adaptiveXml);

          const bgColor = settings.customPalette && settings.customPalette.length > 0 
            ? `rgb(${settings.customPalette[0].r}, ${settings.customPalette[0].g}, ${settings.customPalette[0].b})`
            : '#1c1917';
          
          const bgCanvas = processor.createCanvas(108, 108);
          const bgCtx = bgCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
          bgCtx.fillStyle = bgColor;
          bgCtx.fillRect(0, 0, 108, 108);
          
          const launcherMime = useWebp ? 'image/webp' : 'image/png';
          const launcherExt = useWebp ? 'webp' : 'png';
          
          const bgBlob = await (bgCanvas as OffscreenCanvas).convertToBlob({ type: launcherMime });
          zip.file(`android/res/drawable-nodpi/ic_launcher_background.${launcherExt}`, bgBlob);

          const fgCanvas = processor.createCanvas(108, 108);
          const fgCtx = fgCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
          fgCtx.imageSmoothingEnabled = false;
          
          const iconFrame = processor.processFrame(img, 0, settings, art.style);
          const fgW = Math.min(72, frameW);
          const fgH = Math.min(72, frameH);
          const fgX = (108 - fgW) / 2;
          const fgY = (108 - fgH) / 2;
          fgCtx.drawImage(iconFrame, 0, 0, iconFrame.width, iconFrame.height, fgX, fgY, fgW, fgH);
          
          const fgBlob = await (fgCanvas as OffscreenCanvas).convertToBlob({ type: launcherMime });
          zip.file(`android/res/drawable-nodpi/ic_launcher_foreground.${launcherExt}`, fgBlob);
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
        const { cols, rows } = settings;
        const { width: frameW, height: frameH } = processor.getFrameDimensions(settings);
        
        const baseWidth = frameW * cols;
        const baseHeight = frameH * rows;
        const baseCanvas = processor.createCanvas(baseWidth, baseHeight);
        const ctx = baseCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
        ctx.imageSmoothingEnabled = false;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const frameIndex = r * cols + c;
            const frameCanvas = processor.processFrame(img, frameIndex, settings, art.style);
            ctx.drawImage(frameCanvas, c * frameW, r * frameH);
          }
        }
        
        const pngBlob = await (baseCanvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
        const frames: any = {};
        const safeName = art.prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20) || 'asset';
        const imageName = `${safeName}.png`;
        
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
             let regionName = '';
             if (art.category === 'icon_set') {
                const index = r * cols + c;
                regionName = `icon_${index}`;
             } else {
                let action = 'idle';
                if (art.actions && art.actions.length > 0) {
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
                frame: { x: c * frameW, y: r * frameH, w: frameW, h: frameH },
                rotated: false,
                trimmed: false,
                spriteSourceSize: { x: 0, y: 0, w: frameW, h: frameH },
                sourceSize: { w: frameW, h: frameH }
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

        const zip = new JSZip();
        zip.file(`${safeName}.png`, pngBlob);
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
