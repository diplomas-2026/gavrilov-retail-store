import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ShoppingCart, LayoutGrid, MapPin, Shield, User, LogOut, Package, Tags, ClipboardList, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { cn } from '../lib/cn';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function AppLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { items } = useCart();

  const canManage = user && ['ADMIN', 'MANAGER'].includes(user.role);
  const isAdmin = user?.role === 'ADMIN';
  const isCustomer = user?.role === 'CUSTOMER';
  const roleLabel = user?.role === 'ADMIN'
    ? 'Администратор'
    : user?.role === 'MANAGER'
      ? 'Менеджер'
      : user?.role === 'CUSTOMER'
        ? 'Покупатель'
        : user?.role;

  const isAdminSection = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  const topNav = [
    { to: '/', label: 'Каталог', icon: LayoutGrid, show: true },
    { to: '/pickup-points', label: 'Пункты выдачи', icon: MapPin, show: true },
    { to: '/cart', label: 'Корзина', icon: ShoppingCart, show: isCustomer },
    { to: '/profile/orders', label: 'Мои заказы', icon: ClipboardList, show: isCustomer },
    { to: '/assistant', label: 'Помощник', icon: Sparkles, show: Boolean(user) },
    { to: '/admin', label: 'Управление', icon: Shield, show: canManage }
  ].filter((item) => item.show);

  const adminNav = [
    { to: '/admin', label: 'Обзор', icon: LayoutGrid, show: true },
    { to: '/admin/products', label: 'Товары', icon: Package, show: true },
    { to: '/admin/categories', label: 'Категории', icon: Tags, show: true },
    { to: '/admin/orders', label: 'Заказы', icon: ClipboardList, show: true },
    { to: '/admin/pickup-points', label: 'Пункты выдачи', icon: MapPin, show: isAdmin },
    { to: '/admin/users', label: 'Пользователи', icon: User, show: isAdmin }
  ].filter((item) => item.show);

  return (
    <div className="min-h-screen">
      <Disclosure as="header" className="sticky top-0 z-20 border-b border-border/70 bg-card/70 backdrop-blur">
        {({ open }) => (
          <>
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <Link to="/" className="group inline-flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
                    ИП
                  </span>
                  <div className="leading-tight">
                    <div className="font-extrabold tracking-tight">Магазин Гаврилова</div>
                    <div className="text-xs text-muted-foreground">каталог • заказы • управление</div>
                  </div>
                </Link>
              </div>

              <nav className="hidden items-center gap-1 md:flex">
                {topNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground',
                        isActive && 'bg-muted text-foreground'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.to === '/cart' && items.length > 0 ? <Badge className="ml-1">{items.length}</Badge> : null}
                  </NavLink>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                <Disclosure.Button as={Button} variant="outline" size="icon" className="md:hidden" aria-label="Меню">
                  <span className="text-base">{open ? '×' : '≡'}</span>
                </Disclosure.Button>

                {user ? (
                  <>
                    <Menu as="div" className="relative">
                      <Menu.Button className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left shadow-sm transition hover:bg-muted">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-xs font-extrabold">
                          {String(user.fullName || 'Пользователь')
                            .trim()
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>
                        <div className="hidden leading-tight sm:block">
                          <div className="text-sm font-bold">{user.fullName}</div>
                          <div className="text-xs text-muted-foreground">Роль: {roleLabel}</div>
                        </div>
                      </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-120"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-100"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-soft2 focus:outline-none">
                        <div className="p-3">
                          <div className="text-sm font-bold">{user.fullName}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                        <div className="h-px bg-border" />
                        <div className="p-1">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to={isCustomer ? '/profile/orders' : '/admin'}
                                className={cn(
                                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
                                  active && 'bg-muted'
                                )}
                              >
                                <User className="h-4 w-4" />
                                {isCustomer ? 'Личный кабинет' : 'Панель управления'}
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                onClick={logout}
                                className={cn(
                                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-destructive',
                                  active && 'bg-muted'
                                )}
                              >
                                <LogOut className="h-4 w-4" />
                                Выйти
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                    </Menu>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={logout}
                      data-testid="logout-button"
                      aria-label="Выйти"
                      className="hidden sm:inline-flex"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Link to="/login">
                    <Button>Войти</Button>
                  </Link>
                )}
              </div>
            </div>

            <Disclosure.Panel className="border-t border-border bg-card/80 md:hidden">
              <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
                <nav className="grid gap-1">
                  {topNav.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground',
                          isActive && 'bg-muted text-foreground'
                        )
                      }
                    >
                      <span className="inline-flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      {item.to === '/cart' && items.length > 0 ? <Badge>{items.length}</Badge> : null}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {isAdminSection && canManage ? (
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-[88px] rounded-xl border border-border bg-card p-3 shadow-soft">
                <div className="px-2 pb-2 pt-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Админ-раздел</div>
                </div>
                <nav className="grid gap-1">
                  {adminNav.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/admin'}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground',
                          isActive && 'bg-muted text-foreground'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </aside>
            <div>
              <Outlet />
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
