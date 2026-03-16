import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Alert } from '../components/ui/alert';
import { useAuth } from '../contexts/AuthContext';

export default function AssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const lastIdRef = useRef(null);

  const canSend = useMemo(() => Boolean(user) && question.trim().length > 0 && !loading, [question, loading, user]);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const mergeMessages = (incoming) => {
    if (!Array.isArray(incoming) || incoming.length === 0) return;
    setMessages((prev) => {
      const existing = new Set(prev.map((m) => m.id));
      const next = [...prev];
      for (const msg of incoming) {
        if (!existing.has(msg.id)) next.push(msg);
      }
      next.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
      return next;
    });
    const last = incoming[incoming.length - 1];
    if (last?.id != null) lastIdRef.current = last.id;
    queueMicrotask(scrollToBottom);
  };

  const refresh = async (opts = {}) => {
    if (!user) return;
    try {
      const res = await api.listAssistantMessages({
        sinceId: opts.sinceId ?? lastIdRef.current,
        limit: 200
      });
      mergeMessages(res.messages || []);
    } catch (err) {
      // В чат не пишем, просто показываем сверху.
      setError(err.message || 'Не удалось загрузить чат');
    }
  };

  useEffect(() => {
    setMessages([]);
    lastIdRef.current = null;
    setError('');

    if (!user) {
      return;
    }

    let alive = true;
    (async () => {
      if (!alive) return;
      await refresh({ sinceId: null });
      queueMicrotask(scrollToBottom);
    })();

    const timer = setInterval(() => {
      refresh();
    }, 15000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const send = async (event) => {
    event.preventDefault();
    const q = question.trim();
    if (!user || !q || loading) {
      return;
    }

    setError('');
    setLoading(true);
    setQuestion('');

    try {
      const res = await api.sendAssistantMessage({ question: q });
      const newMessages = [];
      if (res.userMessage) newMessages.push(res.userMessage);
      if (res.assistantMessage) newMessages.push(res.assistantMessage);
      mergeMessages(newMessages);
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
          <CardDescription>Демо‑режим: вопрос → ответ. Сообщения сохраняются в базе (без контекста для LLM).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {!user ? (
            <Alert variant="info">
              Чтобы пользоваться помощником, нужно{' '}
              <Link to="/login" className="font-semibold underline-offset-4 hover:underline">
                авторизироваться
              </Link>
              .
            </Alert>
          ) : null}
          {error ? <Alert variant="danger">{error}</Alert> : null}

          <div ref={listRef} className="max-h-[56vh] overflow-auto rounded-xl border border-border bg-muted p-4">
            <div className="grid gap-3">
              {messages.length === 0 ? (
                <Message role="assistant" text="Здравствуйте! Задайте вопрос — я отвечу." />
              ) : null}
              {messages.map((m) => (
                <Message
                  key={m.id}
                  role={m.author === 'USER' ? 'user' : 'assistant'}
                  text={m.message}
                  isError={Boolean(m.isError)}
                />
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
              disabled={!user}
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

function Message({ role, text, isError = false }) {
  const isUser = role === 'user';
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          isUser
            ? 'max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground shadow-soft'
            : `max-w-[80%] rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                isError ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-border bg-card text-foreground'
              }`
        }
      >
        {text}
      </div>
    </div>
  );
}
