import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/cn';
import { Package, Tags, ClipboardList, MapPin, Users } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <section className="grid gap-6" data-testid="admin-dashboard-page">
      <Card>
        <CardHeader>
          <CardTitle>Панель управления</CardTitle>
          <CardDescription>Управляйте каталогом, заказами и пользователями магазина.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AdminTile to="/admin/products" title="Товары" icon={Package} />
            <AdminTile to="/admin/categories" title="Категории" icon={Tags} />
            <AdminTile to="/admin/orders" title="Заказы" icon={ClipboardList} />
            {isAdmin ? <AdminTile to="/admin/pickup-points" title="Пункты выдачи" icon={MapPin} /> : null}
            {isAdmin ? <AdminTile to="/admin/users" title="Пользователи" icon={Users} /> : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function AdminTile({ to, title, icon: Icon }) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft'
      )}
    >
      <div>
        <div className="text-sm font-extrabold">{title}</div>
        <div className="text-xs text-muted-foreground">Открыть раздел</div>
      </div>
      <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-muted text-muted-foreground transition group-hover:text-foreground">
        <Icon className="h-5 w-5" />
      </div>
    </Link>
  );
}
