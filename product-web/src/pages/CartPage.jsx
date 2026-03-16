import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/format';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function CartPage() {
  const { items, updateQty, removeItem, total } = useCart();

  return (
    <section className="grid gap-6" data-testid="cart-page">
      <Card>
        <CardHeader>
          <CardTitle>Корзина</CardTitle>
          <CardDescription>Проверьте количество и перейдите к оформлению заказа.</CardDescription>
        </CardHeader>
        <CardContent>
      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted p-6">
          <p className="text-sm text-muted-foreground">Корзина пуста. Перейдите в каталог и добавьте товары.</p>
          <div className="mt-4">
            <Link to="/" data-testid="go-catalog-empty-cart">
              <Button>К каталогу</Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Товар</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Кол-во</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-semibold">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatCurrency(item.price)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(event) => updateQty(item.productId, event.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(item.price * item.qty)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => removeItem(item.productId)}>
                        Удалить
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted p-4">
            <div className="text-sm font-extrabold">Итого: {formatCurrency(total)}</div>
            <Link to="/checkout" data-testid="go-checkout">
              <Button>Перейти к оформлению</Button>
            </Link>
          </div>
        </>
      )}
        </CardContent>
      </Card>
    </section>
  );
}
