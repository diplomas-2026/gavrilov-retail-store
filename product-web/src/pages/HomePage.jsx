import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
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
        const [categoriesData, productsData] = await Promise.all([api.getCategories(), api.getProducts(params)]);
        setCategories(categoriesData.filter((category) => category.active));
        setProducts(productsData);
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
      <div className="hero-banner">
        <div>
          <p className="kicker">Розничный магазин</p>
          <h1>Свежие продукты каждый день</h1>
          <p>
            Онлайн-витрина ИП Гаврилова Т.В. с актуальными ценами, остатками и быстрым оформлением заказов.
          </p>
        </div>
      </div>

      <div className="panel filters-panel">
        <label>
          Поиск по названию
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Например, молоко"
          />
        </label>
        <label>
          Категория
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="status-card">Загрузка каталога...</div>
      ) : (
        <div className="product-grid" data-testid="product-grid">
          {products.length > 0 ? (
            products.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            <div className="status-card">По выбранным фильтрам товары не найдены</div>
          )}
        </div>
      )}
    </section>
  );
}
