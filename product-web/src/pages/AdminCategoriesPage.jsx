import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Alert } from '../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

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
    <section className="grid gap-6" data-testid="admin-categories-page">
      <Card>
        <CardHeader>
          <CardTitle>Категории</CardTitle>
          <CardDescription>Добавляйте категории и используйте их в товарах.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="name">
                  Название
                </label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="slug">
                  Slug
                </label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
                  required
                  placeholder="Например: kuhnya-i-dom"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold" htmlFor="description">
                Описание
              </label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Для чего эта категория и какие товары в ней ожидаются."
              />
            </div>
            {error ? <Alert variant="danger">{error}</Alert> : null}
            <div className="flex items-center justify-end">
              <Button type="submit" data-testid="save-category">
                Добавить категорию
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список категорий</CardTitle>
          <CardDescription>Всего: {categories.length}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Активна</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="text-muted-foreground">{category.id}</TableCell>
                  <TableCell className="font-semibold">{category.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{category.slug}</TableCell>
                  <TableCell className="text-muted-foreground">{category.active ? 'Да' : 'Нет'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
