import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { formatCurrency } from '../utils/format';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { resolveMediaUrl } from '../utils/media';
import { Alert } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

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
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!product) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Загрузка товара…</CardTitle>
          <CardDescription>Пожалуйста, подождите.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const itemInCart = items.find((item) => item.productId === product.id);
  const qtyInCart = itemInCart?.qty || 0;
  const canIncrease = qtyInCart < Number(product.stockQty);

  return (
    <section className="grid gap-6 lg:grid-cols-[520px_1fr]" data-testid="product-details-page">
      <Card className="overflow-hidden">
        <div className="aspect-[4/3] w-full bg-muted">
          <img src={resolveMediaUrl(product.images?.[0])} alt={product.name} className="h-full w-full object-cover" />
        </div>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{product.categoryName}</Badge>
            <Badge variant="outline">Остаток: {product.stockQty} шт.</Badge>
          </div>
          <div className="mt-4 text-2xl font-extrabold tracking-tight">{formatCurrency(product.price)}</div>
          {product.oldPrice ? <div className="text-sm text-muted-foreground line-through">{formatCurrency(product.oldPrice)}</div> : null}
          <div className="mt-4">
            {user?.role === 'CUSTOMER' && qtyInCart === 0 ? (
              <Button onClick={() => addToCart(product)} data-testid="details-add-to-cart" className="w-full">
                Добавить в корзину
              </Button>
            ) : null}
            {user?.role === 'CUSTOMER' && qtyInCart > 0 ? (
              <div className="mt-2 flex items-center justify-center gap-3" data-testid="details-qty-control">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => updateQty(product.id, qtyInCart - 1)}
                  data-testid="details-decrease-cart-item"
                >
                  −
                </Button>
                <span className="min-w-10 text-center text-lg font-extrabold" data-testid="details-cart-qty">
                  {qtyInCart}
                </span>
                <Button
                  type="button"
                  onClick={() => addToCart(product)}
                  disabled={!canIncrease}
                  data-testid="details-increase-cart-item"
                >
                  +
                </Button>
              </div>
            ) : null}
            {user?.role !== 'CUSTOMER' ? (
              <div className="mt-3 text-xs text-muted-foreground">Покупка доступна только пользователям с ролью «Покупатель».</div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
          <CardDescription>Подробное описание и характеристики.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {product.description ? product.description : 'Описание пока не заполнено.'}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
