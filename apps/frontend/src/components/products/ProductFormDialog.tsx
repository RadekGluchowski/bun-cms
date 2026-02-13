import type { CreateProductRequest, Product, UpdateProductRequest } from '@/api/products.api';
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input,
    Label,
    Textarea,
} from '@/components/ui';
import { useCreateProduct, useUpdateProduct } from '@/hooks';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProductFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: Product | null;
    onSuccess?: (product: Product) => void;
}

interface FormState {
    code: string;
    name: string;
    description: string;
    previewUrl: string;
}

interface FormErrors {
    code?: string;
    name?: string;
    description?: string;
    previewUrl?: string;
}

const INITIAL_FORM_STATE: FormState = {
    code: '',
    name: '',
    description: '',
    previewUrl: '',
};

function validateForm(form: FormState, isEdit: boolean): FormErrors {
    const errors: FormErrors = {};

    if (!isEdit) {
        if (!form.code.trim()) {
            errors.code = 'Kod produktu jest wymagany';
        } else if (form.code.length > 50) {
            errors.code = 'Kod produktu może mieć maksymalnie 50 znaków';
        } else if (!/^[a-zA-Z0-9_-]+$/.test(form.code)) {
            errors.code = 'Kod produktu może zawierać tylko litery, cyfry, - i _';
        }
    }

    if (!form.name.trim()) {
        errors.name = 'Nazwa produktu jest wymagana';
    } else if (form.name.length > 255) {
        errors.name = 'Nazwa produktu może mieć maksymalnie 255 znaków';
    }

    if (form.description.length > 1000) {
        errors.description = 'Opis może mieć maksymalnie 1000 znaków';
    }

    if (form.previewUrl.trim()) {
        try {
            new URL(form.previewUrl);
        } catch {
            errors.previewUrl = 'Podaj poprawny adres URL';
        }
    }

    return errors;
}

export function ProductFormDialog({
    open,
    onOpenChange,
    product,
    onSuccess,
}: ProductFormDialogProps) {
    const isEdit = Boolean(product);

    const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);

    const createMutation = useCreateProduct();
    const updateMutation = useUpdateProduct();

    const isLoading = createMutation.isPending || updateMutation.isPending;

    // Reset form when dialog opens/closes or product changes
    useEffect(() => {
        if (open) {
            if (product) {
                setForm({
                    code: product.code,
                    name: product.name,
                    description: product.description ?? '',
                    previewUrl: product.previewUrl ?? '',
                });
            } else {
                setForm(INITIAL_FORM_STATE);
            }
            setErrors({});
            setSubmitError(null);
        }
    }, [open, product]);

    /**
     * Handle form field change
     */
    function handleChange(field: keyof FormState, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
        if (submitError) {
            setSubmitError(null);
        }
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        const validationErrors = validateForm(form, isEdit);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            if (isEdit && product) {
                // Update existing product
                const updateData: UpdateProductRequest = {
                    name: form.name.trim(),
                    description: form.description.trim() || null,
                    previewUrl: form.previewUrl.trim() || null,
                };

                const updatedProduct = await updateMutation.mutateAsync({
                    id: product.id,
                    data: updateData,
                });

                onSuccess?.(updatedProduct);
            } else {
                // Create new product
                const createData: CreateProductRequest = {
                    code: form.code.trim(),
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    previewUrl: form.previewUrl.trim() || undefined,
                };

                const newProduct = await createMutation.mutateAsync(createData);
                onSuccess?.(newProduct);
            }

            onOpenChange(false);
        } catch (error) {
            if (error instanceof Error) {
                // Handle specific errors
                if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                    setSubmitError('Produkt o tym kodzie już istnieje');
                } else {
                    setSubmitError(error.message);
                }
            } else {
                setSubmitError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" data-testid="product-form-dialog">
                <form onSubmit={handleSubmit} noValidate>
                    <DialogHeader>
                        <DialogTitle>
                            {isEdit ? 'Edytuj produkt' : 'Nowy produkt'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEdit
                                ? 'Zmień dane produktu. Kod produktu nie może być zmieniony.'
                                : 'Wypełnij formularz, aby utworzyć nowy produkt.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Submit Error */}
                        {submitError && (
                            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive" data-testid="product-form-error-message">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{submitError}</span>
                            </div>
                        )}

                        {/* Code Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="code" required={!isEdit}>
                                Kod produktu
                            </Label>
                            <Input
                                id="code"
                                data-testid="product-form-code-input"
                                value={form.code}
                                onChange={(e) => handleChange('code', e.target.value)}
                                placeholder="np. my-product"
                                disabled={isEdit || isLoading}
                                className={errors.code ? 'border-destructive' : ''}
                            />
                            {errors.code && (
                                <p className="text-sm text-destructive" data-testid="product-form-code-error">{errors.code}</p>
                            )}
                            {isEdit && (
                                <p className="text-xs text-muted-foreground">
                                    Kod produktu nie może być zmieniony po utworzeniu
                                </p>
                            )}
                        </div>

                        {/* Name Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="name" required>
                                Nazwa produktu
                            </Label>
                            <Input
                                id="name"
                                data-testid="product-form-name-input"
                                value={form.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="np. Mój produkt"
                                disabled={isLoading}
                                className={errors.name ? 'border-destructive' : ''}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive" data-testid="product-form-name-error">{errors.name}</p>
                            )}
                        </div>

                        {/* Description Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="description">Opis</Label>
                            <Textarea
                                id="description"
                                data-testid="product-form-description-input"
                                value={form.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Opcjonalny opis produktu..."
                                disabled={isLoading}
                                rows={3}
                                className={errors.description ? 'border-destructive' : ''}
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive" data-testid="product-form-description-error">{errors.description}</p>
                            )}
                        </div>

                        {/* Preview URL Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="previewUrl">URL podglądu</Label>
                            <Input
                                id="previewUrl"
                                data-testid="product-form-preview-url-input"
                                type="url"
                                value={form.previewUrl}
                                onChange={(e) => handleChange('previewUrl', e.target.value)}
                                placeholder="https://preview.example.com/product"
                                disabled={isLoading}
                                className={errors.previewUrl ? 'border-destructive' : ''}
                            />
                            {errors.previewUrl && (
                                <p className="text-sm text-destructive" data-testid="product-form-preview-url-error">{errors.previewUrl}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            data-testid="product-form-cancel-button"
                        >
                            Anuluj
                        </Button>
                        <Button type="submit" disabled={isLoading} data-testid="product-form-submit-button">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? 'Zapisz zmiany' : 'Utwórz produkt'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
