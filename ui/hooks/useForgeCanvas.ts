
import { useState, useRef, useCallback } from 'react';
import { AnimationSettings } from '../../domain/entities';
import { imageProcessingService } from '../../data/imageProcessingService';

interface UseForgeCanvasProps {
  settings: AnimationSettings;
  updateSettings: (settings: Partial<AnimationSettings>) => void;
  imageUrl?: string;
  onUpdateImage?: (newUrl: string) => void;
}

export type Tool = 'none' | 'pencil' | 'eraser';

export const useForgeCanvas = ({ settings, updateSettings, imageUrl, onUpdateImage }: UseForgeCanvasProps) => {
  const [mousePos, setMousePos] = useState({ x: 256, y: 256 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<Tool>('none');
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getCanvasCoordinates = (e: React.MouseEvent | React.WheelEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    // Map client coordinates to 512x512 internal canvas space
    const x = (e.clientX - rect.left) * (512 / rect.width);
    const y = (e.clientY - rect.top) * (512 / rect.height);
    return { x, y };
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    const newZoom = Math.min(Math.max(settings.zoom + delta, 0.25), 4);
    
    if (newZoom === settings.zoom) return;

    const { x: mouseX, y: mouseY } = getCanvasCoordinates(e);
    
    // Zoom towards mouse pointer logic
    const factor = newZoom / settings.zoom;
    const newPanX = mouseX - factor * (mouseX - settings.panOffset.x);
    const newPanY = mouseY - factor * (mouseY - settings.panOffset.y);
    
    updateSettings({ 
        zoom: newZoom, 
        panOffset: { x: newPanX, y: newPanY } 
    });
  }, [settings.zoom, settings.panOffset, updateSettings]);

  const executeDrawAction = useCallback((mouseX: number, mouseY: number, currentFrame: number, imageRef: HTMLImageElement) => {
    if (!imageUrl || !onUpdateImage) return;

    const { width: frameW, height: frameH } = imageProcessingService.getFrameDimensions(settings);
    const ratio = frameW / frameH;
    let baseW, baseH;
    if (ratio > 1) { baseW = 512; baseH = 512 / ratio; } 
    else { baseH = 512; baseW = 512 * ratio; }
    
    const dw = Math.round(baseW * settings.zoom);
    const dh = Math.round(baseH * settings.zoom);
    const dx = Math.floor((512 - dw) / 2) + settings.panOffset.x;
    const dy = Math.floor((512 - dh) / 2) + settings.panOffset.y;

    const relX = mouseX - dx;
    const relY = mouseY - dy;

    if (relX < 0 || relX >= dw || relY < 0 || relY >= dh) return;

    const sw = imageRef.width / settings.cols;
    const sh = imageRef.height / settings.rows;
    const frameX = (currentFrame % settings.cols) * sw;
    const frameY = Math.floor(currentFrame / settings.cols) * sh;

    const normX = relX / dw;
    const normY = relY / dh;

    const sourceX = Math.floor(frameX + (normX * sw));
    const sourceY = Math.floor(frameY + (normY * sh));

    const editCanvas = document.createElement('canvas');
    editCanvas.width = imageRef.width;
    editCanvas.height = imageRef.height;
    const eCtx = editCanvas.getContext('2d');
    if (!eCtx) return;
    eCtx.drawImage(imageRef, 0, 0);
    
    const brushSize = Math.max(1, Math.round(imageRef.width / (settings.cols * frameW)));
    
    if (tool === 'pencil') {
      eCtx.fillStyle = brushColor;
      eCtx.fillRect(sourceX - brushSize / 2, sourceY - brushSize / 2, brushSize, brushSize);
    } else if (tool === 'eraser') {
      eCtx.clearRect(sourceX - brushSize / 2, sourceY - brushSize / 2, brushSize, brushSize);
    }

    onUpdateImage(editCanvas.toDataURL('image/png'));
  }, [imageUrl, onUpdateImage, settings, tool, brushColor]);

  const handleMouseDown = useCallback((e: React.MouseEvent, spacePressed: boolean, currentFrame: number, imageRef: HTMLImageElement | null) => {
    if (e.button === 1 || (e.button === 0 && spacePressed)) {
      setIsPanning(true);
      setLastPanPos({ x: e.clientX, y: e.clientY });
      return;
    }
    if (tool !== 'none' && imageRef) {
      setIsDrawing(true);
      const { x, y } = getCanvasCoordinates(e);
      executeDrawAction(x, y, currentFrame, imageRef);
    }
  }, [tool, executeDrawAction]);

  const handleMouseMove = useCallback((e: React.MouseEvent, currentFrame: number, imageRef: HTMLImageElement | null) => {
    const { x, y } = getCanvasCoordinates(e);
    setMousePos({ x, y });

    if (isPanning) {
        const dx = e.clientX - lastPanPos.x;
        const dy = e.clientY - lastPanPos.y;
        updateSettings({
            panOffset: {
                x: settings.panOffset.x + dx,
                y: settings.panOffset.y + dy
            }
        });
        setLastPanPos({ x: e.clientX, y: e.clientY });
        return;
    }

    if (isDrawing && tool !== 'none' && imageRef) {
      executeDrawAction(x, y, currentFrame, imageRef);
    }
  }, [isPanning, lastPanPos, settings.panOffset, updateSettings, isDrawing, tool, executeDrawAction]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDrawing(false);
  }, []);

  return {
    canvasRef,
    containerRef,
    mousePos,
    isPanning,
    tool, setTool,
    brushColor, setBrushColor,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};
