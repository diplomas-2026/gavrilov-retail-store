import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';
import { getDeliveryTypeLabel, getOrderStatusLabel } from '../utils/orderLabels';

const statuses = ['NEW', 'PROCESSING', 'COMPLETED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const load = () => {
    api
      .getOrders()
      .then(setOrders)
      .catch((err) => setError(err.message || 'Ошибка загрузки заказов'));
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.updateOrderStatus(orderId, { status });
      load();
    } catch (err) {
      setError(err.message || 'Не удалось обновить статус');
    }
  };

  return (
    <section className="panel" data-testid="admin-orders-page">
      <h1>Заказы</h1>
      {error && <div className="error-box">{error}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>№</th>
            <th>Покупатель</th>
            <th>Дата</th>
            <th>Сумма</th>
            <th>Статус</th>
            <th>Доставка</th>
            <th>Изменить</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customerName}</td>
              <td>{formatDate(order.createdAt)}</td>
              <td>{formatCurrency(order.totalAmount)}</td>
              <td>{getOrderStatusLabel(order.status)}</td>
              <td>{getDeliveryTypeLabel(order.deliveryType)}</td>
              <td>
                <select
                  value={order.status}
                  onChange={(event) => updateStatus(order.id, event.target.value)}
                  data-testid={`order-status-${order.id}`}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {getOrderStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
