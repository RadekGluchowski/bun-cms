import { useCallback, useEffect, useState } from 'react';

export function useCommandPalette() {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => {
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            // Ctrl+K (Windows/Linux) or Cmd+K (Mac)
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isModifierKey = isMac ? event.metaKey : event.ctrlKey;

            if (isModifierKey && event.key === 'k') {
                event.preventDefault();
                toggle();
            }

            // Escape to close
            if (event.key === 'Escape' && isOpen) {
                event.preventDefault();
                close();
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, toggle, close]);

    return {
        /** Whether the command palette is currently open */
        isOpen,
        /** Open the command palette */
        open,
        /** Close the command palette */
        close,
        /** Toggle the command palette open/closed state */
        toggle,
    };
}
