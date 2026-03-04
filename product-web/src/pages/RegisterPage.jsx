import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== passwordRepeat) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const user = await register(fullName, email, password);
      if (user.role === 'CUSTOMER') {
        navigate('/', { replace: true });
      } else {
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" data-testid="register-page">
      <div className="auth-card">
        <h1>Регистрация</h1>
        <form onSubmit={onSubmit} className="stack-form">
          <label>
            ФИО
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={120} />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </label>
          <label>
            Повторите пароль
            <input
              type="password"
              value={passwordRepeat}
              onChange={(event) => setPasswordRepeat(event.target.value)}
              required
              minLength={8}
            />
          </label>
          {error && <div className="error-box">{error}</div>}
          <button className="primary-btn" type="submit" disabled={loading} data-testid="register-submit">
            {loading ? 'Создаем аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="muted auth-switch-line">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
