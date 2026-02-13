import { CommandPalette } from '@/components/command-palette';
import { useAuth, useCommandPalette } from '@/hooks';
import { useAuthStore } from '@/stores/auth.store';
import { LogOut, Search, User } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { Button } from '../ui/button';
import { PageErrorBoundary } from '../ui/error-boundary';
import { Sidebar, SidebarProvider, SidebarToggle } from './Sidebar';

export function Layout() {
    const admin = useAuthStore((state) => state.admin);
    const { logout } = useAuth();
    const { isOpen, open, close } = useCommandPalette();

    return (
        <SidebarProvider>
            <div className="flex h-screen bg-background">
                <Sidebar />

                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
                        {/* Mobile menu button */}
                        <div className="flex items-center gap-4">
                            <SidebarToggle />
                            <h1 className="text-lg font-semibold hidden sm:block">
                                Panel administracyjny
                            </h1>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Search button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={open}
                                className="hidden gap-2 text-muted-foreground sm:flex"
                            >
                                <Search className="h-4 w-4" />
                                <span className="hidden md:inline">Szukaj...</span>
                                <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex">
                                    <span className="text-xs">Ctrl</span>K
                                </kbd>
                            </Button>
                            {/* Mobile search button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={open}
                                className="sm:hidden"
                            >
                                <Search className="h-5 w-5" />
                            </Button>

                            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span className="hidden md:inline">
                                    {admin?.name ?? 'Administrator'}
                                </span>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={logout}
                                className="text-muted-foreground hover:text-foreground"
                                data-testid="header-logout-button"
                            >
                                <LogOut className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Wyloguj</span>
                            </Button>
                        </div>
                    </header>

                    {/* Main content */}
                    <main className="flex-1 overflow-auto p-4 lg:p-6">
                        <PageErrorBoundary>
                            <Outlet />
                        </PageErrorBoundary>
                    </main>
                </div>

                {/* Command Palette */}
                <CommandPalette isOpen={isOpen} onClose={close} />
            </div>
        </SidebarProvider>
    );
}
