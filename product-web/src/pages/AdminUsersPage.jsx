import { useEffect, useState } from 'react';
import { api } from '../api/client';

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
    <section className="panel" data-testid="admin-users-page">
      <h1>Пользователи и роли</h1>
      {error && <div className="error-box">{error}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Имя</th>
            <th>Роль</th>
            <th>Активен</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.fullName}</td>
              <td>
                <select value={user.role} onChange={(event) => updateRole(user.id, event.target.value)}>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </td>
              <td>{user.active ? 'Да' : 'Нет'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
