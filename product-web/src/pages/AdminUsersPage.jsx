import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert } from '../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const roles = ['ADMIN', 'MANAGER', 'CUSTOMER'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = () => {
    api
      .getUsers()
      .then(setUsers)
      .catch((err) => setError(err.message || 'Ошибка загрузки пользователей'));
  };

  useEffect(() => {
    load();
  }, []);

  const updateRole = async (userId, role) => {
    try {
      await api.updateUserRole(userId, { role });
      load();
    } catch (err) {
      setError(err.message || 'Не удалось изменить роль');
    }
  };

  return (
    <section className="grid gap-6" data-testid="admin-users-page">
      <Card>
        <CardHeader>
          <CardTitle>Пользователи</CardTitle>
          <CardDescription>Управление ролями пользователей.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {error ? <Alert variant="danger" className="mb-4">{error}</Alert> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Активен</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="font-semibold">{user.fullName}</TableCell>
                  <TableCell>
                    <select
                      value={user.role}
                      onChange={(event) => updateRole(user.id, event.target.value)}
                      className="h-9 w-full min-w-[180px] rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.active ? 'Да' : 'Нет'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
