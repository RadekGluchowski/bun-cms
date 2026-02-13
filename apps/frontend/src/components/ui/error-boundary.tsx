import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './button';

interface ErrorBoundaryProps {
    /** Child components */
    children: ReactNode;
    /** Fallback UI to render on error (optional, uses default if not provided) */
    fallback?: ReactNode;
    /** Callback when error is caught */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** Custom error message */
    errorMessage?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

interface ErrorStateProps {
    /** Error message to display */
    message: string;
    /** Retry callback */
    onRetry?: () => void;
    /** Additional className */
    className?: string;
    /** Whether retry is in progress */
    isRetrying?: boolean;
    /** Show back button */
    showBack?: boolean;
    /** Back button href */
    backHref?: string;
    /** Back button label */
    backLabel?: string;
}

export function ErrorState({
    message,
    onRetry,
    className,
    isRetrying = false,
    showBack = false,
    backHref = '/',
    backLabel = 'Powrót',
}: ErrorStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-12 text-center',
                className
            )}
        >
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold">Błąd ładowania</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
                {message}
            </p>
            <div className="mt-6 flex gap-2">
                {showBack && (
                    <Button variant="outline" asChild>
                        <a href={backHref}>{backLabel}</a>
                    </Button>
                )}
                {onRetry && (
                    <Button onClick={onRetry} disabled={isRetrying}>
                        {isRetrying ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Ponawiam...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Spróbuj ponownie
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Call optional error handler
        this.props.onError?.(error, errorInfo);
    }

    handleRefresh = (): void => {
        // Reset state and reload page
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    handleRetry = (): void => {
        // Reset state to try rendering again
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
                    <div className="rounded-full bg-destructive/10 p-4 mb-4">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">
                        Coś poszło nie tak
                    </h2>
                    <p className="text-muted-foreground max-w-md mb-6">
                        {this.props.errorMessage ??
                            'Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę lub skontaktuj się z administratorem.'}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={this.handleRetry}>
                            Spróbuj ponownie
                        </Button>
                        <Button onClick={this.handleRefresh}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Odśwież stronę
                        </Button>
                    </div>
                    {/* Show error details in development */}
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="mt-8 text-left w-full max-w-xl">
                            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                                Szczegóły błędu (tylko development)
                            </summary>
                            <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-auto max-h-[200px]">
                                {this.state.error.stack ?? this.state.error.message}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export function PageErrorBoundary({ children }: { children: ReactNode }) {
    return (
        <ErrorBoundary
            errorMessage="Nie udało się załadować tej strony. Spróbuj odświeżyć lub wróć do strony głównej."
        >
            {children}
        </ErrorBoundary>
    );
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
    return (
        <ErrorBoundary
            errorMessage="Wystąpił krytyczny błąd aplikacji. Spróbuj odświeżyć stronę."
        >
            {children}
        </ErrorBoundary>
    );
}
