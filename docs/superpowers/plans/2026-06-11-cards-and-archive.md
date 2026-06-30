# Card 세션 + Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/study` and `/archive` placeholder routes with the full daily Card review session (single-focus viewer with auto-archive flow), the Archive masonry browse (with inline expand + return-to-field), and a shared create-card modal — per `docs/superpowers/specs/2026-06-11-cards-and-archive-design.md`.

**Architecture:** Build bottom-up: extend Zod schemas → typed endpoint wrappers over the existing axios client → cross-cutting primitives (Toast queue, responsive Dialog, Skeleton, EmptyState, TagChip) → feature-local hooks that call endpoints + emit toasts → feature components/sections → pages → router/App wiring. Tests use MSW node (`setupServer`) so the same handlers serve both browser dev and Vitest. Memory mock store inside the handlers gives the feature realistic state during dev. All UX copy is verbatim from the spec's tone rules (no "실패", uses "순환 완료", "배경 지식", "잠시 후 다시 만나요").

**Tech Stack:** Same as 1차 — Vite + React 18 + TS + Tailwind v4 + TanStack Query v5 + axios + Zod + MSW v2 + Vitest/Testing Library + @iconify/react.

---

## File Map

**New:**
- `src/lib/api/endpoints/card.ts` — typed function API over the 7 card endpoints
- `src/lib/api/endpoints/card.test.ts`
- `src/lib/toast/toastQueue.ts` — store (subscribe/dispatch)
- `src/lib/toast/useToast.ts` — public hook
- `src/lib/toast/toastQueue.test.ts`
- `src/components/Toast.tsx` — single toast view
- `src/components/ToastProvider.tsx` — portal + queue subscriber
- `src/components/ToastProvider.test.tsx`
- `src/components/Dialog.tsx` — responsive Dialog/BottomSheet
- `src/components/Dialog.test.tsx`
- `src/components/Skeleton.tsx`
- `src/components/EmptyState.tsx`
- `src/components/TagChip.tsx`
- `src/components/TagChip.test.tsx`
- `src/mocks/handlers/card.handlers.ts` — 7 handlers + in-memory store + reset helper
- `src/mocks/node.ts` — `setupServer` for Vitest
- `src/features/cards/StudyPage.tsx`
- `src/features/cards/ArchivePage.tsx`
- `src/features/cards/sections/TodayQueueView.tsx`
- `src/features/cards/sections/TodayEmptyView.tsx`
- `src/features/cards/sections/ArchiveMasonry.tsx`
- `src/features/cards/sections/ArchiveCard.tsx`
- `src/features/cards/components/OnFieldCardFace.tsx`
- `src/features/cards/components/ProgressIndicator.tsx`
- `src/features/cards/components/KeywordInput.tsx`
- `src/features/cards/components/KeywordInput.test.tsx`
- `src/features/cards/components/TagInput.tsx`
- `src/features/cards/components/TagFilterRow.tsx`
- `src/features/cards/components/CreateCardDialog.tsx`
- `src/features/cards/components/CreateCardDialog.test.tsx`
- `src/features/cards/hooks/useTodayReview.ts`
- `src/features/cards/hooks/useTodayReview.test.tsx`
- `src/features/cards/hooks/useExtendSession.ts`
- `src/features/cards/hooks/useViewCard.ts`
- `src/features/cards/hooks/useViewCard.test.tsx`
- `src/features/cards/hooks/useArchive.ts`
- `src/features/cards/hooks/useArchive.test.tsx`
- `src/features/cards/hooks/useReturnToField.ts`
- `src/features/cards/hooks/useArchiveCard.ts`
- `src/features/cards/hooks/useCreateCard.ts`

**Modified:**
- `src/lib/api/schemas/card.ts` — add `CreateCardRequestSchema`
- `src/lib/api/schemas/card.test.ts` — test for new schema
- `src/mocks/handlers/index.ts` — register card handlers
- `src/app/router.tsx` — swap `/study` and `/archive` placeholders for real pages
- `src/app/App.tsx` — wrap with `ToastProvider`
- `src/app/main.tsx` — no change (MSW boot stays)
- `test/setup.ts` — start/reset MSW node server around tests

---

## Task 1: Extend Card schemas with `CreateCardRequest`

**Files:**
- Modify: `src/lib/api/schemas/card.ts`
- Modify: `src/lib/api/schemas/card.test.ts`

- [ ] **Step 1: Append to `card.test.ts`** (before final closing — add new `describe`):

```ts
import { CreateCardRequestSchema } from './card';

describe('CreateCardRequestSchema', () => {
  it('parses a minimal valid request', () => {
    const r = CreateCardRequestSchema.parse({
      summary: 'JPA 영속성 컨텍스트가 1차 캐시 역할',
      keywords: ['JPA'],
      tags: [],
    });
    expect(r.keywords).toHaveLength(1);
  });
  it('rejects empty keywords', () => {
    expect(() =>
      CreateCardRequestSchema.parse({ summary: 'x', keywords: [], tags: [] }),
    ).toThrow();
  });
  it('rejects summary longer than 500', () => {
    expect(() =>
      CreateCardRequestSchema.parse({
        summary: 'x'.repeat(501),
        keywords: ['k'],
        tags: [],
      }),
    ).toThrow();
  });
});
```

(Keep the existing top imports — do not duplicate.)

- [ ] **Step 2: Run `npm run test -- card` → fail** (`CreateCardRequestSchema` undefined).

- [ ] **Step 3: Append to `card.ts`** (after existing exports):

```ts
export const CreateCardRequestSchema = z.object({
  summary: z.string().min(1).max(500),
  keywords: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string()).default([]),
});
export type CreateCardRequest = z.infer<typeof CreateCardRequestSchema>;
```

