import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/cn';
import { Package, Tags, ClipboardList, MapPin, Users, ScanLine, Search, CheckCircle2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert } from '../components/ui/alert';
import { formatCurrency, formatDate } from '../utils/format';
import { getDeliveryTypeLabel, getOrderStatusLabel } from '../utils/orderLabels';
import { Badge } from '../components/ui/badge';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <section className="grid gap-6" data-testid="admin-dashboard-page">
      <Card>
        <CardHeader>
          <CardTitle>Панель управления</CardTitle>
          <CardDescription>Управляйте каталогом, заказами и пользователями магазина.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AdminTile to="/admin/products" title="Товары" icon={Package} />
            <AdminTile to="/admin/categories" title="Категории" icon={Tags} />
            <AdminTile to="/admin/orders" title="Заказы" icon={ClipboardList} />
            {isAdmin ? <AdminTile to="/admin/pickup-points" title="Пункты выдачи" icon={MapPin} /> : null}
            {isAdmin ? <AdminTile to="/admin/users" title="Пользователи" icon={Users} /> : null}
          </div>
        </CardContent>
      </Card>

      <PickupPanel />
    </section>
  );
}

function AdminTile({ to, title, icon: Icon }) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft'
      )}
    >
      <div>
        <div className="text-sm font-extrabold">{title}</div>
        <div className="text-xs text-muted-foreground">Открыть раздел</div>
      </div>
      <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-muted text-muted-foreground transition group-hover:text-foreground">
        <Icon className="h-5 w-5" />
      </div>
    </Link>
  );
}

const STATUS_OPTIONS = ['NEW', 'PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'];

function PickupPanel() {
  const [code, setCode] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const normalizedCode = useMemo(() => code.replace(/\D/g, '').slice(0, 6), [code]);

  const searchOrder = async (value) => {
    const c = String(value || '').trim();
    if (!c) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.getOrderByPickupCode(c);
      setOrder(res);
    } catch (err) {
      setOrder(null);
      setError(err.message || 'Не удалось найти заказ');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    if (!order?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.updateOrderStatus(order.id, { status });
      setOrder(res);
    } catch (err) {
      setError(err.message || 'Не удалось обновить статус');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card data-testid="order-pickup-panel">
      <CardHeader>
        <CardTitle>Выдача заказов</CardTitle>
        <CardDescription>Введите 6‑значный код или отсканируйте штрихкод с экрана клиента.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={normalizedCode}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Код получения (6 цифр)"
              inputMode="numeric"
              className="pl-9"
              maxLength={6}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setScannerOpen(true)}
            >
              <ScanLine className="h-4 w-4" />
              Сканировать
            </Button>
            <Button
              type="button"
              disabled={loading || normalizedCode.length !== 6}
              onClick={() => searchOrder(normalizedCode)}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              Найти
            </Button>
          </div>
        </div>

        {order ? (
          <div className="grid gap-3 rounded-2xl border border-border bg-muted p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold">Заказ №{order.id}</div>
                <div className="mt-1 text-xs text-muted-foreground">Создан: {formatDate(order.createdAt)}</div>
                <div className="mt-1 text-xs text-muted-foreground">Покупатель: {order.customerName}</div>
              </div>
              <div className="grid justify-items-end gap-2">
                <Badge variant={statusVariant(order.status)}>{getOrderStatusLabel(order.status)}</Badge>
                <div className="text-sm font-extrabold">{formatCurrency(order.totalAmount)}</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Доставка: <span className="font-semibold text-foreground">{getDeliveryTypeLabel(order.deliveryType)}</span>
              {order.deliveryAddress ? <span> • {order.deliveryAddress}</span> : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
              <div className="text-sm">
                Код получения: <span className="font-extrabold tracking-[0.2em]">{order.pickupCode || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {getOrderStatusLabel(s)}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  className="gap-2"
                  disabled={loading}
                  onClick={() => updateStatus('COMPLETED')}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Выдан
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {scannerOpen ? (
          <ScannerModal
            onClose={() => setScannerOpen(false)}
            onCode={(value) => {
              setScannerOpen(false);
              setCode(value);
              const c = String(value || '').replace(/\D/g, '').slice(0, 6);
              if (c.length === 6) searchOrder(c);
            }}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function ScannerModal({ onClose, onCode }) {
  const [error, setError] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    let stream;
    let rafId;
    let stopped = false;

    const start = async () => {
      try {
        if (!('BarcodeDetector' in window)) {
          setError('Сканирование не поддерживается в этом браузере. Введите код вручную.');
          return;
        }
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (stopped) return;
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const tick = async () => {
          if (stopped) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            const raw = barcodes?.[0]?.rawValue ? String(barcodes[0].rawValue) : '';
            const digits = raw.replace(/\D/g, '').slice(0, 6);
            if (digits.length === 6) {
              onCode(digits);
              return;
            }
          } catch {
            // ignore
          }
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      } catch (e) {
        setError(e?.message || 'Не удалось открыть камеру');
      }
    };

    start();

    return () => {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (stream) {
        for (const track of stream.getTracks()) track.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-soft2">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <div className="text-sm font-extrabold">Сканирование штрихкода</div>
            <div className="text-xs text-muted-foreground">Наведите камеру на QR‑код с экрана клиента.</div>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
        <div className="grid gap-3 p-4">
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <div className="overflow-hidden rounded-xl border border-border bg-muted">
            <video ref={videoRef} className="h-[320px] w-full object-cover" playsInline muted />
          </div>
          <div className="text-xs text-muted-foreground">
            Если сканирование не срабатывает — увеличьте яркость экрана клиента или введите код вручную.
          </div>
        </div>
      </div>
    </div>
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
