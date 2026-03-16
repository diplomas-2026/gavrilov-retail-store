import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Alert } from '../components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);
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
    <div className="min-h-[calc(100vh-72px)]" data-testid="register-page">
      <div className="mx-auto grid max-w-6xl items-center gap-6 py-10 lg:grid-cols-2">
        <div className="hidden lg:block">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Новый аккаунт</div>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Регистрация</h1>
            <p className="mt-3 max-w-prose text-sm text-muted-foreground">
              Создайте аккаунт покупателя, чтобы оформлять заказы и отслеживать статусы. Регистрация занимает меньше минуты.
            </p>
            <div className="mt-6 rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
              Пароль должен быть не короче 8 символов.
            </div>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>Регистрация</CardTitle>
            <CardDescription>Заполните данные профиля.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="fullName">
                  ФИО
                </label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  maxLength={120}
                  placeholder="Иванов Иван Иванович"
                  autoComplete="name"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="name@example.com"
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
                    minLength={8}
                    autoComplete="new-password"
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
              <div className="grid gap-2">
                <label className="text-sm font-semibold" htmlFor="passwordRepeat">
                  Повторите пароль
                </label>
                <div className="relative">
                  <Input
                    id="passwordRepeat"
                    type={showPasswordRepeat ? 'text' : 'password'}
                    value={passwordRepeat}
                    onChange={(event) => setPasswordRepeat(event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordRepeat((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label={showPasswordRepeat ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPasswordRepeat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error ? <Alert variant="danger">{error}</Alert> : null}
              <Button type="submit" disabled={loading} data-testid="register-submit" className="w-full">
                {loading ? 'Создаем аккаунт…' : 'Зарегистрироваться'}
              </Button>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
                Войти
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
