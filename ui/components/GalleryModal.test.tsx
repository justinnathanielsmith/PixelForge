import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import GalleryModal from './GalleryModal';
import { GeneratedArt } from '../../domain/entities';

// Mock dependencies
vi.mock('jszip', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      file: vi.fn(),
      generateAsync: vi.fn().mockResolvedValue(new Blob([])),
    })),
  };
});

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    whisper: vi.fn(),
  }),
}));

const mockHistory: GeneratedArt[] = [
  {
    id: '1', imageUrl: 'test1.png', type: 'single',
    timestamp: 0, category: 'character', style: '8-bit',
    prompt: 'test prompt 1', actions: [], perspective: 'side',
    isSpriteSheet: false, selectedStyle: '8-bit', perspective: 'side',
    category: 'character', selectedActions: [], genState: 'SUCCESS',
    history: [], activeArt: null, errorMessage: '', isExporting: false,
    inspiration: null, animationSettings: {} as any
  } as any,
  {
    id: '2', imageUrl: 'test2.png', type: 'single',
    timestamp: 0, category: 'enemy', style: '16-bit',
    prompt: 'test prompt 2', actions: [], perspective: 'side'
  } as any,
];

describe('GalleryModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    history: mockHistory,
    activeArtId: undefined,
    onSelect: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders correctly when open', () => {
    render(<GalleryModal {...defaultProps} />);
    expect(screen.getByText('The Great Gallery')).toBeDefined();
    expect(screen.getByText('Viewing 2 Manifestations')).toBeDefined();
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
  });

  it('renders nothing when closed', () => {
    const { container } = render(<GalleryModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onSelect when an item is clicked', () => {
    render(<GalleryModal {...defaultProps} />);
    const images = screen.getAllByRole('img');
    fireEvent.click(images[0]);
    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockHistory[0]);
  });
});
