import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Alert } from '../components/ui/alert';
import { MessageCircle, Search, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsCount, setProductsCount] = useState(null);
  const [pickupPointsCount, setPickupPointsCount] = useState(null);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const params = useMemo(() => {
    const search = new URLSearchParams();
    if (query.trim()) {
      search.set('query', query.trim());
    }
    if (categoryId) {
      search.set('categoryId', categoryId);
    }
    search.set('activeOnly', 'true');
    const queryString = search.toString();
    return queryString ? `?${queryString}` : '';
  }, [query, categoryId]);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [categoriesData, productsData, productsTotal, pickupTotal] = await Promise.all([
          api.getCategories(),
          api.getProducts(params),
          api.getProductsCount({ activeOnly: true }),
          api.getPickupPointsCount()
        ]);
        setCategories(categoriesData.filter((category) => category.active));
        setProducts(productsData);
        setProductsCount(typeof productsTotal === 'number' ? productsTotal : null);
        setPickupPointsCount(typeof pickupTotal === 'number' ? pickupTotal : null);
      } catch (err) {
        setError(err.message || 'Не удалось загрузить каталог');
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, [params]);

  return (
    <section className="catalog-page" data-testid="home-page">
      <div className="grid gap-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft2">
          <div className="relative p-6 sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,0,0,0.06),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(0,0,0,0.05),transparent_35%)]" />
            <div className="relative grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Интернет-магазин ИП Гаврилова
                </div>
                <h1 className="mt-3 max-w-[18ch] text-4xl font-extrabold tracking-tight sm:text-5xl">
                  Дом, в который хочется возвращаться
                </h1>
                <p className="mt-4 max-w-prose text-sm text-muted-foreground sm:text-base">
                  Подбирайте мебель, освещение и товары для дома в одном месте. Быстрый заказ, прозрачные цены,
                  самовывоз или доставка курьером.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <a href="#catalog-start">
                    <Button>Перейти к каталогу</Button>
                  </a>
                  <a href="/pickup-points">
                    <Button variant="outline">Пункты выдачи</Button>
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={openAssistantWidget}
                  >
                    <Sparkles className="h-4 w-4" />
                    AI‑помощник
                  </Button>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-muted p-4">
                    <div className="text-lg font-extrabold">{formatCount(productsCount)}</div>
                    <div className="text-xs text-muted-foreground">товаров</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted p-4">
                    <div className="text-lg font-extrabold">{formatCount(pickupPointsCount)}</div>
                    <div className="text-xs text-muted-foreground">пунктов выдачи</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted p-4">
                    <div className="text-lg font-extrabold">4.9</div>
                    <div className="text-xs text-muted-foreground">средняя оценка</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 self-start">
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      GigaChat‑помощник
                    </CardTitle>
                    <CardDescription>Поможет выбрать товары и сравнить варианты прямо в магазине.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Откройте чат в правом нижнем углу или нажмите кнопку.
                    </div>
                    <Button type="button" className="gap-2" onClick={openAssistantWidget}>
                      <Sparkles className="h-4 w-4" />
                      Открыть AI‑чат
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div id="catalog-start" className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Фильтры</CardTitle>
              <CardDescription>Найдите нужное быстрее.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="query">
                  Поиск по названию
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="query"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Например, диван"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="category">
                  Категория
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Все категории</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {error ? <Alert variant="danger">{error}</Alert> : null}

            {loading ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">Загрузка каталога…</CardContent>
              </Card>
            ) : (
              <div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                data-testid="product-grid"
              >
                {products.length > 0 ? (
                  products.map((product) => <ProductCard key={product.id} product={product} />)
                ) : (
                  <Card className="sm:col-span-2 lg:col-span-3">
                    <CardContent className="p-6 text-sm text-muted-foreground">
                      По выбранным фильтрам товары не найдены.
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatCount(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('ru-RU').format(value);
}

function openAssistantWidget() {
  try {
    localStorage.setItem('assistantWidgetOpen', 'true');
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('assistantWidget:open'));
}
