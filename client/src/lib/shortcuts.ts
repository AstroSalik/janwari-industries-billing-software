import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';

// ─── Shortcut definitions ───────────────────────────

export function useShortcuts() {
  const navigate = useNavigate();
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const closeCommandPalette = useUIStore((s) => s.closeCommandPalette);
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ctrl+K — Global search palette (works even in inputs)
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Escape — Close command palette first, then other modals
      if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          e.preventDefault();
          closeCommandPalette();
          return;
        }
        // Let other escape handlers (modals, etc.) handle it
        return;
      }

      // Don't trigger other shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // F-key shortcuts (only without modifiers)
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        switch (e.key) {
          case 'F2':
            e.preventDefault();
            navigate('/invoices/new');
            break;
          case 'F3':
            e.preventDefault();
            navigate('/customers');
            break;
          default:
            break;
        }
      }
    },
    [navigate, toggleCommandPalette, closeCommandPalette, commandPaletteOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
