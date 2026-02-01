
import { GeneratedArt, AnimationSettings } from '../domain/entities';
import { imageProcessingService } from '../data/imageProcessingService';

export function generateAsepriteMetadata(art: GeneratedArt, settings: AnimationSettings): string {
  const { cols, rows, fps } = settings;
  const { width: frameW, height: frameH } = imageProcessingService.getFrameDimensions(settings);
  const frameDuration = Math.round(1000 / fps);
  const frames: Record<string, any> = {};
  
  let frameTags: any[] = [];

  if (art.type === 'batch') {
    // Batch Mode: 4 distinct variations (2x2 grid)
    frameTags = [
      { name: "Var_1", from: 0, to: 0, direction: "forward" },
      { name: "Var_2", from: 1, to: 1, direction: "forward" },
      { name: "Var_3", from: 2, to: 2, direction: "forward" },
      { name: "Var_4", from: 3, to: 3, direction: "forward" }
    ];
  } else {
    const artActions = art.actions || ['none'];
    frameTags = artActions.map((act, idx) => ({
      name: act.toUpperCase(),
      from: idx * cols,
      to: (idx + 1) * cols - 1,
      direction: "forward"
    }));
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const key = `${art.category}_${art.id}_${i}.png`;
      frames[key] = {
        frame: { x: c * frameW, y: r * frameH, w: frameW, h: frameH },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: frameW, h: frameH },
        sourceSize: { w: frameW, h: frameH },
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
            w: frameW - (art.sliceData.left + art.sliceData.right), 
            h: frameH - (art.sliceData.top + art.sliceData.bottom) 
          }
        }
      ]
    }
  ] : [];

  return JSON.stringify({
    frames,
    meta: {
      app: "Arcane Pixel Forge",
      version: "1.0",
      image: `pxl_flux_${art.id}.png`,
      format: "RGBA8888",
      size: { w: frameW * cols, h: frameH * rows },
      scale: "1",
      frameTags,
      slices
    }
  }, null, 2);
}
