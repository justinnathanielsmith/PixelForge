declare module 'gifenc' {
  export interface GIFEncoderOptions {
    /** Frame delay in milliseconds. */
    delay?: number;
    /** 0 for infinite loop, -1 for no loop. */
    repeat?: number;
    /** Whether to use a transparent color. */
    transparent?: boolean;
    /** The index in the palette to treat as transparent. */
    transparentIndex?: number;
    /** The palette to use for this frame. */
    palette?: number[][];
    /** The disposal method (0-3). */
    disposal?: number;
  }

  export interface GIFEncoderInstance {
    /** Writes a frame to the GIF. */
    writeFrame: (index: Uint8Array, width: number, height: number, options?: GIFEncoderOptions) => void;
    /** Finalizes the GIF. */
    finish: () => void;
    /** Returns the raw GIF bytes. */
    bytes: () => Uint8Array;
  }

  /** Creates a new GIF encoder instance. */
  export function GIFEncoder(): GIFEncoderInstance;

  /** Quantizes RGBA data into a palette of a specific size. */
  export function quantize(data: Uint8ClampedArray, colors: number | { colors: number }): number[][];

  /** Maps RGBA data to indices in a palette. */
  export function applyPalette(data: Uint8ClampedArray, palette: number[][], format?: string): Uint8Array;

  const gifenc: {
    GIFEncoder: typeof GIFEncoder;
    quantize: typeof quantize;
    applyPalette: typeof applyPalette;
  };

  export default gifenc;
}
