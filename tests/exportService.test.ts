import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportService } from '../data/exportService';
import { imageProcessingService } from '../data/imageProcessingService';

// Mock dependencies
vi.mock('../data/imageProcessingService');

describe('ExportService - exportToSvg', () => {
  let originalGetContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    originalGetContext = HTMLCanvasElement.prototype.getContext;

    // Mock Blob
    global.Blob = class Blob {
      content: any[];
      options: any;
      constructor(content: any[], options: any) {
        this.content = content;
        this.options = options;
      }
      async text() {
        return this.content.join('');
      }
      get size() {
        return this.content.reduce((acc, c) => acc + c.length, 0);
      }
    } as any;

    // Mock URL.createObjectURL/revokeObjectURL
    global.URL.createObjectURL = vi.fn((blob) => `blob:${(blob as Blob).size}`);
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it('should generate correct SVG content from image data', async () => {
    // Mock image processing
    vi.mocked(imageProcessingService.loadImage).mockResolvedValue({} as HTMLImageElement);
    const width = 2;
    const height = 2;
    vi.mocked(imageProcessingService.getFrameDimensions).mockReturnValue({ width, height });
    vi.mocked(imageProcessingService.processFrame).mockReturnValue(document.createElement('canvas'));

    // Prepare mock data for 2x2 image
    // (0,0) Red: [255, 0, 0, 255]
    // (1,0) Green: [0, 255, 0, 255]
    // (0,1) Blue: [0, 0, 255, 255]
    // (1,1) Transparent: [0, 0, 0, 0]
    const mockData = new Uint8ClampedArray([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
      0, 0, 0, 0
    ]);

    // Mock canvas context
    const mockContext = {
      imageSmoothingEnabled: false,
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: mockData,
        width,
        height
      })
    };

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext);

    const settings = { cols: 1, rows: 1 } as any;
    const style = {} as any;

    const result = await exportService.exportToSvg('test-url', settings, style);

    expect(result).toContain('blob:');

    // Verify the content of the blob passed to createObjectURL
    const createObjectUrlMock = global.URL.createObjectURL as any;
    const blob = createObjectUrlMock.mock.calls[0][0];
    const svgContent = await blob.text();

    // Verify SVG structure
    expect(svgContent).toContain(`<svg width="${width}" height="${height}"`);

    // Verify Rects
    // 1. Red at 0,0
    expect(svgContent).toContain('<rect x="0" y="0" width="1" height="1" fill="rgb(255,0,0)"/>');
    // 2. Green at 1,0
    expect(svgContent).toContain('<rect x="1" y="0" width="1" height="1" fill="rgb(0,255,0)"/>');
    // 3. Blue at 0,1
    expect(svgContent).toContain('<rect x="0" y="1" width="1" height="1" fill="rgb(0,0,255)"/>');

    // Transparent pixel should not produce a rect
    expect(svgContent).not.toContain('<rect x="1" y="1"');

    // Verify optimization logic (array join) didn't break functionality
    // The number of rects should be exactly 3
    const rectCount = (svgContent.match(/<rect/g) || []).length;
    expect(rectCount).toBe(3);
  });
});
