import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';

export default function MyOrdersPage() {
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
      <div className="orders-grid">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <h3>Заказ №{order.id}</h3>
            <p className="muted">Дата: {formatDate(order.createdAt)}</p>
            <p className="muted">Статус: {order.status}</p>
            <p className="muted">Доставка: {order.deliveryType}</p>
            <p className="price">{formatCurrency(order.totalAmount)}</p>
          </article>
        ))}
      </div>
      {orders.length === 0 && <div className="status-card">У вас пока нет заказов</div>}
    </section>
  );
}
