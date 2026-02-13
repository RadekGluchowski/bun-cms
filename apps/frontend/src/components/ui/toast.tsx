import { cn } from '@/lib/utils';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

const toastVariants = cva(
    'group pointer-events-auto relative flex w-full flex-col overflow-hidden rounded-md border shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
    {
        variants: {
            variant: {
                default: 'border bg-background text-foreground',
                success: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
                error: 'border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/20',
                warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
                info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

const progressVariants = cva(
    'absolute bottom-0 left-0 h-1 transition-all ease-linear',
    {
        variants: {
            variant: {
                default: 'bg-foreground/20',
                success: 'bg-green-500',
                error: 'bg-destructive',
                warning: 'bg-amber-500',
                info: 'bg-blue-500',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    title: string;
    description?: string;
    variant?: ToastVariant;
    duration?: number;
}

interface ToastContextValue {
    toasts: Toast[];
    toast: (toast: Omit<Toast, 'id'>) => void;
    dismiss: (id: string) => void;
    dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const toastIcons: Record<ToastVariant, typeof CheckCircle2> = {
    default: Info,
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
};

const TOAST_DURATION = 5000;

function ToastItem({
    toast,
    onDismiss,
}: {
    toast: Toast;
    onDismiss: () => void;
}) {
    const Icon = toastIcons[toast.variant ?? 'default'];
    const duration = toast.duration ?? TOAST_DURATION;
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const startTime = Date.now();
        const intervalId = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);

            if (remaining <= 0) {
                clearInterval(intervalId);
            }
        }, 50);

        return () => clearInterval(intervalId);
    }, [duration]);

    return (
        <ToastPrimitives.Root
            data-testid="toast-container"
            className={cn(toastVariants({ variant: toast.variant }))}
            duration={duration}
            onOpenChange={(open) => {
                if (!open) onDismiss();
            }}
        >
            <div className="flex items-start gap-3 p-4 pr-8">
                <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="grid gap-1">
                    <ToastPrimitives.Title data-testid="toast-title" className="text-sm font-semibold">
                        {toast.title}
                    </ToastPrimitives.Title>
                    {toast.description && (
                        <ToastPrimitives.Description data-testid="toast-description" className="text-sm opacity-90">
                            {toast.description}
                        </ToastPrimitives.Description>
                    )}
                </div>
            </div>
            <ToastPrimitives.Close
                data-testid="toast-close-button"
                className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:bg-foreground/10 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2"
                aria-label="Zamknij"
            >
                <X className="h-4 w-4" />
            </ToastPrimitives.Close>
            {/* Progress bar */}
            <div
                className={cn(progressVariants({ variant: toast.variant }))}
                style={{ width: `${progress}%` }}
            />
        </ToastPrimitives.Root>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((newToast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { ...newToast, id }]);
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const dismissAll = useCallback(() => {
        setToasts([]);
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
            <ToastPrimitives.Provider swipeDirection="left">
                {children}
                <ToastPrimitives.Viewport
                    className="fixed bottom-0 left-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-4 sm:left-4 sm:top-auto sm:flex-col sm:max-w-[420px] gap-2"
                />
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
                ))}
            </ToastPrimitives.Provider>
        </ToastContext.Provider>
    );
}

export const toastMessages = {
    // Auth
    loginSuccess: {
        title: 'Zalogowano pomyślnie',
        description: 'Witaj w panelu administracyjnym.',
        variant: 'success' as const,
    },
    loginError: {
        title: 'Błąd logowania',
        description: 'Nieprawidłowy email lub hasło.',
        variant: 'error' as const,
    },
    logoutSuccess: {
        title: 'Wylogowano',
        description: 'Do zobaczenia!',
        variant: 'info' as const,
    },
    sessionExpired: {
        title: 'Sesja wygasła',
        description: 'Zaloguj się ponownie.',
        variant: 'warning' as const,
    },

    // Products
    productCreated: {
        title: 'Produkt utworzony',
        description: 'Nowy produkt został dodany.',
        variant: 'success' as const,
    },
    productUpdated: {
        title: 'Produkt zaktualizowany',
        description: 'Zmiany zostały zapisane.',
        variant: 'success' as const,
    },
    productDeleted: {
        title: 'Produkt usunięty',
        description: 'Produkt został usunięty z systemu.',
        variant: 'success' as const,
    },
    productError: {
        title: 'Błąd operacji',
        description: 'Nie udało się wykonać operacji na produkcie.',
        variant: 'error' as const,
    },

    // Config
    draftSaved: {
        title: 'Draft zapisany',
        description: 'Zmiany w konfiguracji zostały zapisane.',
        variant: 'success' as const,
    },
    configPublished: {
        title: 'Konfiguracja opublikowana',
        description: 'Nowa wersja jest teraz dostępna publicznie.',
        variant: 'success' as const,
    },
    configError: {
        title: 'Błąd konfiguracji',
        description: 'Nie udało się zapisać konfiguracji.',
        variant: 'error' as const,
    },

    // Rollback
    rollbackSuccess: {
        title: 'Rollback wykonany',
        description: 'Konfiguracja została przywrócona do poprzedniej wersji.',
        variant: 'success' as const,
    },
    rollbackError: {
        title: 'Błąd rollbacku',
        description: 'Nie udało się przywrócić poprzedniej wersji.',
        variant: 'error' as const,
    },

    // Network
    networkError: {
        title: 'Błąd połączenia',
        description: 'Sprawdź połączenie z internetem i spróbuj ponownie.',
        variant: 'error' as const,
    },
    serverError: {
        title: 'Błąd serwera',
        description: 'Wystąpił problem po stronie serwera. Spróbuj ponownie później.',
        variant: 'error' as const,
    },

    // Generic
    saveSuccess: {
        title: 'Zapisano',
        description: 'Zmiany zostały zapisane.',
        variant: 'success' as const,
    },
    saveError: {
        title: 'Błąd zapisu',
        description: 'Nie udało się zapisać zmian.',
        variant: 'error' as const,
    },
    deleteSuccess: {
        title: 'Usunięto',
        description: 'Element został usunięty.',
        variant: 'success' as const,
    },
    deleteError: {
        title: 'Błąd usuwania',
        description: 'Nie udało się usunąć elementu.',
        variant: 'error' as const,
    },
} as const;

export function createErrorToast(message: string): Omit<Toast, 'id'> {
    return {
        title: 'Błąd',
        description: message,
        variant: 'error',
    };
}

export function createSuccessToast(message: string): Omit<Toast, 'id'> {
    return {
        title: 'Sukces',
        description: message,
        variant: 'success',
    };
}
