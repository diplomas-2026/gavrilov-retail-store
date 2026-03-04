import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';
import { getDeliveryTypeLabel, getOrderStatusLabel, getPickupProviderLabel } from '../utils/orderLabels';

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
    return <div className="error-box">{error}</div>;
  }

  if (!order) {
    return <div className="status-card">Загрузка заказа...</div>;
  }

  return (
    <section className="panel" data-testid="order-details-page">
      <div className="order-details-top">
        <div>
          <h1>Заказ №{order.id}</h1>
          <p className="muted">Дата: {formatDate(order.createdAt)}</p>
        </div>
        <span className={`status-pill status-${String(order.status).toLowerCase()}`}>{getOrderStatusLabel(order.status)}</span>
      </div>

      <div className="order-details-grid">
        <article className="pickup-inline-card">
          <h3>Информация о доставке</h3>
          <p>
            Тип: <strong>{getDeliveryTypeLabel(order.deliveryType)}</strong>
          </p>
          {order.deliveryType === 'PICKUP' ? (
            <>
              <p className="muted">
                ПВЗ: {getPickupProviderLabel(order.pickupPointProvider)} — {order.pickupPointName}
              </p>
              <p className="muted">Адрес: {order.deliveryAddress}</p>
            </>
          ) : (
            <p className="muted">Адрес: {order.deliveryAddress || 'Не указан'}</p>
          )}
          {order.comment ? <p className="muted">Комментарий: {order.comment}</p> : null}
        </article>

        <article className="pickup-inline-card">
          <h3>Состав заказа</h3>
          <ul className="order-items-detailed order-items-detailed-stack">
            {order.items.map((item) => (
              <li key={item.productId}>
                <span>{item.productName}</span>
                <span>
                  {item.qty} × {formatCurrency(item.unitPrice)} = <strong>{formatCurrency(item.lineTotal)}</strong>
                </span>
              </li>
            ))}
          </ul>
          <p className="price order-total">Итого: {formatCurrency(order.totalAmount)}</p>
        </article>
      </div>

      {selectedPickupPoint ? (
        <article className="pickup-map-section">
          <div className="pickup-map-section-head">
            <h3>Карта ПВЗ</h3>
            <p className="muted">Выберите пункт выдачи на карте</p>
          </div>
          <div className="order-items-inline pickup-map-points-inline">
            {pickupPoints.map((point) => (
              <button
                type="button"
                key={point.id}
                className={`order-item-chip order-map-chip ${selectedPickupPoint.id === point.id ? 'order-map-chip-active' : ''}`}
                onClick={() => setSelectedPickupId(point.id)}
              >
                {getPickupProviderLabel(point.provider)}: {point.name}
              </button>
            ))}
          </div>
          <iframe
            title="Карта ПВЗ заказа"
            className="pickup-map pickup-map-large"
            src={buildMapUrl(selectedPickupPoint.latitude, selectedPickupPoint.longitude)}
          />
          <p className="muted">Адрес: {selectedPickupPoint.address}</p>
        </article>
      ) : null}

      <article className="pickup-inline-card other-orders-block" data-testid="customer-orders-list">
        <h3>Список моих заказов</h3>
        <div className="customer-orders-list">
          {orders.map((candidate) => (
            <Link
              key={candidate.id}
              to={`/profile/orders/${candidate.id}`}
              className={`customer-order-row ${candidate.id === order.id ? 'customer-order-row-active' : ''}`}
            >
              <div>
                <strong>Заказ №{candidate.id}</strong>
                <p className="muted">{formatDate(candidate.createdAt)}</p>
              </div>
              <div className="customer-order-row-right">
                <span className={`status-pill status-${String(candidate.status).toLowerCase()}`}>{getOrderStatusLabel(candidate.status)}</span>
                <strong className="price">{formatCurrency(candidate.totalAmount)}</strong>
              </div>
            </Link>
          ))}
        </div>
      </article>
    </section>
  );
}
