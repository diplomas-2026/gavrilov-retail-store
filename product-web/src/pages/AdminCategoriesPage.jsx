import { useEffect, useState } from 'react';
import { api } from '../api/client';

const initialForm = { name: '', slug: '', description: '', active: true };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

  const load = () => {
    api
      .getCategories()
      .then(setCategories)
      .catch((err) => setError(err.message || 'Ошибка загрузки категорий'));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api.createCategory(form);
      setForm(initialForm);
      load();
    } catch (err) {
      setError(err.message || 'Ошибка сохранения категории');
    }
  };

  return (
    <section className="panel" data-testid="admin-categories-page">
      <h1>Категории</h1>
      <form className="stack-form" onSubmit={submit}>
        <label>
          Название
          <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
        </label>
        <label>
          Slug
          <input value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} required />
        </label>
        <label>
          Описание
          <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        </label>
        <button className="primary-btn" type="submit" data-testid="save-category">
          Добавить категорию
        </button>
      </form>
      {error && <div className="error-box">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Slug</th>
            <th>Активна</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>{category.id}</td>
              <td>{category.name}</td>
              <td>{category.slug}</td>
              <td>{category.active ? 'Да' : 'Нет'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
