import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';
import { getDeliveryTypeLabel, getOrderStatusLabel } from '../utils/orderLabels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';

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
    <section className="grid gap-6" data-testid="my-orders-page">
      <Card>
        <CardHeader>
          <CardTitle>Мои заказы</CardTitle>
          <CardDescription>История покупок и текущие статусы.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <Alert variant="danger" className="mb-4">{error}</Alert> : null}

          {orders.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted p-6 text-sm text-muted-foreground">
              У вас пока нет заказов.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => (
                <article
                  className="order-card p-4"
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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold">Заказ №{order.id}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Дата: {formatDate(order.createdAt)}</div>
                    </div>
                    <Badge variant={statusVariant(order.status)}>{getOrderStatusLabel(order.status)}</Badge>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Доставка: <span className="font-semibold text-foreground">{getDeliveryTypeLabel(order.deliveryType)}</span>
                  </div>
                  <div className="mt-4 text-base font-extrabold">{formatCurrency(order.totalAmount)}</div>
                  <div className="mt-2 text-xs text-muted-foreground">Открыть подробную информацию</div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function statusVariant(status) {
  switch (status) {
    case 'NEW':
      return 'info';
    case 'PROCESSING':
      return 'warning';
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'default';
  }
}
