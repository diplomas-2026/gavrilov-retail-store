import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { formatCurrency } from '../utils/format';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { resolveMediaUrl } from '../utils/media';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { items, addToCart, updateQty } = useCart();
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

  const itemInCart = items.find((item) => item.productId === product.id);
  const qtyInCart = itemInCart?.qty || 0;
  const canIncrease = qtyInCart < Number(product.stockQty);

  return (
    <section className="panel details-page" data-testid="product-details-page">
      <img src={resolveMediaUrl(product.images?.[0])} alt={product.name} className="details-image" />
      <div>
        <p className="kicker">{product.categoryName}</p>
        <h1>{product.name}</h1>
        <p className="muted">{product.description}</p>
        <p className="price large">{formatCurrency(product.price)}</p>
        <p className="muted">Остаток: {product.stockQty} шт.</p>
        {user?.role === 'CUSTOMER' && qtyInCart === 0 && (
          <button className="primary-btn" onClick={() => addToCart(product)} data-testid="details-add-to-cart">
            Добавить в корзину
          </button>
        )}
        {user?.role === 'CUSTOMER' && qtyInCart > 0 && (
          <div className="qty-control details-qty-control" data-testid="details-qty-control">
            <button
              type="button"
              className="ghost-btn qty-btn"
              onClick={() => updateQty(product.id, qtyInCart - 1)}
              data-testid="details-decrease-cart-item"
            >
              -
            </button>
            <span className="qty-value" data-testid="details-cart-qty">{qtyInCart}</span>
            <button
              type="button"
              className="primary-btn qty-btn"
              onClick={() => addToCart(product)}
              disabled={!canIncrease}
              data-testid="details-increase-cart-item"
            >
              +
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
