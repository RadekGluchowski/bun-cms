import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { useCallback, useState } from 'react';

interface JsonViewerProps {
    /** JSON data to display */
    data: unknown;
    /** Initial collapsed state for root level */
    initialCollapsed?: boolean;
    /** Maximum depth to auto-expand (default: 2) */
    maxAutoExpandDepth?: number;
    /** Custom className for container */
    className?: string;
    /** Show copy button */
    showCopyButton?: boolean;
}

interface JsonNodeProps {
    /** Node key (property name) */
    nodeKey: string;
    /** Node value */
    value: unknown;
    /** Current nesting depth */
    depth: number;
    /** Maximum depth to auto-expand */
    maxAutoExpandDepth: number;
    /** Whether this is the last item in parent */
    isLast?: boolean;
    /** Whether to show the key (false for array items) */
    showKey?: boolean;
}

function getValueInfo(value: unknown): { type: string; color: string; displayValue: string } {
    if (value === null) {
        return { type: 'null', color: 'text-gray-500', displayValue: 'null' };
    }
    if (value === undefined) {
        return { type: 'undefined', color: 'text-gray-500', displayValue: 'undefined' };
    }
    if (typeof value === 'boolean') {
        return { type: 'boolean', color: 'text-purple-600 dark:text-purple-400', displayValue: String(value) };
    }
    if (typeof value === 'number') {
        return { type: 'number', color: 'text-blue-600 dark:text-blue-400', displayValue: String(value) };
    }
    if (typeof value === 'string') {
        return { type: 'string', color: 'text-green-600 dark:text-green-400', displayValue: `"${value}"` };
    }
    if (Array.isArray(value)) {
        return { type: 'array', color: '', displayValue: '' };
    }
    if (typeof value === 'object') {
        return { type: 'object', color: '', displayValue: '' };
    }
    return { type: 'unknown', color: 'text-gray-500', displayValue: String(value) };
}

function getCollapsedPreview(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.length} items]`;
    }
    if (typeof value === 'object' && value !== null) {
        const keys = Object.keys(value);
        if (keys.length === 0) return '{}';
        if (keys.length <= 3) {
            return `{ ${keys.join(', ')} }`;
        }
        return `{ ${keys.slice(0, 3).join(', ')}, ... }`;
    }
    return '';
}

function JsonNode({ nodeKey, value, depth, maxAutoExpandDepth, isLast = false, showKey = true }: JsonNodeProps) {
    const isExpandable = (typeof value === 'object' && value !== null);
    const [isExpanded, setIsExpanded] = useState(depth < maxAutoExpandDepth);

    const { color, displayValue } = getValueInfo(value);
    const indent = depth * 16;

    const handleToggle = useCallback(() => {
        setIsExpanded((prev) => !prev);
    }, []);

    // Primitive value
    if (!isExpandable) {
        return (
            <div
                className="flex items-start py-0.5 font-mono text-sm"
                style={{ paddingLeft: `${indent}px` }}
            >
                {showKey && nodeKey && (
                    <>
                        <span className="text-foreground">{nodeKey}</span>
                        <span className="text-muted-foreground mx-1">:</span>
                    </>
                )}
                <span className={color}>{displayValue}</span>
                {!isLast && <span className="text-muted-foreground">,</span>}
            </div>
        );
    }

    // Array or Object
    const isArray = Array.isArray(value);
    const entries = isArray
        ? (value as unknown[]).map((v, i) => [String(i), v] as const)
        : Object.entries(value as Record<string, unknown>);
    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';

    return (
        <div>
            {/* Header with toggle */}
            <div
                className={cn(
                    "flex items-start py-0.5 font-mono text-sm cursor-pointer hover:bg-muted/50 rounded",
                    "select-none"
                )}
                style={{ paddingLeft: `${indent}px` }}
                onClick={handleToggle}
            >
                <span className="w-4 h-4 flex items-center justify-center text-muted-foreground mr-1">
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </span>
                {showKey && nodeKey && (
                    <>
                        <span className="text-foreground">{nodeKey}</span>
                        <span className="text-muted-foreground mx-1">:</span>
                    </>
                )}
                {isExpanded ? (
                    <span className="text-muted-foreground">{openBracket}</span>
                ) : (
                    <>
                        <span className="text-muted-foreground">{openBracket}</span>
                        <span className="text-muted-foreground italic ml-1">{getCollapsedPreview(value)}</span>
                        <span className="text-muted-foreground">{closeBracket}</span>
                        {!isLast && <span className="text-muted-foreground">,</span>}
                    </>
                )}
            </div>

            {/* Children (when expanded) */}
            {isExpanded && (
                <>
                    {entries.map(([key, val], index) => (
                        <JsonNode
                            key={key}
                            nodeKey={key}
                            value={val}
                            depth={depth + 1}
                            maxAutoExpandDepth={maxAutoExpandDepth}
                            isLast={index === entries.length - 1}
                            showKey={!isArray}
                        />
                    ))}
                    <div
                        className="py-0.5 font-mono text-sm text-muted-foreground"
                        style={{ paddingLeft: `${indent}px` }}
                    >
                        {closeBracket}
                        {!isLast && ','}
                    </div>
                </>
            )}
        </div>
    );
}

export function JsonViewer({
    data,
    initialCollapsed = false,
    maxAutoExpandDepth = 2,
    className,
    showCopyButton = true,
}: JsonViewerProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy JSON:', error);
        }
    }, [data]);

    const effectiveMaxDepth = initialCollapsed ? 0 : maxAutoExpandDepth;

    return (
        <div className={cn("relative rounded-lg border bg-muted/30 p-4", className)}>
            {showCopyButton && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={handleCopy}
                    title="Kopiuj JSON"
                >
                    {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                </Button>
            )}
            <div className="overflow-auto max-h-[500px]">
                <JsonNode
                    nodeKey=""
                    value={data}
                    depth={0}
                    maxAutoExpandDepth={effectiveMaxDepth}
                    isLast
                    showKey={false}
                />
            </div>
        </div>
    );
}