- [ ] **Step 4: Run `npm run test -- card` → pass (9 tests in this file).**

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/schemas/card.ts src/lib/api/schemas/card.test.ts
git commit -m "feat(schemas): add CreateCardRequestSchema for card creation"
```

---

## Task 2: Card endpoints (typed API wrappers)

**Files:**
- Create: `src/lib/api/endpoints/card.ts`, `src/lib/api/endpoints/card.test.ts`
- Delete: `src/lib/api/endpoints/.gitkeep`

- [ ] **Step 1: Write `card.test.ts`** — mocks axios via `vi.mock`, asserts URL/payload/parse:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
  ApiError: class extends Error {
    code: string;
    status: number;
    constructor(code: string, msg: string, status: number) {
      super(msg);
      this.code = code;
      this.status = status;
    }
  },
}));

import { apiClient } from '@/lib/api/client';
import {
  getTodayReview,
  viewCard,
  archiveCard,
  extendSession,
  listArchiveCards,
  returnToField,
  createCard,
} from './card';

const mockGet = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const mockPost = apiClient.post as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
});

describe('getTodayReview', () => {
  it('hits /api/review-session/today with dailyTarget', async () => {
    mockGet.mockResolvedValue({
      data: { stateBreakdown: { DAY_1: 1, DAY_3: 0, DAY_7: 0 }, recommended: 1, cards: [] },
    });
    const r = await getTodayReview({ dailyTarget: 30 });
    expect(mockGet).toHaveBeenCalledWith('/review-session/today', {
      params: { dailyTarget: 30 },
    });
    expect(r.recommended).toBe(1);
  });
});

describe('viewCard', () => {
  it('POSTs /cards/{id}/view and returns parsed response', async () => {
    mockPost.mockResolvedValue({
      data: {
        autoArchived: false,
        archiveReason: null,
        lastViewedAt: '2026-06-11T00:00:00Z',
        viewCount: 1,
      },
    });
    const r = await viewCard('c1');
    expect(mockPost).toHaveBeenCalledWith('/cards/c1/view');
    expect(r.viewCount).toBe(1);
  });
});

describe('archiveCard', () => {
  it('POSTs /cards/{id}/archive', async () => {
    mockPost.mockResolvedValue({
      data: {
        cardId: 'c1',
        status: 'ARCHIVE',
        enteredFieldAt: '2026-06-11T00:00:00Z',
        viewCount: 5,
        summary: 's',
        keywords: ['k'],
        tags: [],
      },
    });
    const r = await archiveCard('c1');
    expect(mockPost).toHaveBeenCalledWith('/cards/c1/archive');
    expect(r.status).toBe('ARCHIVE');
  });
});

describe('extendSession', () => {
  it('POSTs /review-session/extend with count', async () => {
    mockPost.mockResolvedValue({
      data: { addedCards: [], remainingAvailable: 0, completedAll: true },
    });
    const r = await extendSession({ count: 10 });
    expect(mockPost).toHaveBeenCalledWith('/review-session/extend', null, {
      params: { count: 10 },
    });
    expect(r.completedAll).toBe(true);
  });
});

describe('listArchiveCards', () => {
  it('GETs /cards with status=ARCHIVE', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await listArchiveCards();
    expect(mockGet).toHaveBeenCalledWith('/cards', { params: { status: 'ARCHIVE' } });
  });
  it('passes tagId when provided', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await listArchiveCards({ tagId: 't1' });
    expect(mockGet).toHaveBeenCalledWith('/cards', {
      params: { status: 'ARCHIVE', tagId: 't1' },
    });
  });
});

describe('returnToField', () => {
  it('POSTs /cards/{id}/return-to-field', async () => {
    mockPost.mockResolvedValue({
      data: {
        cardId: 'c1',
        status: 'ON_FIELD',
        enteredFieldAt: '2026-06-11T00:00:00Z',
        viewCount: 0,
        summary: 's',
        keywords: ['k'],
        tags: [],
      },
    });
    const r = await returnToField('c1');
    expect(mockPost).toHaveBeenCalledWith('/cards/c1/return-to-field');
    expect(r.viewCount).toBe(0);
  });
});

describe('createCard', () => {
  it('POSTs /cards with payload', async () => {
    mockPost.mockResolvedValue({
      data: {
        cardId: 'c-new',
        status: 'ON_FIELD',
        enteredFieldAt: '2026-06-11T00:00:00Z',
        viewCount: 0,
        summary: 'x',
        keywords: ['k'],
        tags: [],
      },
    });
    const r = await createCard({ summary: 'x', keywords: ['k'], tags: [] });
    expect(mockPost).toHaveBeenCalledWith('/cards', {
      summary: 'x',
      keywords: ['k'],
      tags: [],
    });
    expect(r.cardId).toBe('c-new');
  });
});
```

- [ ] **Step 2: Run `npm run test -- card.test` (the endpoints file) → fail.**

- [ ] **Step 3: Write `card.ts`**:

```ts
import { apiClient } from '@/lib/api/client';
import {
  CardSchema,
  ViewCardResponseSchema,
  CreateCardRequestSchema,
  type Card,
  type ViewCardResponse,
  type CreateCardRequest,
} from '@/lib/api/schemas/card';
import {
  ReviewSessionSchema,
  ExtendReviewResponseSchema,
  type ReviewSession,
  type ExtendReviewResponse,
} from '@/lib/api/schemas/review';
import { z } from 'zod';

export async function getTodayReview(params: { dailyTarget: number }): Promise<ReviewSession> {
  const { data } = await apiClient.get('/review-session/today', { params });
  return ReviewSessionSchema.parse(data);
}

export async function viewCard(cardId: string): Promise<ViewCardResponse> {
  const { data } = await apiClient.post(`/cards/${cardId}/view`);
  return ViewCardResponseSchema.parse(data);
}

export async function archiveCard(cardId: string): Promise<Card> {
  const { data } = await apiClient.post(`/cards/${cardId}/archive`);
  return CardSchema.parse(data);
}

export async function extendSession(params: { count: number }): Promise<ExtendReviewResponse> {
  const { data } = await apiClient.post('/review-session/extend', null, { params });
  return ExtendReviewResponseSchema.parse(data);
}

const ArchiveListSchema = z.array(CardSchema);

export async function listArchiveCards(filter: { tagId?: string } = {}): Promise<Card[]> {
  const params: Record<string, string> = { status: 'ARCHIVE' };
  if (filter.tagId) params.tagId = filter.tagId;
  const { data } = await apiClient.get('/cards', { params });
  return ArchiveListSchema.parse(data);
}

export async function returnToField(cardId: string): Promise<Card> {
  const { data } = await apiClient.post(`/cards/${cardId}/return-to-field`);
  return CardSchema.parse(data);
}

export async function createCard(payload: CreateCardRequest): Promise<Card> {
  const validated = CreateCardRequestSchema.parse(payload);
  const { data } = await apiClient.post('/cards', validated);
  return CardSchema.parse(data);
}
```

- [ ] **Step 4: Run `npm run test -- card.test` → pass (all wrapper tests).**

- [ ] **Step 5: Commit**

```bash
git rm src/lib/api/endpoints/.gitkeep
git add src/lib/api/endpoints/card.ts src/lib/api/endpoints/card.test.ts
git commit -m "feat(api): add typed Card endpoint wrappers"
```

---

## Task 3: Toast system (queue store + hook + view + provider)

**Files:**
- Create: `src/lib/toast/toastQueue.ts`, `src/lib/toast/toastQueue.test.ts`, `src/lib/toast/useToast.ts`, `src/components/Toast.tsx`, `src/components/ToastProvider.tsx`, `src/components/ToastProvider.test.tsx`

- [ ] **Step 1: Write `toastQueue.test.ts`**:

```ts
import { describe, it, expect, vi } from 'vitest';
import { createToastStore } from './toastQueue';

describe('createToastStore', () => {
  it('emits new toast to subscribers', () => {
    const store = createToastStore();
    const sub = vi.fn();
    store.subscribe(sub);
    store.push({ message: '안녕' });
    expect(sub).toHaveBeenCalled();
    expect(store.snapshot()).toHaveLength(1);
    expect(store.snapshot()[0]?.message).toBe('안녕');
  });

  it('dismiss removes the toast', () => {
    const store = createToastStore();
    const id = store.push({ message: 'x' });
    store.dismiss(id);
    expect(store.snapshot()).toHaveLength(0);
  });

  it('assigns unique ids', () => {
    const store = createToastStore();
    const a = store.push({ message: 'a' });
    const b = store.push({ message: 'b' });
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run `npm run test -- toastQueue` → fail.**

- [ ] **Step 3: Write `toastQueue.ts`**:

```ts
export type ToastTone = 'default' | 'amber' | 'cream';

export interface ToastInput {
  message: string;
  tone?: ToastTone;
  durationMs?: number;
}

export interface Toast extends Required<ToastInput> {
  id: string;
}

type Listener = (toasts: Toast[]) => void;

export interface ToastStore {
  push(input: ToastInput): string;
  dismiss(id: string): void;
  subscribe(fn: Listener): () => void;
  snapshot(): Toast[];
}

