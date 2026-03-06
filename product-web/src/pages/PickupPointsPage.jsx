import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getPickupProviderLabel } from '../utils/orderLabels';
import { resolveMediaUrl } from '../utils/media';

function buildMapUrl(lat, lon) {
  const delta = 0.01;
  const left = lon - delta;
  const right = lon + delta;
  const bottom = lat - delta;
  const top = lat + delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

export default function PickupPointsPage() {
  const [points, setPoints] = useState([]);
  const [selectedPointId, setSelectedPointId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getPickupPoints()
      .then((data) => {
        setPoints(data);
        if (data.length > 0) {
          setSelectedPointId(data[0].id);
        }
      })
      .catch((err) => setError(err.message || 'Не удалось загрузить пункты выдачи'));
  }, []);

  const selectedPoint = points.find((point) => point.id === selectedPointId);

  return (
    <section className="panel" data-testid="pickup-points-page">
      <h1>Пункты выдачи</h1>
      <p className="muted">Выберите удобный ПВЗ для самовывоза.</p>
      {error && <div className="error-box">{error}</div>}

      <div className="pickup-points-grid">
        {points.map((point) => (
          <article
            key={point.id}
            className={`pickup-point-card ${selectedPointId === point.id ? 'pickup-point-card-active' : ''}`}
            onClick={() => setSelectedPointId(point.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                setSelectedPointId(point.id);
              }
            }}
          >
            <div className="pickup-point-head">
              {point.logoUrl ? <img src={resolveMediaUrl(point.logoUrl)} alt={point.provider} className="pickup-provider-logo" /> : null}
              <div>
                <h3>{point.name}</h3>
                <p className="muted">{getPickupProviderLabel(point.provider)}</p>
              </div>
            </div>
            <p>{point.address}</p>
            {point.workHours && <p className="muted">График: {point.workHours}</p>}
            {point.phone && <p className="muted">Телефон: {point.phone}</p>}
          </article>
        ))}
      </div>

      {selectedPoint && (
        <div className="pickup-map-section" data-testid="pickup-points-map">
          <h2>ПВЗ на карте</h2>
          <p className="muted">
            {getPickupProviderLabel(selectedPoint.provider)} — {selectedPoint.name}
          </p>
          <iframe title="Карта пунктов выдачи" className="pickup-map pickup-map-large" src={buildMapUrl(selectedPoint.latitude, selectedPoint.longitude)} />
        </div>
      )}

      {points.length === 0 && <div className="status-card">Пункты выдачи пока не добавлены</div>}
    </section>
  );
}
