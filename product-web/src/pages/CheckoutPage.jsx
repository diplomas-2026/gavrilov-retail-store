import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/format';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clear } = useCart();

  const [preview, setPreview] = useState(null);
  const [deliveryType, setDeliveryType] = useState('COURIER');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const payloadItems = useMemo(
    () => items.map((item) => ({ productId: item.productId, qty: item.qty })),
    [items]
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

  const submitOrder = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      await api.createOrder({
        items: payloadItems,
        deliveryType,
        deliveryAddress,
        comment
      });
      clear();
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
          <select value={deliveryType} onChange={(event) => setDeliveryType(event.target.value)}>
            <option value="COURIER">Курьер</option>
            <option value="PICKUP">Самовывоз</option>
          </select>
        </label>
        <label>
          Адрес доставки
          <input
            value={deliveryAddress}
            onChange={(event) => setDeliveryAddress(event.target.value)}
            placeholder="г. Самара, ул. ..., д. ..."
          />
        </label>
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
