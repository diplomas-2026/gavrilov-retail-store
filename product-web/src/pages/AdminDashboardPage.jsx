import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <section className="panel" data-testid="admin-dashboard-page">
      <h1>Панель управления</h1>
      <p className="muted">Управляйте каталогом, заказами и пользователями магазина.</p>
      <div className="admin-grid">
        <Link className="admin-link" to="/admin/products">
          Товары
        </Link>
        <Link className="admin-link" to="/admin/categories">
          Категории
        </Link>
        <Link className="admin-link" to="/admin/orders">
          Заказы
        </Link>
        {isAdmin && (
          <Link className="admin-link" to="/admin/pickup-points">
            Пункты выдачи
          </Link>
        )}
        {isAdmin && (
          <Link className="admin-link" to="/admin/users">
            Пользователи и роли
          </Link>
        )}
      </div>
    </section>
  );
}
