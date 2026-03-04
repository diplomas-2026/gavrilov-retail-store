import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="status-card">
      <h1>Страница не найдена</h1>
      <Link to="/" className="primary-btn">
        Вернуться в каталог
      </Link>
    </section>
  );
}
