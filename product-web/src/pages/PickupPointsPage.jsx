import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getPickupProviderLabel } from '../utils/orderLabels';
import { resolveMediaUrl } from '../utils/media';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert } from '../components/ui/alert';
import { cn } from '../lib/cn';

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
    <section className="grid gap-6" data-testid="pickup-points-page">
      <Card>
        <CardHeader>
          <CardTitle>Пункты выдачи</CardTitle>
          <CardDescription>Выберите удобный ПВЗ для самовывоза.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <Alert variant="danger">{error}</Alert> : null}

          {points.length === 0 ? (
            <div className="text-sm text-muted-foreground">Пункты выдачи пока не добавлены.</div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {points.map((point) => (
                <article
                  key={point.id}
                  className={cn(
                    'cursor-pointer rounded-xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft',
                    selectedPointId === point.id && 'border-ring ring-2 ring-ring/20'
                  )}
                  onClick={() => setSelectedPointId(point.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      setSelectedPointId(point.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {point.logoUrl ? (
                      <img
                        src={resolveMediaUrl(point.logoUrl)}
                        alt={point.provider}
                        className="h-11 w-11 rounded-xl border border-border bg-card object-contain p-1"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-extrabold">{point.name}</h3>
                      <div className="text-xs text-muted-foreground">{getPickupProviderLabel(point.provider)}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm">
                    <div className="text-muted-foreground">{point.address}</div>
                    {point.workHours ? <div className="text-xs text-muted-foreground">График: {point.workHours}</div> : null}
                    {point.phone ? <div className="text-xs text-muted-foreground">Телефон: {point.phone}</div> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPoint ? (
        <Card data-testid="pickup-points-map">
          <CardHeader>
            <CardTitle>ПВЗ на карте</CardTitle>
            <CardDescription>
              {getPickupProviderLabel(selectedPoint.provider)} — {selectedPoint.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <iframe
              title="Карта пунктов выдачи"
              className="h-[360px] w-full rounded-xl border border-border bg-muted"
              src={buildMapUrl(selectedPoint.latitude, selectedPoint.longitude)}
            />
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
