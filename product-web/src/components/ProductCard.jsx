import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { resolveMediaUrl } from '../utils/media';

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { items, addToCart, updateQty } = useCart();
  const canBuy = user?.role === 'CUSTOMER';
  const itemInCart = items.find((item) => item.productId === product.id);
  const qtyInCart = itemInCart?.qty || 0;
  const canIncrease = qtyInCart < Number(product.stockQty);

  return (
    <article className="product-card" data-testid="product-card">
      <div className="product-image-wrap">
        <img src={resolveMediaUrl(product.images?.[0])} alt={product.name} className="product-image" />
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
          {canBuy && qtyInCart === 0 && (
            <button className="primary-btn" onClick={() => addToCart(product)} data-testid={`add-to-cart-${product.id}`}>
              В корзину
            </button>
          )}
          {canBuy && qtyInCart > 0 && (
            <div className="qty-control" data-testid={`qty-control-${product.id}`}>
              <button
                type="button"
                className="ghost-btn qty-btn"
                onClick={() => updateQty(product.id, qtyInCart - 1)}
                data-testid={`decrease-cart-item-${product.id}`}
              >
                -
              </button>
              <span className="qty-value" data-testid={`cart-qty-${product.id}`}>{qtyInCart}</span>
              <button
                type="button"
                className="primary-btn qty-btn"
                onClick={() => addToCart(product)}
                disabled={!canIncrease}
                data-testid={`increase-cart-item-${product.id}`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
