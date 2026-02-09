
import React from 'react';
import { render, screen } from '@testing-library/react';
import UserGuide from './UserGuide';
import { describe, it, expect, vi } from 'vitest';

describe('UserGuide Accessibility', () => {
  it('renders close buttons with accessible names', () => {
    const onClose = vi.fn();
    render(<UserGuide onClose={onClose} />);

    // Query by accessible name - should find both the X button (via aria-label) and the footer button (via text)
    const closeButtons = screen.getAllByRole('button', { name: /Close Grimoire/i });
    expect(closeButtons).toHaveLength(2);
  });
});
