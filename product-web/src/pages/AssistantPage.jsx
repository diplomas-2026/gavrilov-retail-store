import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Alert } from '../components/ui/alert';

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Здравствуйте! Задайте вопрос — я отвечу.'
    }
  ]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSend = useMemo(() => question.trim().length > 0 && !loading, [question, loading]);

  const send = async (event) => {
    event.preventDefault();
    const q = question.trim();
    if (!q || loading) {
      return;
    }

    setError('');
    setLoading(true);
    setQuestion('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);

    try {
      const res = await api.askAssistant({ question: q });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.answer || '...' }]);
    } catch (err) {
      setError(err.message || 'Не удалось получить ответ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid gap-6" data-testid="assistant-page">
      <Card>
        <CardHeader>
          <CardTitle>AI‑помощник</CardTitle>
          <CardDescription>Демо‑режим: один вопрос → один ответ (без контекста).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error ? <Alert variant="danger">{error}</Alert> : null}

          <div className="max-h-[56vh] overflow-auto rounded-xl border border-border bg-muted p-4">
            <div className="grid gap-3">
              {messages.map((m, idx) => (
                <Message key={idx} role={m.role} text={m.text} />
              ))}
              {loading ? <Message role="assistant" text="Думаю…" /> : null}
            </div>
          </div>

          <form onSubmit={send} className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Например: какой диван лучше для маленькой комнаты?"
              maxLength={500}
            />
            <Button type="submit" disabled={!canSend} className="sm:w-40">
              Отправить
            </Button>
          </form>
          <div className="text-xs text-muted-foreground">
            Помощник использует GigaChat. Токен хранится на API, в веб‑клиент не передается.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function Message({ role, text }) {
  const isUser = role === 'user';
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          isUser
            ? 'max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground shadow-soft'
            : 'max-w-[80%] rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm'
        }
      >
        {text}
      </div>
    </div>
  );
}

