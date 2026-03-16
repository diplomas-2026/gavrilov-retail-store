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
import { Input } from '../components/ui/input';
import { Eye, EyeOff, Lock } from 'lucide-react';

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
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [showCvc, setShowCvc] = useState(false);
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
      const paymentError = validateCard({
        cardNumber,
        cardHolder,
        cardExpiry,
        cardCvc
      });
      if (paymentError) {
        setError(paymentError);
        return;
      }

      await api.createOrder({
        items: payloadItems,
        deliveryType: 'PICKUP',
        pickupPointId: Number(pickupPointId),
        deliveryAddress: '',
        comment
      });
      await clear();
      setCardNumber('');
      setCardHolder('');
      setCardExpiry('');
      setCardCvc('');
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

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold">Оплата картой</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Демо‑режим: данные карты не отправляются на API и нигде не сохраняются.
                  </div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-muted text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <label className="text-sm font-semibold" htmlFor="cardNumber">
                    Номер карты
                  </label>
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    maxLength={19}
                    required
                  />
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <label className="text-sm font-semibold" htmlFor="cardHolder">
                    Имя держателя
                  </label>
                  <Input
                    id="cardHolder"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="IVAN IVANOV"
                    autoComplete="cc-name"
                    maxLength={80}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold" htmlFor="cardExpiry">
                    Срок действия
                  </label>
                  <Input
                    id="cardExpiry"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    maxLength={5}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold" htmlFor="cardCvc">
                    CVC/CVV
                  </label>
                  <div className="relative">
                    <Input
                      id="cardCvc"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(formatCvc(e.target.value))}
                      type={showCvc ? 'text' : 'password'}
                      placeholder="***"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      maxLength={4}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCvc((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label={showCvc ? 'Скрыть CVC' : 'Показать CVC'}
                    >
                      {showCvc ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
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

function formatCardNumber(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCvc(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 4);
}

function validateCard({ cardNumber, cardHolder, cardExpiry, cardCvc }) {
  const numberDigits = String(cardNumber || '').replace(/\D/g, '');
  if (numberDigits.length !== 16) return 'Введите корректный номер карты (16 цифр)';

  const name = String(cardHolder || '').trim();
  if (name.length < 3) return 'Введите имя держателя карты';

  const exp = String(cardExpiry || '').trim();
  const match = exp.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return 'Введите срок действия в формате MM/YY';

  const month = Number(match[1]);
  if (!month || month < 1 || month > 12) return 'Некорректный месяц в сроке действия';

  const cvc = String(cardCvc || '').replace(/\D/g, '');
  if (cvc.length < 3) return 'Введите CVC/CVV (3–4 цифры)';

  return '';
}
