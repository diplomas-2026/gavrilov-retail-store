import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function ForbiddenPage() {
  return (
    <Card data-testid="forbidden-page">
      <CardHeader>
        <CardTitle>Доступ запрещен</CardTitle>
        <CardDescription>У вас нет прав для просмотра этой страницы.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link to="/">
          <Button>На главную</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
