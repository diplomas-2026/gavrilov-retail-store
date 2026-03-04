import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getPickupProviderLabel } from '../utils/orderLabels';

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
    <section className="panel" data-testid="admin-pickup-points-page">
      <h1>Пункты выдачи</h1>
      {error && <div className="error-box">{error}</div>}

      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Провайдер
          <select value={form.provider} onChange={(event) => setForm((s) => ({ ...s, provider: event.target.value }))}>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {getPickupProviderLabel(provider)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Название пункта
          <input value={form.name} onChange={(event) => setForm((s) => ({ ...s, name: event.target.value }))} required />
        </label>
        <label>
          Адрес
          <input
            value={form.address}
            onChange={(event) => setForm((s) => ({ ...s, address: event.target.value }))}
            required
          />
        </label>
        <label>
          Телефон
          <input value={form.phone} onChange={(event) => setForm((s) => ({ ...s, phone: event.target.value }))} />
        </label>
        <label>
          График
          <input
            value={form.workHours}
            onChange={(event) => setForm((s) => ({ ...s, workHours: event.target.value }))}
            placeholder="Пн-Вс: 10:00-21:00"
          />
        </label>
        <div className="inline-2">
          <label>
            Широта
            <input
              type="number"
              step="0.000001"
              value={form.latitude}
              onChange={(event) => setForm((s) => ({ ...s, latitude: event.target.value }))}
              required
            />
          </label>
          <label>
            Долгота
            <input
              type="number"
              step="0.000001"
              value={form.longitude}
              onChange={(event) => setForm((s) => ({ ...s, longitude: event.target.value }))}
              required
            />
          </label>
        </div>
        <label>
          URL логотипа
          <input value={form.logoUrl} onChange={(event) => setForm((s) => ({ ...s, logoUrl: event.target.value }))} />
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm((s) => ({ ...s, active: event.target.checked }))}
          />
          Пункт активен
        </label>

        <button className="primary-btn" type="submit">
          {editingId ? 'Сохранить изменения' : 'Добавить пункт выдачи'}
        </button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Провайдер</th>
            <th>Название</th>
            <th>Адрес</th>
            <th>Активен</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.id}>
              <td>{getPickupProviderLabel(point.provider)}</td>
              <td>{point.name}</td>
              <td>{point.address}</td>
              <td>{point.active ? 'Да' : 'Нет'}</td>
              <td className="actions-row">
                <button className="ghost-btn" onClick={() => startEdit(point)}>
                  Изменить
                </button>
                <button className="ghost-btn" onClick={() => remove(point.id)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
