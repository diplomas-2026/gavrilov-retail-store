import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { formatCurrency } from '../utils/format';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Alert } from '../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function AdminProductsPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    oldPrice: '',
    stockQty: 0,
    categoryId: '',
    active: true,
    images: ''
  });

  const categoryOptions = useMemo(() => categories.filter((item) => item.active), [categories]);

  const load = () => {
    Promise.all([api.getCategories(), api.getProducts('?activeOnly=false')])
      .then(([categoriesData, productsData]) => {
        setCategories(categoriesData);
        setProducts(productsData);
      })
      .catch((err) => setError(err.message || 'Ошибка загрузки данных'));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    const payload = {
      sku: form.sku,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      stockQty: Number(form.stockQty),
      categoryId: Number(form.categoryId),
      active: form.active,
      images: form.images
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    };

    try {
      await api.createProduct(payload);
      setForm({
        sku: '',
        name: '',
        description: '',
        price: '',
        oldPrice: '',
        stockQty: 0,
        categoryId: '',
        active: true,
        images: ''
      });
      load();
    } catch (err) {
      setError(err.message || 'Ошибка сохранения товара');
    }
  };

  return (
    <section className="grid gap-6" data-testid="admin-products-page">
      <Card>
        <CardHeader>
          <CardTitle>Товары</CardTitle>
          <CardDescription>Добавляйте и просматривайте товары каталога.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="sku">
                  SKU
                </label>
                <Input
                  id="sku"
                  data-testid="product-sku-input"
                  value={form.sku}
                  onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="name">
                  Название
                </label>
                <Input
                  id="name"
                  data-testid="product-name-input"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold" htmlFor="description">
                Описание
              </label>
              <Textarea
                id="description"
                data-testid="product-description-input"
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Коротко опишите товар (материал, размеры, особенности)."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="price">
                  Цена
                </label>
                <Input
                  id="price"
                  data-testid="product-price-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.price}
                  onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="oldPrice">
                  Старая цена
                </label>
                <Input
                  id="oldPrice"
                  data-testid="product-old-price-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.oldPrice}
                  onChange={(e) => setForm((s) => ({ ...s, oldPrice: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="stockQty">
                  Остаток
                </label>
                <Input
                  id="stockQty"
                  data-testid="product-stock-input"
                  type="number"
                  min="0"
                  value={form.stockQty}
                  onChange={(e) => setForm((s) => ({ ...s, stockQty: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="categoryId">
                  Категория
                </label>
                <select
                  id="categoryId"
                  data-testid="product-category-select"
                  value={form.categoryId}
                  onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value }))}
                  required
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Выберите категорию</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="images">
                  URL изображений
                </label>
                <Input
                  id="images"
                  data-testid="product-images-input"
                  value={form.images}
                  onChange={(e) => setForm((s) => ({ ...s, images: e.target.value }))}
                  placeholder="Через запятую, например: https://.../1.jpg, https://.../2.jpg"
                />
              </div>
            </div>

            {error ? <Alert variant="danger">{error}</Alert> : null}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                Подсказка: изображения можно добавлять ссылками, список разделяется запятыми.
              </div>
              <Button type="submit" data-testid="save-product">
                Добавить товар
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список товаров</CardTitle>
          <CardDescription>Всего: {products.length}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Остаток</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                  <TableCell className="font-semibold">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.categoryName}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(product.price)}</TableCell>
                  <TableCell className="text-muted-foreground">{product.stockQty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
