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
  const [quota, setQuota] = useState(null);
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

  const refreshQuota = async () => {
    if (!user) return;
    try {
      const res = await api.getAssistantQuota();
      setQuota(res || null);
    } catch {
      // Квота — вспомогательная инфа, не мешаем чату.
    }
  };

  useEffect(() => {
    setMessages([]);
    lastIdRef.current = null;
    setError('');
    setQuota(null);

    if (!user) {
      return;
    }

    let alive = true;
    (async () => {
      if (!alive) return;
      await refreshQuota();
      await refresh({ sinceId: null });
      queueMicrotask(scrollToBottom);
    })();

    const timer = setInterval(() => {
      refresh();
      refreshQuota();
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
      refreshQuota();
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

          {user ? <QuotaInfo quota={quota} /> : null}

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
                  usage={{
                    promptTokens: m.promptTokens,
                    completionTokens: m.completionTokens,
                    totalTokens: m.totalTokens,
                    model: m.model
                  }}
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

function QuotaInfo({ quota }) {
  if (!quota) {
    return (
      <div className="text-xs text-muted-foreground" data-testid="assistant-quota">
        Лимит токенов: загрузка…
      </div>
    );
  }

  const nf = new Intl.NumberFormat('ru-RU');
  const hasLimit = quota.dailyTokenLimit != null && quota.remainingTokens !== -1;
  const limitText = hasLimit ? `${nf.format(quota.dailyTokenLimit)} токенов/сутки` : 'без ограничений';
  const usedText = nf.format(quota.usedTokens ?? 0);
  const remainingText = hasLimit ? nf.format(Math.max(0, quota.remainingTokens ?? 0)) : '∞';
  const resetText = quota.periodEnd ? formatDateTimeInZone(new Date(quota.periodEnd), quota.timeZone) : '';

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" data-testid="assistant-quota">
      <span>
        Лимит: <span className="font-medium text-foreground">{limitText}</span>
      </span>
      <span>
        Использовано: <span className="font-medium text-foreground">{usedText}</span>
      </span>
      <span>
        Осталось: <span className="font-medium text-foreground">{remainingText}</span>
      </span>
      {resetText ? <span>Сброс: {resetText}</span> : null}
      {quota.timeZone ? <span>({quota.timeZone})</span> : null}
    </div>
  );
}

function Message({ role, text, isError = false, usage }) {
  const isUser = role === 'user';
  const usageText = formatUsage(usage);
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div className="max-w-[80%]">
        <div
          className={
            isUser
              ? 'rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground shadow-soft'
              : `rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                  isError ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-border bg-card text-foreground'
                }`
          }
        >
          {text}
        </div>
        {usageText ? (
          <div className={isUser ? 'mt-1 text-right text-[11px] text-muted-foreground' : 'mt-1 text-[11px] text-muted-foreground'}>
            {usageText}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatUsage(usage) {
  if (!usage) return '';
  const total = usage.totalTokens ?? null;
  const prompt = usage.promptTokens ?? null;
  const completion = usage.completionTokens ?? null;
  const model = usage.model ?? '';

  const parts = [];
  if (total != null) parts.push(`Токены: ${total}`);
  else if (prompt != null || completion != null) parts.push(`Токены: ${prompt ?? '?'} + ${completion ?? '?'}`);

  if (model) parts.push(model);
  return parts.join(' · ');
}

function formatDateTimeInZone(date, timeZone) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: timeZone || undefined,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return date.toLocaleString('ru-RU');
  }
}