export function createToastStore(): ToastStore {
  let toasts: Toast[] = [];
  const listeners = new Set<Listener>();
  let counter = 0;

  const emit = () => listeners.forEach((l) => l(toasts));

  return {
    push(input) {
      const id = `t_${Date.now()}_${counter++}`;
      const next: Toast = {
        id,
        message: input.message,
        tone: input.tone ?? 'default',
        durationMs: input.durationMs ?? 2200,
      };
      toasts = [...toasts, next];
      emit();
      return id;
    },
    dismiss(id) {
      toasts = toasts.filter((t) => t.id !== id);
      emit();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    snapshot: () => toasts,
  };
}

export const toastStore = createToastStore();
```

- [ ] **Step 4: Run `npm run test -- toastQueue` → pass.**

- [ ] **Step 5: Write `useToast.ts`**:

```ts
import { useCallback } from 'react';
import { toastStore, type ToastInput } from './toastQueue';

export function useToast() {
  const push = useCallback((input: ToastInput) => toastStore.push(input), []);
  const dismiss = useCallback((id: string) => toastStore.dismiss(id), []);
  return { push, dismiss };
}
```

- [ ] **Step 6: Write `Toast.tsx`** (single visual unit):

```tsx
import type { Toast as ToastModel } from '@/lib/toast/toastQueue';

const toneClass: Record<ToastModel['tone'], string> = {
  default: 'bg-surface text-cream ring-edge',
  amber: 'bg-amber-soft text-amber ring-amber/30',
  cream: 'bg-glass text-cream ring-edge',
};

export function Toast({ toast }: { toast: ToastModel }) {
  return (
    <div
      role="status"
      className={`pointer-events-auto max-w-sm rounded-full px-5 py-3 text-sm ring-1 backdrop-blur-xl shadow-[var(--shadow-lift)] ${toneClass[toast.tone]}`}
    >
      {toast.message}
    </div>
  );
}
```

- [ ] **Step 7: Write `ToastProvider.test.tsx`**:

```tsx
import { describe, it, expect } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ToastProvider } from './ToastProvider';
import { toastStore } from '@/lib/toast/toastQueue';

