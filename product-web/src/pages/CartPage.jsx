import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/format';

export default function CartPage() {
  const { items, updateQty, removeItem, total } = useCart();

  return (
    <section className="panel" data-testid="cart-page">
      <h1>Корзина</h1>
      {items.length === 0 ? (
        <div className="status-card">
          Корзина пуста. Перейдите в каталог и добавьте товары.
          <div>
            <Link className="primary-btn" to="/">
              К каталогу
            </Link>
          </div>
        </div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Товар</th>
                <th>Цена</th>
                <th>Кол-во</th>
                <th>Сумма</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.productId}>
                  <td>{item.name}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(event) => updateQty(item.productId, event.target.value)}
                    />
                  </td>
                  <td>{formatCurrency(item.price * item.qty)}</td>
                  <td>
                    <button className="ghost-btn" onClick={() => removeItem(item.productId)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="checkout-bar">
            <strong>Итого: {formatCurrency(total)}</strong>
            <Link className="primary-btn" to="/checkout" data-testid="go-checkout">
              Перейти к оформлению
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
