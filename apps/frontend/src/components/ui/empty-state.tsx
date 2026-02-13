import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { FileQuestion, Inbox, Search } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
    /** Icon to display */
    icon?: LucideIcon;
    /** Main title */
    title: string;
    /** Description text */
    description?: string;
    /** Optional action button */
    action?: {
        label: string;
        onClick: () => void;
    } | undefined;
    /** Additional className */
    className?: string;
}

export const emptyStateIcons = {
    noData: Inbox,
    noResults: Search,
    notFound: FileQuestion,
} as const;

export function EmptyState({
    icon: Icon = Inbox,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-12 text-center',
                className
            )}
        >
            <div className="rounded-full bg-muted p-4 mb-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && (
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                    {description}
                </p>
            )}
            {action && (
                <Button
                    variant="outline"
                    className="mt-6"
                    onClick={action.onClick}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}

export function EmptyProductsList({ onAdd }: { onAdd?: () => void }) {
    return (
        <EmptyState
            icon={Inbox}
            title="Brak produktów"
            description="Zacznij od dodania pierwszego produktu."
            action={onAdd ? { label: 'Dodaj produkt', onClick: onAdd } : undefined}
        />
    );
}

export function NoSearchResults({ query }: { query?: string }) {
    return (
        <EmptyState
            icon={Search}
            title="Brak wyników"
            description={
                query
                    ? `Nie znaleziono wyników dla "${query}". Spróbuj innych słów kluczowych.`
                    : 'Nie znaleziono produktów pasujących do wyszukiwania.'
            }
        />
    );
}

export function EmptyConfig({
    configType,
    onCreateDraft,
}: {
    configType: string;
    onCreateDraft?: () => void;
}) {
    return (
        <EmptyState
            icon={FileQuestion}
            title="Brak konfiguracji"
            description={`Konfiguracja typu "${configType}" nie istnieje. Utwórz nowy draft, aby rozpocząć edycję.`}
            action={
                onCreateDraft
                    ? { label: 'Utwórz draft', onClick: onCreateDraft }
                    : undefined
            }
        />
    );
}

export function EmptyHistory() {
    return (
        <EmptyState
            icon={Inbox}
            title="Brak historii zmian"
            description="Ten produkt nie ma jeszcze żadnych zapisanych zmian konfiguracji. Historia będzie widoczna po utworzeniu lub edycji konfiguracji."
        />
    );
}