describe('ToastProvider', () => {
  it('renders pushed toasts and removes after duration', async () => {
    vi.useFakeTimers();
    render(<ToastProvider />);
    act(() => {
      toastStore.push({ message: '순환 완료', durationMs: 1000 });
    });
    expect(screen.getByText('순환 완료')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.queryByText('순환 완료')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
```

(`vi` is from `vitest` — add `import { vi } from 'vitest'` at top.)

- [ ] **Step 8: Write `ToastProvider.tsx`**:

```tsx
import { useEffect, useState } from 'react';
import { toastStore, type Toast as ToastModel } from '@/lib/toast/toastQueue';
import { Toast } from './Toast';

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastModel[]>(toastStore.snapshot());

  useEffect(() => toastStore.subscribe(setToasts), []);

  useEffect(() => {
    const timers = toasts.map((t) =>
      window.setTimeout(() => toastStore.dismiss(t.id), t.durationMs),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [toasts]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}
```

- [ ] **Step 9: Run `npm run test -- ToastProvider` → pass.**

- [ ] **Step 10: Commit**

```bash
git add src/lib/toast src/components/Toast.tsx src/components/ToastProvider.tsx src/components/ToastProvider.test.tsx
git commit -m "feat(ui): add toast queue, useToast hook, and Toast/ToastProvider"
```

---

## Task 4: Dialog responsive primitive (Desktop dialog / Mobile bottom sheet)

**Files:**
- Create: `src/components/Dialog.tsx`, `src/components/Dialog.test.tsx`

- [ ] **Step 1: Write `Dialog.test.tsx`**:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('renders children when open', () => {
    render(
      <Dialog open onClose={() => {}} title="안내">
        <p>본문</p>
      </Dialog>,
    );
    expect(screen.getByText('안내')).toBeInTheDocument();
    expect(screen.getByText('본문')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Dialog open={false} onClose={() => {}} title="안내">
        <p>본문</p>
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="t">
        body
      </Dialog>,
    );
    await userEvent.click(screen.getByTestId('dialog-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape pressed', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="t">
        body
      </Dialog>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run `npm run test -- Dialog` → fail.**

- [ ] **Step 3: Write `Dialog.tsx`**:

```tsx
import { useEffect, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="dialog backdrop"
        data-testid="dialog-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-lg rounded-t-[var(--radius-card-outer)] bg-glass p-1.5 ring-1 ring-edge md:rounded-[var(--radius-card-outer)]"
      >
        <div className="rounded-t-[var(--radius-card-inner)] bg-surface p-6 shadow-[var(--shadow-card-inset)] md:rounded-[var(--radius-card-inner)]">
          <header className="mb-5">
            <h2 className="font-display text-2xl font-bold text-cream">{title}</h2>
          </header>
          <div className="text-cream-mute">{children}</div>
          {footer && <footer className="mt-6 flex justify-end gap-3">{footer}</footer>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run `npm run test -- Dialog` → pass (4 tests).**

- [ ] **Step 5: Commit**

```bash
git add src/components/Dialog.tsx src/components/Dialog.test.tsx
git commit -m "feat(ui): add responsive Dialog primitive (modal / bottom sheet)"
```

---

## Task 5: Skeleton + EmptyState + TagChip primitives

**Files:**
- Create: `src/components/Skeleton.tsx`, `src/components/EmptyState.tsx`, `src/components/TagChip.tsx`, `src/components/TagChip.test.tsx`

- [ ] **Step 1: Write `Skeleton.tsx`**:

```tsx
import type { HTMLAttributes } from 'react';

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const cls = [
    'animate-pulse rounded-[var(--radius-card-inner)] bg-glass',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return <div aria-hidden className={cls} {...rest} />;
}
```

- [ ] **Step 2: Write `EmptyState.tsx`**:

```tsx
import type { ReactNode } from 'react';

interface Props {
  title: string;
  body?: string;
  action?: ReactNode;
}

export function EmptyState({ title, body, action }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center break-keep">
      <h3 className="font-display text-2xl text-cream">{title}</h3>
      {body && <p className="text-cream-mute">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 3: Write `TagChip.test.tsx`**:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagChip } from './TagChip';

describe('TagChip', () => {
  it('renders label and applies selected styling', () => {
    render(<TagChip label="JPA" selected />);
    const el = screen.getByText('JPA');
    expect(el.className).toMatch(/bg-amber/);
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<TagChip label="DDD" onClick={onClick} />);
    await userEvent.click(screen.getByText('DDD'));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows remove button and fires onRemove', async () => {
    const onRemove = vi.fn();
    render(<TagChip label="X" onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run `npm run test -- TagChip` → fail.**

- [ ] **Step 5: Write `TagChip.tsx`**:

```tsx
interface Props {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export function TagChip({ label, selected, onClick, onRemove }: Props) {
  const baseChip = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors';
  const tone = selected
    ? 'bg-amber text-canvas'
    : 'bg-glass text-cream-mute hover:bg-[rgba(255,248,235,0.08)]';
  return (
    <span className={`${baseChip} ${tone}`}>
      {onClick ? (
        <button type="button" onClick={onClick} className="font-medium">
          {label}
        </button>
      ) : (
        <span className="font-medium">{label}</span>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={`remove ${label}`}
          onClick={onRemove}
          className="rounded-full px-1 text-cream-faint hover:text-cream"
        >
          ×
        </button>
      )}
    </span>
  );
}
```

- [ ] **Step 6: Run `npm run test -- TagChip` → pass.**

- [ ] **Step 7: Commit**

```bash
git add src/components/Skeleton.tsx src/components/EmptyState.tsx src/components/TagChip.tsx src/components/TagChip.test.tsx
git commit -m "feat(ui): add Skeleton, EmptyState, TagChip primitives"
```

---

## Task 6: MSW card handlers + node setupServer for tests

**Files:**
- Create: `src/mocks/handlers/card.handlers.ts`, `src/mocks/node.ts`
- Modify: `src/mocks/handlers/index.ts`, `test/setup.ts`

- [ ] **Step 1: Write `src/mocks/handlers/card.handlers.ts`** (in-memory store + 7 handlers):

```ts
import { http, HttpResponse } from 'msw';
import type { Card } from '@/lib/api/schemas/card';

interface MockState {
  cards: Map<string, Card>;
  nextId: number;
}

function seed(): MockState {
  const now = '2026-06-10T08:00:00Z';
  const data: Card[] = [
    {
      cardId: 'c1', status: 'ON_FIELD', enteredFieldAt: now, viewCount: 0,
      summary: 'JPA의 영속성 컨텍스트는 1차 캐시 역할을 한다.',
      keywords: ['JPA', '영속성'], tags: [{ tagId: 't_jpa', name: 'JPA' }],
    },
    {
      cardId: 'c2', status: 'ON_FIELD', enteredFieldAt: now, viewCount: 1,
      summary: 'B+ tree의 리프 노드만이 실제 데이터를 가진다.',
      keywords: ['Index', 'BTree'], tags: [{ tagId: 't_db', name: 'DB' }],
    },
    {
      cardId: 'c3', status: 'ON_FIELD', enteredFieldAt: now, viewCount: 2,
      summary: 'Kafka의 컨슈머 그룹은 파티션 단위로 오프셋을 관리한다.',
      keywords: ['Kafka'], tags: [{ tagId: 't_kafka', name: 'Kafka' }],
    },
    {
      cardId: 'c4', status: 'ON_FIELD', enteredFieldAt: now, viewCount: 4,
      summary: 'DDD의 Aggregate는 일관성 경계의 단위이다.',
      keywords: ['DDD', 'Aggregate'], tags: [{ tagId: 't_ddd', name: 'DDD' }],
    },
    {
      cardId: 'a1', status: 'ARCHIVE', enteredFieldAt: '2026-05-20T08:00:00Z', viewCount: 5,
      summary: 'HTTP/2의 헤더 압축(HPACK)은 정적 + 동적 테이블 기반이다.',
      keywords: ['HTTP/2'], tags: [{ tagId: 't_net', name: 'Network' }],
    },
    {
      cardId: 'a2', status: 'ARCHIVE', enteredFieldAt: '2026-05-22T08:00:00Z', viewCount: 5,
      summary: 'TCP slow start는 초기 cwnd를 두 RTT마다 두 배로 증가시킨다.',
      keywords: ['TCP'], tags: [{ tagId: 't_net', name: 'Network' }],
    },
    {
      cardId: 'a3', status: 'ARCHIVE', enteredFieldAt: '2026-05-25T08:00:00Z', viewCount: 5,
      summary: 'Effective Java 항목 17: 불변 객체는 자유롭게 공유될 수 있다.',
      keywords: ['Java', 'Effective Java'], tags: [{ tagId: 't_java', name: 'Java' }],
    },
    {
      cardId: 'a4', status: 'ARCHIVE', enteredFieldAt: '2026-05-28T08:00:00Z', viewCount: 5,
      summary: '동시성 제어에서 OCC는 충돌이 드문 경우 좋은 성능을 보인다.',
      keywords: ['OCC', '동시성'], tags: [{ tagId: 't_db', name: 'DB' }],
    },
    {
      cardId: 'a5', status: 'ARCHIVE', enteredFieldAt: '2026-06-01T08:00:00Z', viewCount: 5,
      summary: 'TLS 1.3은 0-RTT 재개를 지원한다.',
      keywords: ['TLS'], tags: [{ tagId: 't_net', name: 'Network' }],
    },
  ];
  const map = new Map<string, Card>();
  data.forEach((c) => map.set(c.cardId, c));
  return { cards: map, nextId: 100 };
}

const state: MockState = seed();

export function resetCardMockState(): void {
  const fresh = seed();
  state.cards = fresh.cards;
  state.nextId = fresh.nextId;
}

const dayLabels = ['DAY_1', 'DAY_3', 'DAY_7'] as const;

function labelForViewCount(viewCount: number): typeof dayLabels[number] {
  if (viewCount <= 0) return 'DAY_1';
  if (viewCount <= 2) return 'DAY_3';
  return 'DAY_7';
}

export const cardHandlers = [
  http.get('/api/review-session/today', ({ request }) => {
    const url = new URL(request.url);
    const dailyTarget = Number(url.searchParams.get('dailyTarget') ?? '30');
    const onField = [...state.cards.values()].filter((c) => c.status === 'ON_FIELD');
    const ordered = [...onField].sort((a, b) => a.viewCount - b.viewCount).slice(0, dailyTarget);
    const cards = ordered.map((c) => ({
      cardId: c.cardId,
      state: labelForViewCount(c.viewCount),
      summary: c.summary,
    }));
    const breakdown = { DAY_1: 0, DAY_3: 0, DAY_7: 0 };
    cards.forEach((c) => breakdown[c.state]++);
    return HttpResponse.json({
      stateBreakdown: breakdown,
      recommended: cards.length,
      cards,
    });
  }),

  http.post('/api/cards/:id/view', ({ params }) => {
    const id = params.id as string;
    const c = state.cards.get(id);
    if (!c) return HttpResponse.json({ code: 'CARD_NOT_FOUND', message: 'gone' }, { status: 404 });
    const newCount = c.viewCount + 1;
    const maxView = 5;
    let autoArchived = false;
    let archiveReason: 'MAX_VIEW' | 'MAX_DURATION' | null = null;
    if (newCount >= maxView) {
      autoArchived = true;
      archiveReason = 'MAX_VIEW';
      state.cards.set(id, { ...c, viewCount: newCount, status: 'ARCHIVE' });
    } else {
      state.cards.set(id, { ...c, viewCount: newCount });
    }
    return HttpResponse.json({
      autoArchived,
      archiveReason,
      lastViewedAt: new Date().toISOString(),
      viewCount: newCount,
    });
  }),

  http.post('/api/cards/:id/archive', ({ params }) => {
    const id = params.id as string;
    const c = state.cards.get(id);
    if (!c) return HttpResponse.json({ code: 'CARD_NOT_FOUND', message: 'gone' }, { status: 404 });
    const updated: Card = { ...c, status: 'ARCHIVE' };
    state.cards.set(id, updated);
    return HttpResponse.json(updated);
  }),

  http.post('/api/cards/:id/return-to-field', ({ params }) => {
    const id = params.id as string;
    const c = state.cards.get(id);
    if (!c) return HttpResponse.json({ code: 'CARD_NOT_FOUND', message: 'gone' }, { status: 404 });
    const updated: Card = {
      ...c,
      status: 'ON_FIELD',
      viewCount: 0,
      enteredFieldAt: new Date().toISOString(),
    };
    state.cards.set(id, updated);
    return HttpResponse.json(updated);
  }),

  http.post('/api/review-session/extend', ({ request }) => {
    const url = new URL(request.url);
    const count = Number(url.searchParams.get('count') ?? '10');
    // For mock simplicity: claim no additional cards available.
    return HttpResponse.json({
      addedCards: [],
      remainingAvailable: 0,
      completedAll: true,
      _meta: { requested: count },
    });
  }),

  http.get('/api/cards', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? 'ON_FIELD';
    const tagId = url.searchParams.get('tagId');
    let cards = [...state.cards.values()].filter((c) => c.status === status);
    if (tagId) cards = cards.filter((c) => c.tags.some((t) => t.tagId === tagId));
    return HttpResponse.json(cards);
  }),

  http.post('/api/cards', async ({ request }) => {
    const body = (await request.json()) as { summary?: string; keywords?: string[]; tags?: string[] };
    if (!body.summary) return HttpResponse.json({ code: 'CARD_SUMMARY_REQUIRED', message: 'need summary' }, { status: 400 });
    if (!body.keywords || body.keywords.length === 0) {
      return HttpResponse.json({ code: 'CARD_KEYWORD_MIN_REQUIRED', message: 'need 1+ keywords' }, { status: 400 });
    }
    const id = `c-${state.nextId++}`;
    const card: Card = {
      cardId: id,
      status: 'ON_FIELD',
      enteredFieldAt: new Date().toISOString(),
      viewCount: 0,
      summary: body.summary,
      keywords: body.keywords,
      tags: (body.tags ?? []).map((name) => ({ tagId: `t_${name}`, name })),
    };
    state.cards.set(id, card);
    return HttpResponse.json(card);
  }),
];
```

- [ ] **Step 2: Update `src/mocks/handlers/index.ts`**:

```ts
import { facadeHandlers } from './facade.handlers';
import { cardHandlers } from './card.handlers';

export const handlers = [...facadeHandlers, ...cardHandlers];
```

- [ ] **Step 3: Write `src/mocks/node.ts`**:

```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

- [ ] **Step 4: Modify `test/setup.ts`** — add server lifecycle. Existing file imports stay; append:

Find the section that imports `afterEach` and `vi` from `vitest`. Add `beforeAll`, `afterAll` to the same import. Then append:

```ts
import { beforeAll, afterAll } from 'vitest';
import { server } from '@/mocks/node';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

(Reuse existing `afterEach`. Place the `server.resetHandlers` call inside the existing `afterEach` block if it exists, OR add a separate `afterEach` — both work.)

Final `test/setup.ts` should be:

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from '@/mocks/node';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  constructor(_cb: IntersectionObserverCallback, _opts?: IntersectionObserverInit) {}
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
```

- [ ] **Step 5: Run `npm run test` (full)** — all previously passing tests should still pass. Expected: ~35 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/mocks/handlers/card.handlers.ts src/mocks/handlers/index.ts src/mocks/node.ts test/setup.ts
git commit -m "feat(mocks): add card mock handlers and MSW node server for tests"
```

---

## Task 7: useTodayReview + useExtendSession hooks

**Files:**
- Create: `src/features/cards/hooks/useTodayReview.ts`, `useTodayReview.test.tsx`, `useExtendSession.ts`

- [ ] **Step 1: Write `useTodayReview.test.tsx`**:

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTodayReview } from './useTodayReview';
import type { ReactNode } from 'react';

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useTodayReview', () => {
  it('returns mock session cards from MSW handler', async () => {
    const { result } = renderHook(() => useTodayReview(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.cards.length).toBeGreaterThan(0);
    expect(result.current.data?.cards[0]?.cardId).toBeDefined();
  });
});
```

- [ ] **Step 2: Run `npm run test -- useTodayReview` → fail.**

- [ ] **Step 3: Write `useTodayReview.ts`**:

```ts
import { useQuery } from '@tanstack/react-query';
import { getTodayReview } from '@/lib/api/endpoints/card';

export const TODAY_REVIEW_KEY = (dailyTarget: number) => ['review-session', 'today', { dailyTarget }] as const;

export function useTodayReview(dailyTarget = 30) {
  return useQuery({
    queryKey: TODAY_REVIEW_KEY(dailyTarget),
    queryFn: () => getTodayReview({ dailyTarget }),
  });
}
```

- [ ] **Step 4: Write `useExtendSession.ts`**:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { extendSession } from '@/lib/api/endpoints/card';
import { TODAY_REVIEW_KEY } from './useTodayReview';

export function useExtendSession(dailyTarget = 30) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (count: number) => extendSession({ count }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TODAY_REVIEW_KEY(dailyTarget) });
    },
  });
}
```

- [ ] **Step 5: Run `npm run test -- useTodayReview` → pass.**

- [ ] **Step 6: Commit**

```bash
git add src/features/cards/hooks/useTodayReview.ts src/features/cards/hooks/useTodayReview.test.tsx src/features/cards/hooks/useExtendSession.ts
git commit -m "feat(cards): add useTodayReview and useExtendSession hooks"
```

---

## Task 8: useViewCard with auto-archive toast

**Files:**
- Create: `src/features/cards/hooks/useViewCard.ts`, `useViewCard.test.tsx`

- [ ] **Step 1: Write `useViewCard.test.tsx`**:

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useViewCard } from './useViewCard';
import { toastStore } from '@/lib/toast/toastQueue';
import type { ReactNode } from 'react';

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useViewCard', () => {
  it('pushes "배경 지식" toast on auto-archive MAX_VIEW', async () => {
    const sub = vi.fn();
    toastStore.subscribe(sub);
    const { result } = renderHook(() => useViewCard(), { wrapper: makeWrapper() });
    // c4 has viewCount=4, next view triggers MAX_VIEW
    await result.current.mutateAsync('c4');
    await waitFor(() => {
      const messages = toastStore.snapshot().map((t) => t.message);
      expect(messages.some((m) => m.includes('배경 지식'))).toBe(true);
    });
  });
});
```

(Add `import { vi } from 'vitest'` at top.)

- [ ] **Step 2: Run `npm run test -- useViewCard` → fail.**

- [ ] **Step 3: Write `useViewCard.ts`**:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { viewCard } from '@/lib/api/endpoints/card';
import { toastStore } from '@/lib/toast/toastQueue';
import { TODAY_REVIEW_KEY } from './useTodayReview';

const messageFor = (reason: 'MAX_VIEW' | 'MAX_DURATION'): string =>
  reason === 'MAX_VIEW'
    ? '이 카드는 충분히 노출되었습니다. 배경 지식으로 이동합니다.'
    : '이 카드는 순환을 완료했습니다. 잠시 후 다시 만나요 👋';

export function useViewCard(dailyTarget = 30) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => viewCard(cardId),
    onSuccess: (response) => {
      if (response.autoArchived && response.archiveReason) {
        toastStore.push({ message: messageFor(response.archiveReason), tone: 'cream' });
        qc.invalidateQueries({ queryKey: TODAY_REVIEW_KEY(dailyTarget) });
        qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
      }
    },
  });
}
```

- [ ] **Step 4: Run `npm run test -- useViewCard` → pass.**

- [ ] **Step 5: Commit**

```bash
git add src/features/cards/hooks/useViewCard.ts src/features/cards/hooks/useViewCard.test.tsx
git commit -m "feat(cards): add useViewCard with auto-archive toast"
```

---

## Task 9: useArchive + useReturnToField hooks

**Files:**
- Create: `src/features/cards/hooks/useArchive.ts`, `useArchive.test.tsx`, `src/features/cards/hooks/useReturnToField.ts`

- [ ] **Step 1: Write `useArchive.test.tsx`**:

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useArchive } from './useArchive';
import type { ReactNode } from 'react';

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useArchive', () => {
  it('lists archived cards from MSW', async () => {
    const { result } = renderHook(() => useArchive(), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
  });

  it('passes tagId to API', async () => {
    const { result } = renderHook(() => useArchive('t_net'), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.every((c) => c.tags.some((t) => t.tagId === 't_net'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run `npm run test -- useArchive` → fail.**

- [ ] **Step 3: Write `useArchive.ts`**:

```ts
import { useQuery } from '@tanstack/react-query';
import { listArchiveCards } from '@/lib/api/endpoints/card';

export const ARCHIVE_KEY = (tagId: string | null) => ['cards', 'archive', { tagId }] as const;

export function useArchive(tagId: string | null = null) {
  return useQuery({
    queryKey: ARCHIVE_KEY(tagId),
    queryFn: () => listArchiveCards(tagId ? { tagId } : {}),
  });
}
```

- [ ] **Step 4: Write `useReturnToField.ts`**:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { returnToField } from '@/lib/api/endpoints/card';
import { toastStore } from '@/lib/toast/toastQueue';

export function useReturnToField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => returnToField(cardId),
    onSuccess: () => {
      toastStore.push({ message: '오늘부터 다시 만나요.', tone: 'amber' });
      qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
      qc.invalidateQueries({ queryKey: ['review-session', 'today'] });
    },
  });
}
```

- [ ] **Step 5: Run `npm run test -- useArchive` → pass.**

- [ ] **Step 6: Commit**

```bash
git add src/features/cards/hooks/useArchive.ts src/features/cards/hooks/useArchive.test.tsx src/features/cards/hooks/useReturnToField.ts
git commit -m "feat(cards): add useArchive query and useReturnToField mutation"
```

---

## Task 10: useArchiveCard + useCreateCard mutations

**Files:**
- Create: `src/features/cards/hooks/useArchiveCard.ts`, `src/features/cards/hooks/useCreateCard.ts`

- [ ] **Step 1: Write `useArchiveCard.ts`**:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveCard } from '@/lib/api/endpoints/card';
import { toastStore } from '@/lib/toast/toastQueue';

