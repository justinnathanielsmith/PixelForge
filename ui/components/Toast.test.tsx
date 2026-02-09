
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ToastContainer } from './Toast';
import { ToastProvider, useToast } from '../context/ToastContext';
import { describe, it, expect } from 'vitest';

// Component to trigger a toast
const TriggerToast = () => {
  const { whisper } = useToast();
  return <button onClick={() => whisper('Test Toast', 'This is a test', 'info')}>Trigger</button>;
};

describe('Toast Accessibility', () => {
  it('renders toast container as a live region', () => {
    const { container } = render(
      <ToastProvider>
        <ToastContainer />
      </ToastProvider>
    );

    // Find the div with aria-live="polite"
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  it('renders toasts as accessible buttons', async () => {
    render(
      <ToastProvider>
        <ToastContainer />
        <TriggerToast />
      </ToastProvider>
    );

    const trigger = screen.getByText('Trigger');

    await act(async () => {
      trigger.click();
    });

    // Wait for toast to appear
    const toastTitle = await screen.findByText('Test Toast');
    expect(toastTitle).toBeDefined();

    // The toast itself (parent of title) should have button role
    const toastButton = toastTitle.closest('[role="button"]');
    expect(toastButton).not.toBeNull();
    expect(toastButton?.getAttribute('tabIndex')).toBe('0');

    // Check for aria-hidden close icon
    const closeIcon = toastButton?.querySelector('[aria-hidden="true"]');
    expect(closeIcon).not.toBeNull();
    expect(closeIcon?.textContent).toBe('×');
  });
});
