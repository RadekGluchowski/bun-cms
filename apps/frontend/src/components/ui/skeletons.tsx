import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface TableSkeletonProps {
    /** Number of rows to display */
    rows?: number;
    /** Number of columns to display */
    columns?: number;
    /** Additional className */
    className?: string;
    /** Show header row */
    showHeader?: boolean;
}

interface CardSkeletonProps {
    /** Additional className */
    className?: string;
    /** Show header section */
    showHeader?: boolean;
    /** Show footer section */
    showFooter?: boolean;
    /** Number of content lines */
    lines?: number;
}

interface FormSkeletonProps {
    /** Number of fields to display */
    fields?: number;
    /** Additional className */
    className?: string;
    /** Show submit button */
    showSubmit?: boolean;
}

export function TableSkeleton({
    rows = 5,
    columns = 4,
    className,
    showHeader = true,
}: TableSkeletonProps) {
    return (
        <div className={cn('w-full', className)}>
            {/* Header */}
            {showHeader && (
                <div className="flex items-center gap-4 p-4 border-b">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton
                            key={`header-${i}`}
                            className={cn(
                                'h-4',
                                i === 0 ? 'w-[200px]' : 'w-[100px]'
                            )}
                        />
                    ))}
                </div>
            )}
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={`row-${rowIndex}`}
                    className="flex items-center gap-4 p-4 border-b last:border-b-0"
                >
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={`cell-${rowIndex}-${colIndex}`}
                            className={cn(
                                'h-5',
                                colIndex === 0 ? 'w-[180px]' : 'w-[80px] flex-shrink-0',
                                colIndex === columns - 1 && 'ml-auto'
                            )}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton({
    className,
    showHeader = true,
    showFooter = false,
    lines = 3,
}: CardSkeletonProps) {
    return (
        <div
            className={cn(
                'rounded-lg border bg-card p-6 space-y-4',
                className
            )}
        >
            {/* Header */}
            {showHeader && (
                <div className="space-y-2">
                    <Skeleton className="h-6 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </div>
            )}
            {/* Content lines */}
            <div className="space-y-3">
                {Array.from({ length: lines }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className={cn(
                            'h-4',
                            i % 2 === 0 ? 'w-full' : 'w-[80%]'
                        )}
                    />
                ))}
            </div>
            {/* Footer */}
            {showFooter && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Skeleton className="h-9 w-[80px]" />
                    <Skeleton className="h-9 w-[100px]" />
                </div>
            )}
        </div>
    );
}

export function FormSkeleton({
    fields = 4,
    className,
    showSubmit = true,
}: FormSkeletonProps) {
    return (
        <div className={cn('space-y-6', className)}>
            {/* Fields */}
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
            {/* Submit button */}
            {showSubmit && (
                <div className="flex justify-end pt-4">
                    <Skeleton className="h-10 w-[120px]" />
                </div>
            )}
        </div>
    );
}

export function PageSkeleton({
    className,
    showBreadcrumb = true,
}: {
    className?: string;
    showBreadcrumb?: boolean;
}) {
    return (
        <div className={cn('space-y-6', className)}>
            {/* Breadcrumb */}
            {showBreadcrumb && <Skeleton className="h-4 w-48" />}
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-24" />
            </div>
            {/* Content */}
            <CardSkeleton lines={5} showFooter />
        </div>
    );
}
