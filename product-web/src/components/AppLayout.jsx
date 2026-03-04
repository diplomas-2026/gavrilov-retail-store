import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { items } = useCart();

  const canManage = user && ['ADMIN', 'MANAGER'].includes(user.role);
  const isAdmin = user?.role === 'ADMIN';
  const isCustomer = user?.role === 'CUSTOMER';
  const roleLabel = user?.role === 'ADMIN'
    ? 'Администратор'
    : user?.role === 'MANAGER'
      ? 'Менеджер'
      : user?.role === 'CUSTOMER'
        ? 'Покупатель'
        : user?.role;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          Магазин ИП Гаврилова
        </Link>

        <nav className="nav">
          <NavLink to="/">Каталог</NavLink>
          {isCustomer && <NavLink to="/cart">Корзина ({items.length})</NavLink>}
          {isCustomer && <NavLink to="/profile/orders">Мои заказы</NavLink>}
          {canManage && <NavLink to="/admin">Управление</NavLink>}
          {isAdmin && <NavLink to="/admin/users">Пользователи</NavLink>}
        </nav>

        <div className="user-block">
          {user ? (
            <>
              <div>
                <strong>{user.fullName}</strong>
                <div className="role-tag">Роль: {roleLabel}</div>
              </div>
              <button className="ghost-btn" onClick={logout} data-testid="logout-button">
                Выйти
              </button>
            </>
          ) : (
            <Link className="primary-btn" to="/login">
              Войти
            </Link>
          )}
        </div>
      </header>

      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
