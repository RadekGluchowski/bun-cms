import { Layout } from '@/components/layout';
import { ProtectedRoute, RequireAdminRoute } from '@/components/shared';
import {
    AdminsPage,
    ConfigEditorPage,
    HistoryPage,
    LoginPage,
    ProductDetailPage,
    ProductsListPage,
} from '@/pages';
import { createBrowserRouter, Navigate } from 'react-router-dom';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Navigate to="/products" replace />,
            },
            {
                path: 'products',
                element: <ProductsListPage />,
            },
            {
                path: 'products/:id',
                element: <ProductDetailPage />,
            },
            {
                path: 'products/:id/configs/:type',
                element: <ConfigEditorPage />,
            },
            {
                path: 'products/:id/history',
                element: <HistoryPage />,
            },
            {
                path: 'admins',
                element: (
                    <RequireAdminRoute>
                        <AdminsPage />
                    </RequireAdminRoute>
                ),
            },
        ],
    },
]);
