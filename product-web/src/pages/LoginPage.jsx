import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Alert } from '../components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      const from = location.state?.from;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'CUSTOMER') {
        navigate('/', { replace: true });
      } else {
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)]" data-testid="login-page">
      <div className="mx-auto grid max-w-6xl items-center gap-6 py-10 lg:grid-cols-2">
        <div className="hidden lg:block">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Добро пожаловать</div>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Вход в систему</h1>
            <p className="mt-3 max-w-prose text-sm text-muted-foreground">
              Авторизуйтесь, чтобы оформить заказ, отслеживать статусы и управлять каталогом (для менеджеров и администраторов).
            </p>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>Вход</CardTitle>
            <CardDescription>Введите email и пароль.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="password">
                  Пароль
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error ? <Alert variant="danger">{error}</Alert> : null}
              <Button type="submit" disabled={loading} data-testid="login-submit" className="w-full">
                {loading ? 'Входим…' : 'Войти'}
              </Button>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              Нет аккаунта?{' '}
              <Link to="/register" className="font-semibold text-foreground underline-offset-4 hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
