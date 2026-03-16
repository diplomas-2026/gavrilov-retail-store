import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';
import { getDeliveryTypeLabel, getOrderStatusLabel } from '../utils/orderLabels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert } from '../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

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
    <section className="grid gap-6" data-testid="admin-orders-page">
      <Card>
        <CardHeader>
          <CardTitle>Заказы</CardTitle>
          <CardDescription>Просмотр и изменение статусов заказов.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {error ? <Alert variant="danger" className="mb-4">{error}</Alert> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>Покупатель</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Доставка</TableHead>
                <TableHead>Изменить</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-muted-foreground">{order.id}</TableCell>
                  <TableCell className="font-semibold">{order.customerName}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell className="text-muted-foreground">{getOrderStatusLabel(order.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{getDeliveryTypeLabel(order.deliveryType)}</TableCell>
                  <TableCell>
                    <select
                      value={order.status}
                      onChange={(event) => updateStatus(order.id, event.target.value)}
                      data-testid={`order-status-${order.id}`}
                      className="h-9 w-full min-w-[180px] rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {getOrderStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
