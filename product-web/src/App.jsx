import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import AssistantWidget from './components/AssistantWidget';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import PickupPointsPage from './pages/PickupPointsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminPickupPointsPage from './pages/AdminPickupPointsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import ForbiddenPage from './pages/ForbiddenPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="pickup-points" element={<PickupPointsPage />} />
          <Route path="products/:id" element={<ProductDetailsPage />} />
          <Route
            path="cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile/orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="admin"
            element={
              <ProtectedRoute>
                <RoleRoute roles={['MANAGER', 'ADMIN']}>
                  <AdminDashboardPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/products"
            element={
              <ProtectedRoute>
                <RoleRoute roles={['MANAGER', 'ADMIN']}>
                  <AdminProductsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/categories"
            element={
              <ProtectedRoute>
                <RoleRoute roles={['MANAGER', 'ADMIN']}>
                  <AdminCategoriesPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/orders"
            element={
              <ProtectedRoute>
                <RoleRoute roles={['MANAGER', 'ADMIN']}>
                  <AdminOrdersPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/pickup-points"
            element={
              <ProtectedRoute>
                <RoleRoute roles={['ADMIN']}>
                  <AdminPickupPointsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute>
                <RoleRoute roles={['ADMIN']}>
                  <AdminUsersPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route path="forbidden" element={<ForbiddenPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      </Routes>
      <AssistantWidget />
    </>
  );
}
