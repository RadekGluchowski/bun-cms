import { Card, CardContent, CardHeader, Skeleton } from '@/components/ui';

export function ConfigEditorSkeleton() {
    return (
        <div className="space-y-6" data-testid="config-editor-loading-skeleton">
            {/* Breadcrumb skeleton */}
            <Skeleton className="h-4 w-64" />
            {/* Tabs skeleton */}
            <div className="flex gap-2 border-b pb-2 overflow-x-auto">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-28" />
            </div>

            {/* Header skeleton */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <Skeleton className="h-7 w-56" />
                <Skeleton className="h-9 w-28" />
            </div>

            {/* Cards skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-40" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-40" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[420px] w-full" />
                    </CardContent>
                </Card>
            </div>

            {/* Actions skeleton */}
            <div className="flex items-center justify-between gap-3 flex-wrap border-t pt-4">
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-28" />
                    <Skeleton className="h-9 w-28" />
                </div>
            </div>
        </div>
    );
}