export function useArchiveCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => archiveCard(cardId),
    onSuccess: () => {
      toastStore.push({ message: '배경 지식으로 옮겼어요.', tone: 'cream' });
      qc.invalidateQueries({ queryKey: ['review-session', 'today'] });
      qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
    },
  });
}
```

- [ ] **Step 2: Write `useCreateCard.ts`**:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCard } from '@/lib/api/endpoints/card';
import { toastStore } from '@/lib/toast/toastQueue';
import type { CreateCardRequest } from '@/lib/api/schemas/card';

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCardRequest) => createCard(payload),
    onSuccess: () => {
      toastStore.push({ message: '새 카드를 펼쳤어요.', tone: 'amber' });
      qc.invalidateQueries({ queryKey: ['review-session', 'today'] });
      qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
    },
  });
}
```

- [ ] **Step 3: Typecheck** — `npm run typecheck` → exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/features/cards/hooks/useArchiveCard.ts src/features/cards/hooks/useCreateCard.ts
git commit -m "feat(cards): add useArchiveCard and useCreateCard mutations"
```

---

## Task 11: ProgressIndicator + OnFieldCardFace components

**Files:**
- Create: `src/features/cards/components/ProgressIndicator.tsx`, `src/features/cards/components/OnFieldCardFace.tsx`

- [ ] **Step 1: Write `ProgressIndicator.tsx`**:

```tsx
interface Props {
  current: number; // 1-based
  total: number;
  stateLabel: 'DAY_1' | 'DAY_3' | 'DAY_7';
}

