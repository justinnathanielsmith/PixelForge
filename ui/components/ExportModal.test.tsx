
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ExportModal from './ExportModal';
import { GeneratedArt, AnimationSettings } from '../../domain/entities';

// Mock dependencies
vi.mock('../../utils/asepriteFormatter.ts', () => ({
  generateAsepriteMetadata: vi.fn().mockReturnValue('{}'),
}));

vi.mock('../../utils/codeGenerator.ts', () => ({
  generateKotlinFleksCode: vi.fn().mockReturnValue(''),
  generateComposeCode: vi.fn().mockReturnValue(''),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    whisper: vi.fn(),
  }),
}));

const mockArt: GeneratedArt = {
  id: '1', imageUrl: 'test.png', type: 'single',
  timestamp: 0, category: 'character', style: '8-bit',
  prompt: 'test prompt', actions: [], perspective: 'side',
  gridSize: { rows: 1, cols: 1 }
} as any;

const mockSettings: AnimationSettings = {
  targetResolution: 64,
  zoom: 1,
  cols: 1,
  rows: 1,
  fps: 8,
} as any;

describe('ExportModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    activeArt: mockArt,
    settings: mockSettings,
    onExport: vi.fn(),
    isExporting: false,
  };

  it('renders correctly when open', () => {
    render(<ExportModal {...defaultProps} />);
    expect(screen.getByText('Export Manifest')).toBeDefined();
    expect(screen.getByText('Begin GIF Download')).toBeDefined();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<ExportModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onExport when export button is clicked', () => {
    render(<ExportModal {...defaultProps} />);
    const exportButton = screen.getByText('Begin GIF Download');
    fireEvent.click(exportButton);
    expect(defaultProps.onExport).toHaveBeenCalledWith('gif');
  });

  it('shows loading state when isExporting is true', () => {
    render(<ExportModal {...defaultProps} isExporting={true} />);
    const exportButton = screen.getByRole('button', { name: /Exporting.../i });
    expect(exportButton).toBeDefined();
    expect(exportButton.hasAttribute('disabled')).toBe(true);
    expect(exportButton.getAttribute('aria-busy')).toBe('true');
  });

  it('does not show loading state when isExporting is false', () => {
    render(<ExportModal {...defaultProps} isExporting={false} />);
    const exportButton = screen.getByText('Begin GIF Download');
    expect(exportButton.hasAttribute('disabled')).toBe(false);
    expect(exportButton.getAttribute('aria-busy')).toBe('false');
  });
});
