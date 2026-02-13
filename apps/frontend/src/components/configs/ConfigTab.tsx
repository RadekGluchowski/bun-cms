import { cn } from '@/lib/utils';
import { formatConfigTypeName } from '@/pages/ConfigEditorPage.utils';

export function ConfigTab({
    configType,
    isActive,
    hasPendingChanges,
    onClick,
}: {
    configType: string;
    isActive: boolean;
    hasPendingChanges: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            data-testid={`config-editor-tab-${configType}`}
            className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm whitespace-nowrap',
                isActive ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
            )}
        >
            <span>{formatConfigTypeName(configType)}</span>
            {hasPendingChanges && <span className="h-2 w-2 rounded-full bg-amber-400" />}
        </button>
    );
}