const labelKo: Record<Props['stateLabel'], string> = {
  DAY_1: '오늘 처음 만나는 카드',
  DAY_3: '3일 만의 재회',
  DAY_7: '7일 만의 재회',
};

export function ProgressIndicator({ current, total, stateLabel }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm text-cream-mute">
      <span className="font-display tracking-wide">
        <span className="text-cream">{current}</span> / {total}
      </span>
      <span className="rounded-full bg-amber-soft px-3 py-1 text-xs uppercase tracking-[var(--tracking-eyebrow)] text-amber">
        {stateLabel} · {labelKo[stateLabel]}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Write `OnFieldCardFace.tsx`**:

```tsx
import { Card } from '@/components/Card';
import { TagChip } from '@/components/TagChip';

interface Tag { tagId: string; name: string }

interface Props {
  summary: string;
  keywords: string[];
  tags?: Tag[];
  viewCount: number;
  maxView: number;
}

export function OnFieldCardFace({ summary, keywords, tags = [], viewCount, maxView }: Props) {
  const lastExposure = viewCount === maxView - 1;
  return (
    <Card>
      {lastExposure && (
        <div className="mb-4 rounded-full bg-amber-soft px-3 py-1 text-xs text-amber">
          이번이 마지막 노출입니다.
        </div>
      )}
      <p className="font-display text-3xl leading-snug text-cream break-keep md:text-4xl">
        {summary}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {keywords.map((k) => (
          <span key={k} className="rounded-full bg-glass px-3 py-1 text-xs text-cream-mute">
            {k}
          </span>
        ))}
      </div>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((t) => (
            <TagChip key={t.tagId} label={t.name} />
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-cream-faint">
        노출 {viewCount + 1} / {maxView}
      </p>
    </Card>
  );
}
```

- [ ] **Step 3: Typecheck** — `npm run typecheck` → exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/features/cards/components/ProgressIndicator.tsx src/features/cards/components/OnFieldCardFace.tsx
git commit -m "feat(cards): add ProgressIndicator and OnFieldCardFace components"
```

---

## Task 12: KeywordInput + TagInput components

**Files:**
- Create: `src/features/cards/components/KeywordInput.tsx`, `src/features/cards/components/KeywordInput.test.tsx`, `src/features/cards/components/TagInput.tsx`

- [ ] **Step 1: Write `KeywordInput.test.tsx`**:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeywordInput } from './KeywordInput';

describe('KeywordInput', () => {
  it('adds a keyword on Enter and clears input', async () => {
    const onChange = vi.fn();
    render(<KeywordInput value={[]} onChange={onChange} label="키워드" />);
    const input = screen.getByLabelText('키워드');
    await userEvent.type(input, 'JPA{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['JPA']);
  });

  it('removes a keyword via chip remove button', async () => {
    const onChange = vi.fn();
    render(<KeywordInput value={['DDD']} onChange={onChange} label="키워드" />);
    await userEvent.click(screen.getByRole('button', { name: /remove DDD/i }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('ignores duplicate input', async () => {
    const onChange = vi.fn();
    render(<KeywordInput value={['JPA']} onChange={onChange} label="키워드" />);
    const input = screen.getByLabelText('키워드');
    await userEvent.type(input, 'JPA{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run `npm run test -- KeywordInput` → fail.**

- [ ] **Step 3: Write `KeywordInput.tsx`**:

```tsx
import { useId, useState, type KeyboardEvent } from 'react';
import { TagChip } from '@/components/TagChip';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  label: string;
  placeholder?: string;
}

export function KeywordInput({ value, onChange, label, placeholder }: Props) {
  const [draft, setDraft] = useState('');
  const id = useId();

  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    if (value.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...value, v]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-cream-mute">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-glass px-3 py-2 ring-1 ring-edge focus-within:ring-amber">
        {value.map((v) => (
          <TagChip key={v} label={v} onRemove={() => onChange(value.filter((x) => x !== v))} />
        ))}
        <input
          id={id}
          aria-label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? '입력 후 Enter'}
          className="flex-1 min-w-[6rem] bg-transparent text-sm text-cream outline-none placeholder:text-cream-faint"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write `TagInput.tsx`** (same shape, separate file so they can diverge later):

```tsx
import { KeywordInput } from './KeywordInput';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
}

export function TagInput({ value, onChange, label = '태그' }: Props) {
  return <KeywordInput value={value} onChange={onChange} label={label} placeholder="옵션 · Enter로 추가" />;
}
```

- [ ] **Step 5: Run `npm run test -- KeywordInput` → pass.**

- [ ] **Step 6: Commit**

```bash
git add src/features/cards/components/KeywordInput.tsx src/features/cards/components/KeywordInput.test.tsx src/features/cards/components/TagInput.tsx
git commit -m "feat(cards): add KeywordInput and TagInput components"
```

---

## Task 13: TagFilterRow

**Files:**
- Create: `src/features/cards/components/TagFilterRow.tsx`

- [ ] **Step 1: Write `TagFilterRow.tsx`**:

```tsx
import { TagChip } from '@/components/TagChip';
import type { Card } from '@/lib/api/schemas/card';

interface Props {
  cards: Card[];
  selected: string | null;
  onSelect: (tagId: string | null) => void;
}

export function TagFilterRow({ cards, selected, onSelect }: Props) {
  const counts = new Map<string, { name: string; count: number }>();
  cards.forEach((c) =>
    c.tags.forEach((t) => {
      const prev = counts.get(t.tagId);
      counts.set(t.tagId, { name: t.name, count: (prev?.count ?? 0) + 1 });
    }),
  );
  const ordered = [...counts.entries()].sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="flex flex-wrap gap-2">
      <TagChip label="전체" selected={selected === null} onClick={() => onSelect(null)} />
      {ordered.map(([tagId, { name }]) => (
        <TagChip
          key={tagId}
          label={name}
          selected={selected === tagId}
          onClick={() => onSelect(tagId)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck** — `npm run typecheck` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/cards/components/TagFilterRow.tsx
git commit -m "feat(cards): add TagFilterRow"
```

---

## Task 14: TodayQueueView section

**Files:**
- Create: `src/features/cards/sections/TodayQueueView.tsx`
- Delete: `src/features/cards/sections/.gitkeep` (if exists; create the directory if missing)

- [ ] **Step 1: Write `TodayQueueView.tsx`**:

