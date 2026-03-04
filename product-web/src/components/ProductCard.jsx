import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const canBuy = user?.role === 'CUSTOMER';

  return (
    <article className="product-card" data-testid="product-card">
      <div className="product-image-wrap">
        <img src={product.images?.[0]} alt={product.name} className="product-image" />
      </div>
      <div className="product-content">
        <h3>{product.name}</h3>
        <p className="muted">{product.categoryName}</p>
        <p className="price">{formatCurrency(product.price)}</p>
        <p className="muted">Остаток: {product.stockQty} шт.</p>
        <div className="card-actions">
          <Link className="ghost-btn" to={`/products/${product.id}`}>
            Подробнее
          </Link>
          {canBuy && (
            <button className="primary-btn" onClick={() => addToCart(product)} data-testid={`add-to-cart-${product.id}`}>
              В корзину
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
