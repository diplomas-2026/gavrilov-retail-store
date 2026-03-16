import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/format';
import { getPickupProviderLabel } from '../utils/orderLabels';
import { resolveMediaUrl } from '../utils/media';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert } from '../components/ui/alert';
import { Textarea } from '../components/ui/textarea';

function buildMapUrl(lat, lon) {
  const delta = 0.01;
  const left = lon - delta;
  const right = lon + delta;
  const bottom = lat - delta;
  const top = lat + delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clear } = useCart();

  const [preview, setPreview] = useState(null);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [pickupPointId, setPickupPointId] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const payloadItems = useMemo(
    () => items.map((item) => ({ productId: item.productId, qty: item.qty })),
    [items]
  );

  const selectedPickupPoint = useMemo(
    () => pickupPoints.find((point) => String(point.id) === String(pickupPointId)),
    [pickupPoints, pickupPointId]
  );

  useEffect(() => {
    if (payloadItems.length === 0) {
      return;
    }

    api
      .previewCart({ items: payloadItems })
      .then(setPreview)
      .catch((err) => setError(err.message || 'Ошибка расчета корзины'));
  }, [payloadItems]);

  useEffect(() => {
    api
      .getPickupPoints()
      .then((data) => {
        setPickupPoints(data);
        if (!pickupPointId && data.length > 0) {
          setPickupPointId(String(data[0].id));
        }
      })
      .catch((err) => setError(err.message || 'Не удалось загрузить пункты выдачи'));
  }, [pickupPointId]);

  const submitOrder = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      await api.createOrder({
        items: payloadItems,
        deliveryType: 'PICKUP',
        pickupPointId: Number(pickupPointId),
        deliveryAddress: '',
        comment
      });
      await clear();
      setSuccessMessage('Заказ успешно оформлен');
      setTimeout(() => navigate('/profile/orders'), 500);
    } catch (err) {
      setError(err.message || 'Не удалось оформить заказ');
    }
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Оформление заказа</CardTitle>
          <CardDescription>Для оформления заказа добавьте товары в корзину.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section className="grid gap-6" data-testid="checkout-page">
      <Card>
        <CardHeader>
          <CardTitle>Оформление заказа</CardTitle>
          <CardDescription>
            {preview ? `Итоговая сумма: ${formatCurrency(preview.totalAmount)}` : 'Проверьте параметры самовывоза.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitOrder} className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Тип доставки</label>
              <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                Самовывоз
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold" htmlFor="pickupPoint">
                Пункт выдачи
              </label>
              <select
                id="pickupPoint"
                value={pickupPointId}
                onChange={(event) => setPickupPointId(event.target.value)}
                data-testid="pickup-point-select"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {pickupPoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {getPickupProviderLabel(point.provider)} — {point.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedPickupPoint ? (
              <div
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
                data-testid="pickup-point-card"
              >
                <div className="flex items-start gap-3">
                  {selectedPickupPoint.logoUrl ? (
                    <img
                      src={resolveMediaUrl(selectedPickupPoint.logoUrl)}
                      alt={selectedPickupPoint.provider}
                      className="h-11 w-11 rounded-xl border border-border bg-card object-contain p-1"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold">{selectedPickupPoint.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {getPickupProviderLabel(selectedPickupPoint.provider)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid gap-1 text-sm">
                  <div className="text-muted-foreground">{selectedPickupPoint.address}</div>
                  {selectedPickupPoint.workHours ? (
                    <div className="text-xs text-muted-foreground">График: {selectedPickupPoint.workHours}</div>
                  ) : null}
                </div>
                <iframe
                  title="Карта ПВЗ"
                  className="mt-3 h-60 w-full rounded-xl border border-border bg-muted"
                  src={buildMapUrl(selectedPickupPoint.latitude, selectedPickupPoint.longitude)}
                />
              </div>
            ) : null}

            <div className="grid gap-2">
              <label className="text-sm font-semibold" htmlFor="comment">
                Комментарий к заказу
              </label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                placeholder="Например: позвонить за 15 минут, оставить на ресепшене и т.д."
              />
            </div>

            {error ? <Alert variant="danger">{error}</Alert> : null}
            {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}

            <div className="flex items-center justify-end">
              <Button type="submit" data-testid="submit-order">
                Подтвердить заказ
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
