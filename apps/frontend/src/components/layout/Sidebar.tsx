import { Button } from '@/components/ui/button';
import { toastMessages, useToast } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { LayoutDashboard, LogOut, Menu, Package, Users, X } from 'lucide-react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
    to: string;
    label: string;
    icon: React.ReactNode;
    testId: string;
}

interface SidebarContextValue {
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
    open: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within SidebarProvider');
    }
    return context;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const value: SidebarContextValue = {
        isOpen,
        toggle: () => setIsOpen((prev) => !prev),
        close: () => setIsOpen(false),
        open: () => setIsOpen(true),
    };

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
}

export function SidebarToggle({ className }: { className?: string }) {
    const { isOpen, toggle } = useSidebar();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className={cn('lg:hidden', className)}
            aria-label={isOpen ? 'Zamknij menu' : 'Otwórz menu'}
            data-testid="sidebar-toggle"
        >
            {isOpen ? (
                <X className="h-5 w-5" />
            ) : (
                <Menu className="h-5 w-5" />
            )}
        </Button>
    );
}

function SidebarOverlay() {
    const { isOpen, close } = useSidebar();

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={close}
            aria-hidden="true"
            data-testid="sidebar-overlay"
        />
    );
}

export function Sidebar() {
    const navigate = useNavigate();
    const { isOpen, close } = useSidebar();
    const { toast } = useToast();
    const admin = useAuthStore((state) => state.admin);

    const navItems: NavItem[] = [
        {
            to: '/products',
            label: 'Produkty',
            icon: <Package className="h-5 w-5" />,
            testId: 'sidebar-nav-products',
        },
        ...(admin?.role === 'admin'
            ? [
                  {
                      to: '/admins',
                      label: 'Użytkownicy',
                      icon: <Users className="h-5 w-5" />,
                      testId: 'sidebar-nav-admins',
                  },
              ]
            : []),
    ];

    const handleLogout = () => {
        useAuthStore.getState().logout();
        toast(toastMessages.logoutSuccess);
        navigate('/login');
    };

    return (
        <>
            <SidebarOverlay />

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out',
                    'lg:relative lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex h-16 items-center justify-between gap-2 border-b px-6">
                    <div className="flex items-center gap-2" data-testid="sidebar-logo">
                        <LayoutDashboard className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold">CMS</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={close}
                        className="lg:hidden"
                        aria-label="Zamknij menu"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            data-testid={item.testId}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t p-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-muted-foreground"
                        onClick={handleLogout}
                        data-testid="sidebar-logout-button"
                    >
                        <LogOut className="h-5 w-5" />
                        Wyloguj się
                    </Button>
                </div>
            </aside>
        </>
    );
}
