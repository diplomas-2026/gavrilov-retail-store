import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getPickupProviderLabel } from '../utils/orderLabels';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Alert } from '../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const providers = ['RUSSIAN_POST', 'CDEK', 'YANDEX_MARKET', 'BOXBERRY'];

const emptyForm = {
  provider: 'RUSSIAN_POST',
  name: '',
  address: '',
  phone: '',
  workHours: '',
  latitude: '53.2000',
  longitude: '50.1500',
  logoUrl: '',
  active: true
};

export default function AdminPickupPointsPage() {
  const [points, setPoints] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    api
      .getPickupPointsAdmin()
      .then(setPoints)
      .catch((err) => setError(err.message || 'Не удалось загрузить пункты выдачи'));
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const payload = {
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude)
    };

    try {
      if (editingId) {
        await api.updatePickupPoint(editingId, payload);
      } else {
        await api.createPickupPoint(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message || 'Не удалось сохранить пункт выдачи');
    }
  };

  const startEdit = (point) => {
    setEditingId(point.id);
    setForm({
      provider: point.provider,
      name: point.name,
      address: point.address,
      phone: point.phone || '',
      workHours: point.workHours || '',
      latitude: String(point.latitude),
      longitude: String(point.longitude),
      logoUrl: point.logoUrl || '',
      active: point.active
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Удалить пункт выдачи?')) {
      return;
    }

    try {
      await api.deletePickupPoint(id);
      load();
    } catch (err) {
      setError(err.message || 'Не удалось удалить пункт выдачи');
    }
  };

  return (
    <section className="grid gap-6" data-testid="admin-pickup-points-page">
      <Card>
        <CardHeader>
          <CardTitle>Пункты выдачи</CardTitle>
          <CardDescription>Добавляйте, редактируйте и отключайте ПВЗ.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <Alert variant="danger" className="mb-4">{error}</Alert> : null}

          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="provider">
                  Провайдер
                </label>
                <select
                  id="provider"
                  value={form.provider}
                  onChange={(event) => setForm((s) => ({ ...s, provider: event.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {providers.map((provider) => (
                    <option key={provider} value={provider}>
                      {getPickupProviderLabel(provider)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="name">
                  Название пункта
                </label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm((s) => ({ ...s, name: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="address">
                  Адрес
                </label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(event) => setForm((s) => ({ ...s, address: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="phone">
                  Телефон
                </label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => setForm((s) => ({ ...s, phone: event.target.value }))}
                  placeholder="+7 (999) 000-00-00"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2 md:col-span-1">
                <label className="text-sm font-semibold" htmlFor="workHours">
                  График
                </label>
                <Input
                  id="workHours"
                  value={form.workHours}
                  onChange={(event) => setForm((s) => ({ ...s, workHours: event.target.value }))}
                  placeholder="Пн-Вс: 10:00-21:00"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="latitude">
                  Широта
                </label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  value={form.latitude}
                  onChange={(event) => setForm((s) => ({ ...s, latitude: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="longitude">
                  Долгота
                </label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  value={form.longitude}
                  onChange={(event) => setForm((s) => ({ ...s, longitude: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="logoUrl">
                  URL логотипа
                </label>
                <Input
                  id="logoUrl"
                  value={form.logoUrl}
                  onChange={(event) => setForm((s) => ({ ...s, logoUrl: event.target.value }))}
                  placeholder="https://.../logo.png"
                />
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-border bg-muted px-4 py-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm((s) => ({ ...s, active: event.target.checked }))}
                  className="h-4 w-4 accent-black"
                />
                Пункт активен
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {editingId ? (
                <Button type="button" variant="outline" onClick={() => { setForm(emptyForm); setEditingId(null); }}>
                  Отмена
                </Button>
              ) : null}
              <Button type="submit">{editingId ? 'Сохранить изменения' : 'Добавить пункт выдачи'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список ПВЗ</CardTitle>
          <CardDescription>Всего: {points.length}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Провайдер</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Адрес</TableHead>
                <TableHead>Активен</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map((point) => (
                <TableRow key={point.id}>
                  <TableCell className="text-muted-foreground">{getPickupProviderLabel(point.provider)}</TableCell>
                  <TableCell className="font-semibold">{point.name}</TableCell>
                  <TableCell className="text-muted-foreground">{point.address}</TableCell>
                  <TableCell className="text-muted-foreground">{point.active ? 'Да' : 'Нет'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(point)}>
                        Изменить
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => remove(point.id)}>
                        Удалить
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
