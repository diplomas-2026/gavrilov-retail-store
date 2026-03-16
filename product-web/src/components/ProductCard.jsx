import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { resolveMediaUrl } from '../utils/media';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { ShoppingCart } from 'lucide-react';

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { items, addToCart, updateQty } = useCart();
  const canBuy = Boolean(user);
  const itemInCart = items.find((item) => item.productId === product.id);
  const qtyInCart = itemInCart?.qty || 0;
  const canIncrease = qtyInCart < Number(product.stockQty);

  return (
    <Card className="overflow-hidden" data-testid="product-card">
      <div className="relative aspect-[4/3] w-full bg-muted">
        <img
          src={resolveMediaUrl(product.images?.[0])}
          alt={product.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="outline" className="bg-card/80 backdrop-blur">
            {product.categoryName}
          </Badge>
          {Number(product.stockQty) === 0 ? (
            <Badge variant="danger" className="bg-card/80 backdrop-blur">
              Нет в наличии
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-extrabold leading-snug">{product.name}</h3>
          <div className="text-right">
            <div className="text-base font-extrabold tracking-tight">{formatCurrency(product.price)}</div>
            {product.oldPrice ? (
              <div className="text-xs text-muted-foreground line-through">{formatCurrency(product.oldPrice)}</div>
            ) : null}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Остаток: {product.stockQty} шт.</div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Link to={`/products/${product.id}`}>
            <Button variant="outline" size="sm">
              Подробнее
            </Button>
          </Link>

          {canBuy && qtyInCart === 0 ? (
            <Button onClick={() => addToCart(product)} size="sm" data-testid={`add-to-cart-${product.id}`}>
              <ShoppingCart className="h-4 w-4" />
              В корзину
            </Button>
          ) : null}

          {canBuy && qtyInCart > 0 ? (
            <div className="inline-flex items-center gap-2" data-testid={`qty-control-${product.id}`}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQty(product.id, qtyInCart - 1)}
                data-testid={`decrease-cart-item-${product.id}`}
              >
                −
              </Button>
              <span className="min-w-8 text-center text-sm font-extrabold" data-testid={`cart-qty-${product.id}`}>
                {qtyInCart}
              </span>
              <Button
                size="sm"
                onClick={() => addToCart(product)}
                disabled={!canIncrease}
                data-testid={`increase-cart-item-${product.id}`}
              >
                +
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
