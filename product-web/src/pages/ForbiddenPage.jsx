import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <section className="status-card" data-testid="forbidden-page">
      <h1>Доступ запрещен</h1>
      <p>У вас нет прав для просмотра этой страницы.</p>
      <Link to="/" className="primary-btn">
        На главную
      </Link>
    </section>
  );
}
