import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { formatConfigTypeName } from '@/pages/ConfigEditorPage.utils';
import { Loader2 } from 'lucide-react';

export function ConfigEditorEmptyState({
    configType,
    onCreateDraft,
    isCreating,
}: {
    configType: string;
    onCreateDraft: () => void;
    isCreating: boolean;
}) {
    return (
        <Card data-testid="config-editor-empty-state">
            <CardHeader>
                <CardTitle>Brak konfiguracji</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    Dla typu <span className="font-medium">{formatConfigTypeName(configType)}</span> nie ma jeszcze draft/published.
                </p>
                <Button onClick={onCreateDraft} disabled={isCreating} data-testid="config-editor-create-draft-button">
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Utwórz draft
                </Button>
            </CardContent>
        </Card>
    );
}
