import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { formatCurrency } from '../utils/format';

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
    <section className="panel" data-testid="admin-products-page">
      <h1>Товары</h1>
      <form className="stack-form" onSubmit={submit}>
        <label>
          SKU
          <input
            data-testid="product-sku-input"
            value={form.sku}
            onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
            required
          />
        </label>
        <label>
          Название
          <input
            data-testid="product-name-input"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            required
          />
        </label>
        <label>
          Описание
          <textarea
            data-testid="product-description-input"
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          />
        </label>
        <label>
          Цена
          <input
            data-testid="product-price-input"
            type="number"
            step="0.01"
            min="0.01"
            value={form.price}
            onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
            required
          />
        </label>
        <label>
          Старая цена
          <input
            data-testid="product-old-price-input"
            type="number"
            step="0.01"
            min="0"
            value={form.oldPrice}
            onChange={(e) => setForm((s) => ({ ...s, oldPrice: e.target.value }))}
          />
        </label>
        <label>
          Остаток
          <input
            data-testid="product-stock-input"
            type="number"
            min="0"
            value={form.stockQty}
            onChange={(e) => setForm((s) => ({ ...s, stockQty: e.target.value }))}
            required
          />
        </label>
        <label>
          Категория
          <select
            data-testid="product-category-select"
            value={form.categoryId}
            onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value }))}
            required
          >
            <option value="">Выберите категорию</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          URL изображений (через запятую)
          <input
            data-testid="product-images-input"
            value={form.images}
            onChange={(e) => setForm((s) => ({ ...s, images: e.target.value }))}
          />
        </label>
        <button className="primary-btn" type="submit" data-testid="save-product">
          Добавить товар
        </button>
      </form>
      {error && <div className="error-box">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Название</th>
            <th>Категория</th>
            <th>Цена</th>
            <th>Остаток</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.sku}</td>
              <td>{product.name}</td>
              <td>{product.categoryName}</td>
              <td>{formatCurrency(product.price)}</td>
              <td>{product.stockQty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
