
import { test, expect, vi } from 'vitest';
import JSZip from 'jszip';

// Mock OffscreenCanvas
class MockOffscreenCanvas {
  width: number;
  height: number;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  getContext(type: string) {
    return {
      imageSmoothingEnabled: false,
      drawImage: vi.fn(),
    };
  }
  async convertToBlob(options: { type: string }) {
    // Simulate encoding time
    await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay
    return new Blob(['fake data'], { type: options.type });
  }
}

// Mock Processor
const processor = {
  createCanvas: (w: number, h: number) => new MockOffscreenCanvas(w, h),
};

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

async function runExport(useWebp: boolean, optimized: boolean) {
  const zip = new JSZip();
  const baseWidth = 100;
  const baseHeight = 100;
  const fileName = 'test_asset';
  const iosImagesetPath = `ios/Assets.xcassets/${fileName}.imageset`;

  // Mock baseCanvas
  const baseCanvas = processor.createCanvas(baseWidth, baseHeight);

  const start = performance.now();
  const convertToBlobSpies: any[] = [];

  for (let i = 1; i <= 4; i++) {
    const scaledCanvas = processor.createCanvas(baseWidth * i, baseHeight * i);
    const spy = vi.spyOn(scaledCanvas, 'convertToBlob');
    convertToBlobSpies.push(spy);

    const sCtx = scaledCanvas.getContext('2d');
    sCtx.drawImage(baseCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

    // Android Scaled Export
    const androidCfg = androidScales.find(s => s.multiplier === i);
    if (androidCfg) {
      const mimeType = useWebp ? 'image/webp' : 'image/png';
      const ext = useWebp ? 'webp' : 'png';

      let androidBlob;
      // Optimization check
      // For the purpose of this benchmark, we'll just check if we can reuse the logic
      // But the key is to implement the optimization logic here if optimized is true.

      if (optimized && !useWebp && i <= 3) { // iOS also has 1, 2, 3
         // In optimized version, we might check if we already have it.
         // But let's stick closer to the proposed fix structure.
         // Actually, the proposed fix is likely:
         /*
            let blob = await ...
            zip.file(...)

            if (iosCfg) {
               if (params match) { reuse blob } else { await ... }
            }
         */
      }

      // Let's implement the ORIGINAL logic and OPTIMIZED logic separately in the loop to match structure.

      if (!optimized) {
          // ORIGINAL LOGIC
          const androidBlob = await (scaledCanvas as any).convertToBlob({ type: mimeType });
          zip.file(`${androidCfg.folder}/${fileName}.${ext}`, androidBlob);

          const iosCfg = iosScales.find(s => s.multiplier === i);
          if (iosCfg) {
            const iosBlob = await (scaledCanvas as any).convertToBlob({ type: 'image/png' });
            zip.file(`${iosImagesetPath}/${fileName}${iosCfg.suffix}.png`, iosBlob);
          }
      } else {
          // OPTIMIZED LOGIC (Proposed)
          let sharedBlob: Blob | null = null;

          const androidBlob = await (scaledCanvas as any).convertToBlob({ type: mimeType });
          zip.file(`${androidCfg.folder}/${fileName}.${ext}`, androidBlob);

          if (mimeType === 'image/png') {
              sharedBlob = androidBlob;
          }

          const iosCfg = iosScales.find(s => s.multiplier === i);
          if (iosCfg) {
            if (sharedBlob) {
                zip.file(`${iosImagesetPath}/${fileName}${iosCfg.suffix}.png`, sharedBlob);
            } else {
                const iosBlob = await (scaledCanvas as any).convertToBlob({ type: 'image/png' });
                zip.file(`${iosImagesetPath}/${fileName}${iosCfg.suffix}.png`, iosBlob);
            }
          }
      }
    }
  }

  const end = performance.now();
  const totalCalls = convertToBlobSpies.reduce((acc, spy) => acc + spy.mock.calls.length, 0);

  return { time: end - start, totalCalls };
}

test('Performance Benchmark: Export Mobile', async () => {
    // Run unoptimized
    const resultUnopt = await runExport(false, false);
    console.log('Unoptimized (useWebp=false):', resultUnopt);

    // Run optimized
    const resultOpt = await runExport(false, true);
    console.log('Optimized (useWebp=false):', resultOpt);

    expect(resultOpt.totalCalls).toBeLessThan(resultUnopt.totalCalls);
    expect(resultOpt.time).toBeLessThan(resultUnopt.time);
});
