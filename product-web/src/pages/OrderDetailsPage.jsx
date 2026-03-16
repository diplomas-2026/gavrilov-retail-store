import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';
import { getDeliveryTypeLabel, getOrderStatusLabel, getPickupProviderLabel } from '../utils/orderLabels';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert } from '../components/ui/alert';
import { cn } from '../lib/cn';
import PickupCodePanel from '../components/PickupCodePanel';

function buildMapUrl(lat, lon) {
  const delta = 0.01;
  const left = lon - delta;
  const right = lon + delta;
  const bottom = lat - delta;
  const top = lat + delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [selectedPickupId, setSelectedPickupId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getMyOrder(id)
      .then(setOrder)
      .catch((err) => setError(err.message || 'Не удалось загрузить заказ'));

    api.getMyOrders().then(setOrders).catch(() => {});
    api.getPickupPoints().then(setPickupPoints).catch(() => {});
  }, [id]);

  const pickupPoint = useMemo(() => {
    if (!order?.pickupPointId) {
      return null;
    }
    return pickupPoints.find((point) => point.id === order.pickupPointId) || null;
  }, [order, pickupPoints]);

  useEffect(() => {
    if (!pickupPoints.length) {
      return;
    }
    if (pickupPoint) {
      setSelectedPickupId(pickupPoint.id);
      return;
    }
    if (!selectedPickupId) {
      setSelectedPickupId(pickupPoints[0].id);
    }
  }, [pickupPoint, pickupPoints, selectedPickupId]);

  const selectedPickupPoint = useMemo(() => {
    if (!pickupPoints.length) {
      return null;
    }
    return pickupPoints.find((point) => point.id === selectedPickupId) || pickupPoints[0];
  }, [pickupPoints, selectedPickupId]);

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Загрузка заказа…</CardTitle>
          <CardDescription>Пожалуйста, подождите.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section className="grid gap-6" data-testid="order-details-page">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Заказ №{order.id}</CardTitle>
            <CardDescription>Дата: {formatDate(order.createdAt)}</CardDescription>
          </div>
          <Badge variant={statusVariant(order.status)}>{getOrderStatusLabel(order.status)}</Badge>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Доставка</CardTitle>
            <CardDescription>Данные и комментарий.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div>
              Тип: <span className="font-semibold">{getDeliveryTypeLabel(order.deliveryType)}</span>
            </div>
            {order.deliveryType === 'PICKUP' ? (
              <>
                <div className="text-muted-foreground">
                  ПВЗ: {getPickupProviderLabel(order.pickupPointProvider)} — {order.pickupPointName}
                </div>
                <div className="text-muted-foreground">Адрес: {order.deliveryAddress}</div>
              </>
            ) : (
              <div className="text-muted-foreground">Адрес: {order.deliveryAddress || 'Не указан'}</div>
            )}
            {order.comment ? <div className="text-muted-foreground">Комментарий: {order.comment}</div> : null}
          </CardContent>
        </Card>

        {order.status === 'READY_FOR_PICKUP' && order.pickupCode ? (
          <PickupCodePanel orderId={order.id} pickupCode={order.pickupCode} />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Состав заказа</CardTitle>
            <CardDescription>Товары и итоговая сумма.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ul className="grid gap-2">
              {order.items.map((item) => (
                <li key={item.productId} className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted p-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{item.productName}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.qty} × {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="shrink-0 font-extrabold">{formatCurrency(item.lineTotal)}</div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div className="text-sm text-muted-foreground">Итого</div>
              <div className="text-lg font-extrabold">{formatCurrency(order.totalAmount)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedPickupPoint ? (
        <Card>
          <CardHeader>
            <CardTitle>Карта ПВЗ</CardTitle>
            <CardDescription>Выберите пункт выдачи для просмотра на карте.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pickupPoints.map((point) => (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => setSelectedPickupId(point.id)}
                  className={cn(
                    'rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground',
                    selectedPickupPoint.id === point.id && 'border-ring text-foreground ring-2 ring-ring/20'
                  )}
                >
                  {getPickupProviderLabel(point.provider)}: {point.name}
                </button>
              ))}
            </div>
            <iframe
              title="Карта ПВЗ заказа"
              className="mt-3 h-[360px] w-full rounded-xl border border-border bg-muted"
              src={buildMapUrl(selectedPickupPoint.latitude, selectedPickupPoint.longitude)}
            />
            <div className="mt-2 text-sm text-muted-foreground">Адрес: {selectedPickupPoint.address}</div>
          </CardContent>
        </Card>
      ) : null}

      <Card data-testid="customer-orders-list">
        <CardHeader>
          <CardTitle>Список моих заказов</CardTitle>
          <CardDescription>Быстрый переход между заказами.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {orders.map((candidate) => (
              <Link
                key={candidate.id}
                to={`/profile/orders/${candidate.id}`}
                className={cn(
                  'flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:bg-muted',
                  candidate.id === order.id && 'border-ring ring-2 ring-ring/20'
                )}
              >
                <div>
                  <div className="text-sm font-extrabold">Заказ №{candidate.id}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{formatDate(candidate.createdAt)}</div>
                </div>
                <div className="grid justify-items-end gap-2">
                  <Badge variant={statusVariant(candidate.status)}>{getOrderStatusLabel(candidate.status)}</Badge>
                  <div className="text-sm font-extrabold">{formatCurrency(candidate.totalAmount)}</div>
                </div>
              </Link>
            ))}
          </div>
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
    case 'READY_FOR_PICKUP':
      return 'success';
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'default';
  }
}
