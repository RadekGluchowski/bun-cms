import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
    /** Label to display */
    label: string;
    /** Optional href - if not provided, item is not clickable */
    href?: string | undefined;
    /** Optional icon */
    icon?: React.ReactNode;
}

interface BreadcrumbsProps {
    /** Array of breadcrumb items */
    items: BreadcrumbItem[];
    /** Additional className */
    className?: string;
    /** Show home icon at the start */
    showHome?: boolean;
    /** Home href */
    homeHref?: string;
    /** Separator between items (default: ChevronRight) */
    separator?: React.ReactNode;
}

export function Breadcrumbs({
    items,
    className,
    showHome = false,
    homeHref = '/',
    separator,
}: BreadcrumbsProps) {
    const SeparatorIcon = separator ?? (
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    );

    // Add home item if showHome is true
    const allItems: BreadcrumbItem[] = showHome
        ? [{ label: 'Home', href: homeHref, icon: <Home className="h-4 w-4" /> }, ...items]
        : items;

    return (
        <nav
            data-testid="breadcrumbs"
            aria-label="Breadcrumb"
            className={cn('flex items-center gap-2 text-sm', className)}
        >
            {allItems.map((item, index) => {
                const isLast = index === allItems.length - 1;

                return (
                    <Fragment key={index}>
                        {index > 0 && SeparatorIcon}
                        {isLast || !item.href ? (
                            <span
                                data-testid={`breadcrumb-item-${index}`}
                                className={cn(
                                    'flex items-center gap-1.5',
                                    isLast
                                        ? 'text-foreground font-medium'
                                        : 'text-muted-foreground'
                                )}
                                aria-current={isLast ? 'page' : undefined}
                            >
                                {item.icon}
                                <span className="truncate max-w-[200px]">{item.label}</span>
                            </span>
                        ) : (
                            <Link
                                data-testid={`breadcrumb-link-${index}`}
                                to={item.href}
                                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {item.icon}
                                <span className="truncate max-w-[200px]">{item.label}</span>
                            </Link>
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}

export function createProductBreadcrumbs(
    productName?: string,
    productId?: string,
    currentPage?: string
): BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [{ label: 'Produkty', href: '/products' }];

    if (productName && productId) {
        items.push({
            label: productName,
            href: currentPage ? `/products/${productId}` : undefined,
        });
    }

    if (currentPage) {
        items.push({ label: currentPage });
    }

    return items;
}

export function createConfigBreadcrumbs(
    productName: string,
    productId: string,
    configType: string
): BreadcrumbItem[] {
    return [
        { label: 'Produkty', href: '/products' },
        { label: productName, href: `/products/${productId}` },
        { label: 'Konfiguracje' },
        { label: configType },
    ];
}
