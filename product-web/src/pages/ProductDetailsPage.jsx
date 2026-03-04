import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { formatCurrency } from '../utils/format';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getProduct(id)
      .then(setProduct)
      .catch((err) => setError(err.message || 'Товар не найден'));
  }, [id]);

  if (error) {
    return <div className="error-box">{error}</div>;
  }

  if (!product) {
    return <div className="status-card">Загрузка товара...</div>;
  }

  return (
    <section className="panel details-page" data-testid="product-details-page">
      <img src={product.images?.[0]} alt={product.name} className="details-image" />
      <div>
        <p className="kicker">{product.categoryName}</p>
        <h1>{product.name}</h1>
        <p className="muted">{product.description}</p>
        <p className="price large">{formatCurrency(product.price)}</p>
        <p className="muted">Остаток: {product.stockQty} шт.</p>
        {user?.role === 'CUSTOMER' && (
          <button className="primary-btn" onClick={() => addToCart(product)} data-testid="details-add-to-cart">
            Добавить в корзину
          </button>
        )}
      </div>
    </section>
  );
}
