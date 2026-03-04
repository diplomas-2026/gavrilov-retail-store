import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';
import { getDeliveryTypeLabel, getOrderStatusLabel } from '../utils/orderLabels';

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getMyOrders()
      .then(setOrders)
      .catch((err) => setError(err.message || 'Ошибка загрузки заказов'));
  }, []);

  return (
    <section className="panel" data-testid="my-orders-page">
      <h1>Мои заказы</h1>
      {error && <div className="error-box">{error}</div>}

      <div className="orders-grid my-orders-grid">
        {orders.map((order) => (
          <article
            className="order-card"
            key={order.id}
            onClick={() => navigate(`/profile/orders/${order.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                navigate(`/profile/orders/${order.id}`);
              }
            }}
          >
            <div className="order-card-head">
              <h3>Заказ №{order.id}</h3>
              <span className={`status-pill status-${String(order.status).toLowerCase()}`}>{getOrderStatusLabel(order.status)}</span>
            </div>
            <div className="order-meta-grid">
              <p className="muted">Дата: {formatDate(order.createdAt)}</p>
              <p>
                Доставка: <strong>{getDeliveryTypeLabel(order.deliveryType)}</strong>
              </p>
            </div>
            <p className="price order-total">{formatCurrency(order.totalAmount)}</p>
            <span className="order-link-hint">Открыть подробную информацию</span>
          </article>
        ))}
      </div>

      {orders.length === 0 && <div className="status-card">У вас пока нет заказов</div>}
    </section>
  );
}
