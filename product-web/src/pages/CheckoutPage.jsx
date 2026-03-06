import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/format';
import { getPickupProviderLabel } from '../utils/orderLabels';

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
    return <div className="status-card">Для оформления заказа добавьте товары в корзину</div>;
  }

  return (
    <section className="panel" data-testid="checkout-page">
      <h1>Оформление заказа</h1>
      {preview && <p className="muted">Итоговая сумма: {formatCurrency(preview.totalAmount)}</p>}

      <form className="stack-form" onSubmit={submitOrder}>
        <label>
          Тип доставки
          <input value="Самовывоз" disabled />
        </label>

        <label>
          Пункт выдачи
          <select
            value={pickupPointId}
            onChange={(event) => setPickupPointId(event.target.value)}
            data-testid="pickup-point-select"
          >
            {pickupPoints.map((point) => (
              <option key={point.id} value={point.id}>
                {getPickupProviderLabel(point.provider)} — {point.name}
              </option>
            ))}
          </select>
        </label>

        {selectedPickupPoint && (
          <div className="pickup-inline-card" data-testid="pickup-point-card">
            <div className="pickup-point-head">
              {selectedPickupPoint.logoUrl ? (
                <img src={selectedPickupPoint.logoUrl} alt={selectedPickupPoint.provider} className="pickup-provider-logo" />
              ) : null}
              <div>
                <strong>{selectedPickupPoint.name}</strong>
                <p className="muted">{getPickupProviderLabel(selectedPickupPoint.provider)}</p>
              </div>
            </div>
            <p>{selectedPickupPoint.address}</p>
            {selectedPickupPoint.workHours && <p className="muted">График: {selectedPickupPoint.workHours}</p>}
            <iframe
              title="Карта ПВЗ"
              className="pickup-map"
              src={buildMapUrl(selectedPickupPoint.latitude, selectedPickupPoint.longitude)}
            />
          </div>
        )}

        <label>
          Комментарий к заказу
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} />
        </label>
        {error && <div className="error-box">{error}</div>}
        {successMessage && <div className="success-box">{successMessage}</div>}
        <button className="primary-btn" type="submit" data-testid="submit-order">
          Подтвердить заказ
        </button>
      </form>
    </section>
  );
}
