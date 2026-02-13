import { Input, Label, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';
import { getValueType, parseValue, type ValueType } from '@/utils/config.utils';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface ConfigFieldProps {
    /** Field key (e.g., "App.Title") */
    fieldKey: string;
    /** Current value */
    value: unknown;
    /** Callback when value changes */
    onChange: (key: string, value: unknown) => void;
    /** Callback when validation state changes */
    onValidationChange?: (key: string, hasError: boolean) => void;
    /** Whether the field is highlighted (matches search) */
    isHighlighted?: boolean;
    /** Whether the field is disabled */
    disabled?: boolean;
}

export function ConfigField({
    fieldKey,
    value,
    onChange,
    onValidationChange,
    isHighlighted = false,
    disabled = false,
}: ConfigFieldProps) {
    const valueType = useMemo(() => getValueType(value), [value]);

    // Extract display label from key (part after last ".")
    const displayLabel = useMemo(() => {
        const lastDotIndex = fieldKey.lastIndexOf('.');
        return lastDotIndex !== -1 ? fieldKey.substring(lastDotIndex + 1) : fieldKey;
    }, [fieldKey]);

    const handleStringChange = useCallback(
        (newValue: string) => {
            onChange(fieldKey, newValue);
        },
        [fieldKey, onChange]
    );

    const handleNumberChange = useCallback(
        (newValue: string) => {
            const parsed = parseValue(newValue, 'number');
            onChange(fieldKey, parsed);
        },
        [fieldKey, onChange]
    );

    const handleBooleanChange = useCallback(
        (checked: boolean) => {
            onChange(fieldKey, checked);
        },
        [fieldKey, onChange]
    );

    const handleJsonChange = useCallback(
        (newValue: string, type: ValueType) => {
            const parsed = parseValue(newValue, type);
            onChange(fieldKey, parsed);
        },
        [fieldKey, onChange]
    );

    const handleJsonValidationChange = useCallback(
        (hasError: boolean) => {
            onValidationChange?.(fieldKey, hasError);
        },
        [fieldKey, onValidationChange]
    );

    const fieldClasses = cn(
        'space-y-2 rounded-md p-3 transition-colors',
        isHighlighted && 'bg-yellow-100 dark:bg-yellow-900/30 ring-2 ring-yellow-400'
    );

    return (
        <div className={fieldClasses}>
            <div className="flex items-center justify-between gap-2">
                <Label
                    htmlFor={fieldKey}
                    className="text-sm font-medium cursor-pointer"
                    title={fieldKey}
                >
                    {displayLabel}
                </Label>
                <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                    {valueType}
                </span>
            </div>

            {renderInput(
                valueType,
                fieldKey,
                value,
                disabled,
                handleStringChange,
                handleNumberChange,
                handleBooleanChange,
                handleJsonChange,
                handleJsonValidationChange
            )}

            {/* Full key path as hint */}
            <p className="text-xs text-muted-foreground truncate" title={fieldKey}>
                {fieldKey}
            </p>
        </div>
    );
}

interface JsonFieldProps {
    fieldKey: string;
    value: unknown;
    valueType: ValueType;
    disabled: boolean;
    onJsonChange: (value: string, type: ValueType) => void;
    onValidationChange: (hasError: boolean) => void;
}

function JsonField({ fieldKey, value, valueType, disabled, onJsonChange, onValidationChange }: JsonFieldProps) {
    const [localText, setLocalText] = useState(() => JSON.stringify(value, null, 2));
    const [hasError, setHasError] = useState(false);

    // Sync local text when external value changes (e.g., from undo or external update)
    useEffect(() => {
        const externalJson = JSON.stringify(value, null, 2);
        // Only sync if the parsed values are different (to avoid overwriting during editing)
        try {
            const localParsed = JSON.parse(localText);
            if (JSON.stringify(localParsed, null, 2) !== externalJson) {
                setLocalText(externalJson);
                setHasError(false);
                onValidationChange(false);
            }
        } catch {
            // If local text is invalid JSON, sync from external
            setLocalText(externalJson);
            setHasError(false);
            onValidationChange(false);
        }
    }, [value]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setLocalText(newText);

        // Validate JSON
        try {
            JSON.parse(newText);
            setHasError(false);
            onValidationChange(false);
        } catch {
            setHasError(true);
            onValidationChange(true);
        }
    }, [onValidationChange]);

    const handleBlur = useCallback(() => {
        // Only commit valid JSON on blur
        try {
            JSON.parse(localText);
            onJsonChange(localText, valueType);
            setHasError(false);
            onValidationChange(false);
        } catch {
            setHasError(true);
            onValidationChange(true);
        }
    }, [localText, valueType, onJsonChange, onValidationChange]);

    return (
        <div className="space-y-1">
            <Textarea
                id={fieldKey}
                value={localText}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={disabled}
                className={cn(
                    'font-mono text-sm min-h-[80px]',
                    hasError && 'border-destructive focus-visible:ring-destructive'
                )}
                rows={4}
            />
            {hasError && (
                <p className="text-xs text-destructive">Nieprawidłowy JSON</p>
            )}
        </div>
    );
}

function renderInput(
    valueType: ValueType,
    fieldKey: string,
    value: unknown,
    disabled: boolean,
    onStringChange: (value: string) => void,
    onNumberChange: (value: string) => void,
    onBooleanChange: (checked: boolean) => void,
    onJsonChange: (value: string, type: ValueType) => void,
    onValidationChange: (hasError: boolean) => void
): React.ReactNode {
    switch (valueType) {
        case 'string':
            return (
                <Input
                    id={fieldKey}
                    type="text"
                    value={value as string}
                    onChange={(e) => onStringChange(e.target.value)}
                    disabled={disabled}
                    className="font-mono text-sm"
                />
            );

        case 'number':
            return (
                <Input
                    id={fieldKey}
                    type="number"
                    value={String(value)}
                    onChange={(e) => onNumberChange(e.target.value)}
                    disabled={disabled}
                    className="font-mono text-sm"
                />
            );

        case 'boolean':
            return (
                <div className="flex items-center gap-2">
                    <input
                        id={fieldKey}
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => onBooleanChange(e.target.checked)}
                        disabled={disabled}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground">
                        {value ? 'true' : 'false'}
                    </span>
                </div>
            );

        case 'array':
        case 'object':
            return (
                <JsonField
                    fieldKey={fieldKey}
                    value={value}
                    valueType={valueType}
                    disabled={disabled}
                    onJsonChange={onJsonChange}
                    onValidationChange={onValidationChange}
                />
            );

        case 'null':
        default:
            return (
                <Input
                    id={fieldKey}
                    type="text"
                    value={value === null ? 'null' : String(value)}
                    onChange={(e) => onStringChange(e.target.value === 'null' ? null as unknown as string : e.target.value)}
                    disabled={disabled}
                    className="font-mono text-sm"
                    placeholder="null"
                />
            );
    }
}
