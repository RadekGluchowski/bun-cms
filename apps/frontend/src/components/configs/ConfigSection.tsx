import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useCallback, useState } from 'react';
import { ConfigField } from './ConfigField';

export interface ConfigSectionProps {
    /** Section name (e.g., "App") */
    sectionName: string;
    /** Fields in this section as key-value pairs */
    fields: Record<string, unknown>;
    /** Set of highlighted field keys (matching search) */
    highlightedKeys: Set<string>;
    /** Callback when field value changes */
    onFieldChange: (key: string, value: unknown) => void;
    /** Callback when field validation state changes */
    onValidationChange?: (key: string, hasError: boolean) => void;
    /** Whether fields are disabled */
    disabled?: boolean;
    /** Whether section should be initially expanded */
    defaultExpanded?: boolean;
}

export function ConfigSection({
    sectionName,
    fields,
    highlightedKeys,
    onFieldChange,
    onValidationChange,
    disabled = false,
    defaultExpanded = true,
}: ConfigSectionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const fieldKeys = Object.keys(fields).sort();
    const fieldCount = fieldKeys.length;
    const highlightedCount = fieldKeys.filter((key) => highlightedKeys.has(key)).length;

    const handleToggle = useCallback(() => {
        setIsExpanded((prev) => !prev);
    }, []);

    // Display name: show "Ogólne" for _root section
    const displayName = sectionName === '_root' ? 'Ogólne' : sectionName;

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Section Header */}
            <Button
                variant="ghost"
                className={cn(
                    'w-full justify-between px-4 py-3 h-auto rounded-none',
                    'hover:bg-muted/50 transition-colors',
                    isExpanded && 'border-b'
                )}
                onClick={handleToggle}
            >
                <div className="flex items-center gap-2">
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-medium">{displayName}</span>
                    <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">
                        {fieldCount} {fieldCount === 1 ? 'pole' : fieldCount < 5 ? 'pola' : 'pól'}
                    </span>
                    {highlightedCount > 0 && (
                        <span className="text-xs text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                            {highlightedCount} pasuje
                        </span>
                    )}
                </div>
            </Button>

            {/* Section Content */}
            {isExpanded && (
                <div className="divide-y">
                    {fieldKeys.map((key) => (
                        <ConfigField
                            key={key}
                            fieldKey={key}
                            value={fields[key]}
                            onChange={onFieldChange}
                            {...(onValidationChange && { onValidationChange })}
                            isHighlighted={highlightedKeys.has(key)}
                            disabled={disabled}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
