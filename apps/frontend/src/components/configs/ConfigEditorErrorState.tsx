import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { AlertCircle } from 'lucide-react';

export function ConfigEditorErrorState({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Błąd
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{message}</p>
                <Button onClick={onRetry} variant="outline">
                    Spróbuj ponownie
                </Button>
            </CardContent>
        </Card>
    );
}
