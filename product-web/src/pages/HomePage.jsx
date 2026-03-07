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
      <div className="landing-shell">
        <div className="landing-hero">
          <div className="landing-hero-content">
            <p className="landing-kicker">Интернет-магазин ИП Гаврилова</p>
            <h1>Дом, в который хочется возвращаться</h1>
            <p className="landing-lead">
              Подбирайте мебель, освещение и товары для дома в одном месте. Быстрый заказ, прозрачные цены,
              самовывоз или доставка курьером.
            </p>
            <div className="landing-actions">
              <a href="#catalog-start" className="primary-btn">
                Перейти к каталогу
              </a>
              <a href="/pickup-points" className="ghost-btn">
                Пункты выдачи
              </a>
            </div>
            <div className="landing-metrics">
              <div>
                <strong>5000+</strong>
                <span>товаров</span>
              </div>
              <div>
                <strong>24 часа</strong>
                <span>сборка заказа</span>
              </div>
              <div>
                <strong>4.9</strong>
                <span>средняя оценка</span>
              </div>
            </div>
          </div>
          <div className="landing-hero-card">
            <p>Что внутри платформы</p>
            <ul>
              <li>Умный поиск по каталогу</li>
              <li>Актуальные остатки и статусы</li>
              <li>Безопасная авторизация и личный кабинет</li>
              <li>Контроль заказов на каждом этапе</li>
            </ul>
          </div>
        </div>

        <div className="landing-features">
          <article className="landing-feature-card">
            <h3>Проверенные поставщики</h3>
            <p>Работаем с надежными брендами и локальными производителями с гарантией качества.</p>
          </article>
          <article className="landing-feature-card">
            <h3>Быстрая логистика</h3>
            <p>Выбирайте удобный пункт выдачи или курьерскую доставку по вашему адресу.</p>
          </article>
          <article className="landing-feature-card">
            <h3>Поддержка менеджера</h3>
            <p>Менеджеры помогают с подбором, наличием и оформлением заказа без лишних шагов.</p>
          </article>
        </div>

        <div className="landing-process">
          <h2>Как это работает</h2>
          <div className="landing-steps">
            <div className="landing-step">
              <span>01</span>
              <p>Выберите товары и добавьте их в корзину</p>
            </div>
            <div className="landing-step">
              <span>02</span>
              <p>Укажите формат получения: самовывоз или доставка</p>
            </div>
            <div className="landing-step">
              <span>03</span>
              <p>Отслеживайте статус заказа в личном кабинете</p>
            </div>
          </div>
        </div>
      </div>

      <div id="catalog-start" className="panel filters-panel">
        <label>
          Поиск по названию
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Например, диван"
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
