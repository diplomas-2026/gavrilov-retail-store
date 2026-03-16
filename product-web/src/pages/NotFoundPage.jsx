import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function NotFoundPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Страница не найдена</CardTitle>
        <CardDescription>Проверьте адрес или вернитесь в каталог.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link to="/">
          <Button>Вернуться в каталог</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
