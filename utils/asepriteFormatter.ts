import { GeneratedArt, AnimationSettings } from '../domain/entities';

export function generateAsepriteMetadata(art: GeneratedArt, settings: AnimationSettings): string {
  const { cols, rows, targetResolution, fps } = settings;
  const frameDuration = Math.round(1000 / fps);
  const frames: Record<string, any> = {};
  
  const artActions = art.actions || ['none'];
  
  const frameTags = artActions.map((act, idx) => ({
    name: act.toUpperCase(),
    from: idx * cols,
    to: (idx + 1) * cols - 1,
    direction: "forward"
  }));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      frames[`${art.category}_${art.id}_${i}.png`] = {
        frame: { x: c * targetResolution, y: r * targetResolution, w: targetResolution, h: targetResolution },
        duration: frameDuration
      };
    }
  }

  return JSON.stringify({
    frames,
    meta: {
      app: "Arcane Pixel Forge",
      version: "1.0",
      image: `pxl_flux_${art.id}.png`,
      frameTags
    }
  }, null, 2);
}