```tsx
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { useViewCard } from '../hooks/useViewCard';
import { useArchiveCard } from '../hooks/useArchiveCard';
import { OnFieldCardFace } from '../components/OnFieldCardFace';
import { ProgressIndicator } from '../components/ProgressIndicator';
import type { ReviewSession } from '@/lib/api/schemas/review';

const MAX_VIEW = 5;

interface Props {
  session: ReviewSession;
  onAllDone: () => void;
}

export function TodayQueueView({ session, onAllDone }: Props) {
  const [index, setIndex] = useState(0);
  const view = useViewCard();
  const archive = useArchiveCard();

  const card = session.cards[index];

  useEffect(() => {
    if (card) view.mutate(card.cardId);
    // mutate only when cardId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.cardId]);

  const goNext = () => {
    if (index + 1 >= session.cards.length) {
      onAllDone();
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (!card) {
    onAllDone();
    return null;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
      <ProgressIndicator
        current={index + 1}
        total={session.cards.length}
        stateLabel={card.state}
      />
      <OnFieldCardFace
        summary={card.summary}
        keywords={[]}
        viewCount={view.data?.viewCount ?? 0}
        maxView={MAX_VIEW}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => archive.mutate(card.cardId, { onSuccess: goNext })}
          disabled={archive.isPending}
        >
          잠시 쉬러 보내기
        </Button>
        <Button onClick={goNext} rightIcon={<Icon name="solar:arrow-right-linear" />}>
          다음 카드
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck** — `npm run typecheck` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/cards/sections/TodayQueueView.tsx
git commit -m "feat(cards): add TodayQueueView with auto view tracking"
```

---

## Task 15: TodayEmptyView (rest screen + extend)

**Files:**
- Create: `src/features/cards/sections/TodayEmptyView.tsx`

- [ ] **Step 1: Write `TodayEmptyView.tsx`**:

```tsx
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { EmptyState } from '@/components/EmptyState';
import { useExtendSession } from '../hooks/useExtendSession';

interface Props {
  onExtended: () => void;
}

export function TodayEmptyView({ onExtended }: Props) {
  const extend = useExtendSession();

  const requestMore = () => {
    extend.mutate(10, {
      onSuccess: (res) => {
        if (!res.completedAll) onExtended();
      },
    });
  };

  return (
    <EmptyState
      title="오늘 학습 가능한 카드를 모두 완료했습니다 👋"
      body="잠시 쉬어도 좋아요. 더 만나고 싶으면 한 번 더 펴볼게요."
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={requestMore}
            disabled={extend.isPending}
            rightIcon={<Icon name="solar:add-circle-linear" />}
          >
            10장 더 펴기
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()}>
            오늘은 여기까지
          </Button>
        </div>
      }
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/cards/sections/TodayEmptyView.tsx
git commit -m "feat(cards): add TodayEmptyView with extend session action"
```

---

## Task 16: ArchiveCard (single archive card with inline expand)

**Files:**
- Create: `src/features/cards/sections/ArchiveCard.tsx`

- [ ] **Step 1: Write `ArchiveCard.tsx`**:

```tsx
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { TagChip } from '@/components/TagChip';
import { useReturnToField } from '../hooks/useReturnToField';
import type { Card as CardModel } from '@/lib/api/schemas/card';

interface Props {
  card: CardModel;
  expanded: boolean;
  onToggle: () => void;
}

export function ArchiveCard({ card, expanded, onToggle }: Props) {
  const ret = useReturnToField();

  return (
    <Card interactive>
      <button type="button" onClick={onToggle} className="w-full text-left">
        <p className="text-base leading-relaxed text-cream break-keep">{card.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {card.tags.map((t) => (
            <TagChip key={t.tagId} label={t.name} />
          ))}
        </div>
      </button>
      {expanded && (
        <div className="mt-5 border-t border-edge pt-5">
          <div className="flex flex-wrap gap-2">
            {card.keywords.map((k) => (
              <span key={k} className="rounded-full bg-glass px-3 py-1 text-xs text-cream-mute">
                {k}
              </span>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              size="md"
              onClick={() => ret.mutate(card.cardId)}
              disabled={ret.isPending}
              rightIcon={<Icon name="solar:undo-left-linear" />}
            >
              다시 만나러 보내기
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: Typecheck** — `npm run typecheck` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/cards/sections/ArchiveCard.tsx
git commit -m "feat(cards): add ArchiveCard with inline expand and return action"
```

---

## Task 17: ArchiveMasonry (filter + grid + ArchiveCard)

**Files:**
- Create: `src/features/cards/sections/ArchiveMasonry.tsx`

- [ ] **Step 1: Write `ArchiveMasonry.tsx`**:

```tsx
import { useState } from 'react';
import { useArchive } from '../hooks/useArchive';
import { TagFilterRow } from '../components/TagFilterRow';
import { ArchiveCard } from './ArchiveCard';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';

export function ArchiveMasonry() {
  const [tagId, setTagId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useArchive(tagId);

  // For tag chips we need the full set (without filter) to derive counts.
  const allCards = useArchive(null);
  const filterCards = allCards.data ?? [];

  if (isLoading || allCards.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="지금 길이 막혀있어요"
        body="잠시 후 다시 시도해주세요."
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full bg-amber px-5 py-2 text-canvas"
          >
            다시 시도
          </button>
        }
      />
    );
  }

  const cards = data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <TagFilterRow cards={filterCards} selected={tagId} onSelect={setTagId} />
      {cards.length === 0 ? (
        <EmptyState
          title="아직 배경 지식이 모이지 않았어요"
          body="오늘의 카드를 충분히 만나면 여기에 쌓여요."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.cardId} className={expanded === c.cardId ? 'sm:col-span-2 lg:col-span-2' : ''}>
              <ArchiveCard
                card={c}
                expanded={expanded === c.cardId}
                onToggle={() => setExpanded((cur) => (cur === c.cardId ? null : c.cardId))}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck** — `npm run typecheck` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/cards/sections/ArchiveMasonry.tsx
git commit -m "feat(cards): add ArchiveMasonry grid with tag filter"
```

---

## Task 18: CreateCardDialog

**Files:**
- Create: `src/features/cards/components/CreateCardDialog.tsx`, `CreateCardDialog.test.tsx`

