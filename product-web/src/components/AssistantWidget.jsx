import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, X } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';

const STORAGE_KEY = 'assistantWidgetOpen';

function readStoredOpen() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

export default function AssistantWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(readStoredOpen);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quota, setQuota] = useState(null);

  const listRef = useRef(null);
  const lastIdRef = useRef(null);

  const canSend = useMemo(() => {
    const hasText = question.trim().length > 0;
    const quotaOk = quota ? quota.remainingTokens !== 0 : true;
    return Boolean(user) && hasText && !loading && quotaOk;
  }, [question, loading, user, quota]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isOpen));
    } catch {
      // ignore
    }
  }, [isOpen]);

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

  const refreshMessages = async (opts = {}) => {
    if (!user) return;
    try {
      const res = await api.listAssistantMessages({
        sinceId: opts.sinceId ?? lastIdRef.current,
        limit: 200
      });
      mergeMessages(res.messages || []);
    } catch {
      // В виджете ошибки лучше не дублировать агрессивно.
    }
  };

  const refreshQuota = async () => {
    if (!user) return;
    try {
      const res = await api.getAssistantQuota();
      setQuota(res || null);
    } catch {
      // ignore
    }
  };

  // Загрузка при первом открытии и при смене пользователя.
  useEffect(() => {
    setMessages([]);
    lastIdRef.current = null;
    setError('');
    setQuota(null);

    if (!isOpen) return;
    if (!user) return;

    let alive = true;
    (async () => {
      if (!alive) return;
      await refreshQuota();
      await refreshMessages({ sinceId: null });
      queueMicrotask(scrollToBottom);
    })();

    const timer = setInterval(() => {
      refreshMessages();
      refreshQuota();
    }, 15000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id]);

  const send = async (event) => {
    event.preventDefault();
    const q = question.trim();
    if (!user || !q || loading) return;
    if (quota && quota.remainingTokens === 0) return;

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

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50" data-testid="assistant-widget-launcher">
        <Button
          type="button"
          size="icon"
          className="h-12 w-12 rounded-full shadow-soft2"
          onClick={() => setIsOpen(true)}
          aria-label="Открыть чат"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)]" data-testid="assistant-widget">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft2">
        <div className="relative flex items-center justify-between gap-3 bg-primary px-3 py-3 text-primary-foreground">
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold leading-tight">Операторов нет в сети</div>
            <div className="truncate text-[11px] text-primary-foreground/80">AI‑помощник • ответы мгновенно</div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/15 transition hover:bg-primary-foreground/25"
            aria-label="Скрыть чат"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border px-3 py-2">
          <QuotaInfo quota={quota} />
        </div>

        <div ref={listRef} className="max-h-[56vh] overflow-auto bg-muted/40 px-3 py-3">
          <div className="grid gap-3">
            {!user ? <GuestIntro /> : null}

            {user && messages.length === 0 ? (
              <Bubble role="assistant">
                <div className="whitespace-pre-line">
                  Вас приветствует команда поддержки Цифровой Витрины!
                  {'\n\n'}
                  Мы работаем для Вас с 9 до 18 часов по Московскому времени с понедельника по пятницу.
                  {'\n\n'}
                  Напишите ваш вопрос и мы поможем в ближайшее рабочее время!
                </div>
              </Bubble>
            ) : null}

            {user
              ? messages.map((m) => (
                  <Bubble key={m.id} role={m.author === 'USER' ? 'user' : 'assistant'} isError={Boolean(m.isError)} usage={m}>
                    {m.message}
                  </Bubble>
                ))
              : null}

            {loading ? <Bubble role="assistant">Думаю…</Bubble> : null}
          </div>
        </div>

        <div className="border-t border-border bg-card px-3 py-3">
          {error ? <div className="mb-2 text-xs text-destructive">{error}</div> : null}

          <form onSubmit={send} className="flex items-center gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={user ? 'Введите сообщение' : 'Войдите, чтобы написать'}
              maxLength={500}
              disabled={!user}
            />
            <Button type="submit" size="icon" disabled={!canSend} aria-label="Отправить">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function GuestIntro() {
  return (
    <Bubble role="assistant">
      Чтобы пользоваться чатом, нужно{' '}
      <Link to="/login" className="font-semibold underline-offset-4 hover:underline">
        авторизироваться
      </Link>
      .
    </Bubble>
  );
}

function Bubble({ role, children, isError = false, usage }) {
  const isUser = role === 'user';
  const usageText = formatUsage(usage);
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div className="max-w-[82%]">
        <div
          className={
            isUser
              ? 'rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground shadow-soft'
              : `rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                  isError ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-border bg-card text-foreground'
                }`
          }
        >
          {children}
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

function QuotaInfo({ quota }) {
  if (!quota) {
    return <div className="text-[11px] text-muted-foreground">Лимит токенов: загрузка…</div>;
  }

  const nf = new Intl.NumberFormat('ru-RU');
  const hasLimit = quota.dailyTokenLimit != null && quota.remainingTokens !== -1;
  const limitText = hasLimit ? `${nf.format(quota.dailyTokenLimit)} / сутки` : 'без ограничений';
  const usedText = nf.format(quota.usedTokens ?? 0);
  const remainingText = hasLimit ? nf.format(Math.max(0, quota.remainingTokens ?? 0)) : '∞';
  const resetText = quota.periodEnd ? formatDateTimeInZone(new Date(quota.periodEnd), quota.timeZone) : '';

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground" data-testid="assistant-widget-quota">
      <span>
        Лимит: <span className="font-semibold text-foreground">{limitText}</span>
      </span>
      <span>
        Использовано: <span className="font-semibold text-foreground">{usedText}</span>
      </span>
      <span>
        Осталось: <span className="font-semibold text-foreground">{remainingText}</span>
      </span>
      {resetText ? <span>Сброс: {resetText}</span> : null}
    </div>
  );
}

function formatDateTimeInZone(date, timeZone) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: timeZone || undefined,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return date.toLocaleString('ru-RU');
  }
}

