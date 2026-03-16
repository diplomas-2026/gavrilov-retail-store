import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert } from './ui/alert';

export default function PickupCodePanel({ orderId, pickupCode }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const safeCode = useMemo(() => (pickupCode ? String(pickupCode).trim() : ''), [pickupCode]);

  useEffect(() => {
    setSvg('');
    setError('');
  }, [orderId, safeCode]);

  const loadBarcode = async () => {
    if (!orderId || !safeCode) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.getMyOrderPickupBarcode(orderId);
      setSvg(res || '');
    } catch (err) {
      setError(err.message || 'Не удалось загрузить штрихкод');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(safeCode);
    } catch {
      // ignore
    }
  };

  return (
    <Card data-testid="pickup-code-panel">
      <CardHeader>
        <CardTitle>Получение заказа</CardTitle>
        <CardDescription>
          Для получения скажите этот код в пункте выдачи или покажите штрихкод.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted p-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Код получения</div>
            <div className="mt-1 text-2xl font-extrabold tracking-[0.2em]">{safeCode || '—'}</div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={copy} disabled={!safeCode}>
              Скопировать
            </Button>
            <Button type="button" onClick={loadBarcode} disabled={!safeCode || loading}>
              {loading ? 'Готовим…' : svg ? 'Обновить штрихкод' : 'Показать штрихкод'}
            </Button>
          </div>
        </div>

        {error ? <Alert variant="danger">{error}</Alert> : null}

        {svg ? (
          <div className="grid justify-items-center rounded-xl border border-border bg-card p-4">
            <div
              className="w-[200px] max-w-full"
              aria-label="Штрихкод заказа"
              // SVG приходит с API (сгенерирован сервером), поэтому вставляем как есть.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <div className="mt-2 text-xs text-muted-foreground">Покажите этот штрихкод сотруднику ПВЗ.</div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