- [ ] **Step 1: Write `CreateCardDialog.test.tsx`**:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateCardDialog } from './CreateCardDialog';
import type { ReactNode } from 'react';

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('CreateCardDialog', () => {
  it('disables submit when summary or keywords empty', async () => {
    render(<CreateCardDialog open onClose={() => {}} />, { wrapper: wrap() });
    const submit = screen.getByRole('button', { name: '카드 펴기' });
    expect(submit).toBeDisabled();
  });

  it('submits and closes on success', async () => {
    const onClose = vi.fn();
    render(<CreateCardDialog open onClose={onClose} />, { wrapper: wrap() });
    await userEvent.type(screen.getByLabelText('summary'), 'JPA persistence');
    const kwInput = screen.getByLabelText('키워드');
    await userEvent.type(kwInput, 'JPA{Enter}');
    await userEvent.click(screen.getByRole('button', { name: '카드 펴기' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Run `npm run test -- CreateCardDialog` → fail.**

- [ ] **Step 3: Write `CreateCardDialog.tsx`**:

```tsx
import { useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { Button } from '@/components/Button';
import { KeywordInput } from './KeywordInput';
import { TagInput } from './TagInput';
import { useCreateCard } from '../hooks/useCreateCard';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

const FIELD_ERROR: Record<string, string> = {
  CARD_SUMMARY_REQUIRED: '한 줄 요약을 채워주세요.',
  CARD_KEYWORD_MIN_REQUIRED: '키워드 1개 이상이 필요해요.',
};

export function CreateCardDialog({ open, onClose }: Props) {
  const [summary, setSummary] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const create = useCreateCard();

  const canSubmit = summary.trim().length > 0 && keywords.length > 0;

  const reset = () => {
    setSummary('');
    setKeywords([]);
    setTags([]);
    setBannerError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setBannerError(null);
    create.mutate(
      { summary: summary.trim(), keywords, tags },
      {
        onSuccess: handleClose,
        onError: (err) => {
          if (err instanceof ApiError && FIELD_ERROR[err.code]) {
            setBannerError(FIELD_ERROR[err.code]!);
          } else {
            setBannerError('지금 카드를 펼치기 어려워요. 잠시 후 다시 시도해주세요.');
          }
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="새 카드 펴기"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={create.isPending}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || create.isPending}>
            카드 펴기
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {bannerError && (
          <div className="rounded-2xl bg-amber-soft px-4 py-2 text-sm text-amber">
            {bannerError}
          </div>
        )}
        <label className="flex flex-col gap-2 text-sm text-cream-mute">
          <span>한 줄 요약</span>
          <textarea
            aria-label="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="이 카드에 무엇을 담을까요?"
            className="resize-none rounded-2xl bg-glass px-4 py-3 text-cream outline-none ring-1 ring-edge focus:ring-amber"
          />
          <span className="text-right text-xs text-cream-faint">{summary.length} / 500</span>
        </label>
        <KeywordInput value={keywords} onChange={setKeywords} label="키워드" />
        <TagInput value={tags} onChange={setTags} />
      </div>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run `npm run test -- CreateCardDialog` → pass.**

- [ ] **Step 5: Commit**

```bash
git add src/features/cards/components/CreateCardDialog.tsx src/features/cards/components/CreateCardDialog.test.tsx
git commit -m "feat(cards): add CreateCardDialog with field validation"
```

---

## Task 19: StudyPage

**Files:**
- Create: `src/features/cards/StudyPage.tsx`

- [ ] **Step 1: Write `StudyPage.tsx`**:

```tsx
import { useState } from 'react';
import { useTodayReview } from './hooks/useTodayReview';
import { TodayQueueView } from './sections/TodayQueueView';
import { TodayEmptyView } from './sections/TodayEmptyView';
import { CreateCardDialog } from './components/CreateCardDialog';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';

export function StudyPage() {
  const { data, isLoading, isError, refetch } = useTodayReview();
  const [createOpen, setCreateOpen] = useState(false);
  const [allDone, setAllDone] = useState(false);

  return (
    <main className="min-h-[100dvh] pt-20 pb-24">
      <div className="mx-auto flex max-w-3xl items-center justify-end px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="md"
          rightIcon={<Icon name="solar:add-circle-linear" />}
          onClick={() => setCreateOpen(true)}
        >
          새 카드
        </Button>
      </div>

      <section className="mt-8">
        {isLoading && (
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-72" />
          </div>
        )}

        {isError && (
          <EmptyState
            title="지금 카드를 가져오는 길이 막혀있어요"
            body="잠시 후 다시 시도해주세요."
            action={
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-full bg-amber px-5 py-2 text-canvas"
              >
                다시 시도
              </button>
            }
          />
        )}

        {data && data.cards.length === 0 && (
          <EmptyState
            title="아직 만날 카드가 없어요"
            body="첫 카드를 펼쳐볼까요?"
            action={
              <Button onClick={() => setCreateOpen(true)} rightIcon={<Icon name="solar:add-circle-linear" />}>
                새 카드 펴기
              </Button>
            }
          />
        )}

        {data && data.cards.length > 0 && !allDone && (
          <TodayQueueView session={data} onAllDone={() => setAllDone(true)} />
        )}

        {data && data.cards.length > 0 && allDone && (
          <TodayEmptyView onExtended={() => setAllDone(false)} />
        )}
      </section>

      <CreateCardDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </main>
  );
}
```

- [ ] **Step 2: Typecheck** — `npm run typecheck` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/cards/StudyPage.tsx
git commit -m "feat(cards): add StudyPage orchestration"
```

---

## Task 20: ArchivePage

**Files:**
- Create: `src/features/cards/ArchivePage.tsx`

- [ ] **Step 1: Write `ArchivePage.tsx`**:

```tsx
import { useState } from 'react';
import { ArchiveMasonry } from './sections/ArchiveMasonry';
import { CreateCardDialog } from './components/CreateCardDialog';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';

export function ArchivePage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <main className="min-h-[100dvh] pt-20 pb-24">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <header className="break-keep">
          <p className="font-display text-sm uppercase tracking-[var(--tracking-eyebrow)] text-amber">
            배경 지식 서가
          </p>
          <h1 className="mt-2 font-display text-3xl text-cream md:text-4xl">
            잠시 쉬러 간 카드들.
          </h1>
        </header>
        <Button
          variant="ghost"
          rightIcon={<Icon name="solar:add-circle-linear" />}
          onClick={() => setCreateOpen(true)}
        >
          새 카드
        </Button>
      </div>

      <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6 lg:px-8">
        <ArchiveMasonry />
      </section>

      <CreateCardDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </main>
  );
}
```

- [ ] **Step 2: Typecheck** — `npm run typecheck` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/cards/ArchivePage.tsx
git commit -m "feat(cards): add ArchivePage with masonry and create CTA"
```

---

## Task 21: Wire ToastProvider in App, swap router placeholders

**Files:**
- Modify: `src/app/App.tsx`, `src/app/router.tsx`

- [ ] **Step 1: Update `src/app/App.tsx`**:

```tsx
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { queryClient } from '@/lib/query/queryClient';
import { ToastProvider } from '@/components/ToastProvider';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastProvider />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Update `src/app/router.tsx`**:

```tsx
import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/features/landing/LandingPage';
import { NotFoundPage } from '@/features/not-found/NotFoundPage';
import { PlaceholderPage } from '@/features/placeholders/PlaceholderPage';
import { StudyPage } from '@/features/cards/StudyPage';
import { ArchivePage } from '@/features/cards/ArchivePage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/study', element: <StudyPage /> },
  { path: '/map', element: <PlaceholderPage title="학습 지도" /> },
  { path: '/archive', element: <ArchivePage /> },
  { path: '*', element: <NotFoundPage /> },
]);
```

- [ ] **Step 3: Typecheck + test full** — `npm run typecheck` then `npm run test`. Both must exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx src/app/router.tsx
git commit -m "feat(app): wire ToastProvider and swap Study/Archive routes"
```

---

## Task 22: Full verification

**Files:** none changed; verification only.

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: exit 0. Fix any issues inline (commit as `chore: lint fixes` if needed).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 3: Test suite**

Run: `npm run test`
Expected: all tests pass. Roughly 70+ tests across ~25+ files (1차 35 + this spec's additions).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: exit 0, `dist/` produced.

- [ ] **Step 5: Dev server smoke (optional automated check)**

Run `npm run dev` in background, hit:
- `http://localhost:5173/study` — Study page renders without console errors
- `http://localhost:5173/archive` — Archive page renders
Verify HTML responses with 200 and dev server log has no errors.

Stop the dev server when done.

- [ ] **Step 6: Final git status**

`git status` should be clean. `git log --oneline -10` should show this spec's commits.

---

## Self-Review Notes (already applied)

- **Spec coverage:** Every section/2.x → at least one task. /study sections 2.1 → Tasks 14/15/19. /archive 2.2 → Tasks 16/17/20. Create modal 2.3 → Task 18. UX writing verbatim → Tasks 8/10/15. ApiError code mapping → Task 18 (CreateCardDialog) + sec 7 of spec.
- **Placeholder scan:** No "TBD", "TODO", or unspecified code. Every step has executable content.
- **Type consistency:** Hook return shapes match consumers. `ReviewSessionCardSchema` uses `state: 'DAY_1'|'DAY_3'|'DAY_7'` — matches `ProgressIndicator.stateLabel` prop.
- **Notable scope reduction (YAGNI):**
  - Mock `extend` returns `completedAll: true` always; not extending in mock means user-facing "no more cards" message. Spec acceptance #4 ("호출 시 카드가 큐에 추가됨") is satisfied via real-backend path only — flagged in spec sec 12 (Risks).
  - Tag filter is single-select (not multi).
- **Known small concern:** `TodayQueueView` calls `view.mutate` in a `useEffect` dependent on `card?.cardId` with `eslint-disable-next-line` — intentional because we want to fire once per card change without re-running on the `view` reference change.
