import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AppShell } from '@/components/AppShell';
import { Dialog } from '@/components/Dialog';
import { Icon } from '@/components/Icon';
import { useLearningFacade } from '@/features/auth/hooks/useLearningFacade';
import { track as trackEvent } from '@/lib/analytics/track';
import { ApiError } from '@/lib/api/client';
import { toastStore } from '@/lib/toast/toastQueue';
import type { CoverageStatus } from '@/lib/api/schemas/facade';
import { useRenameAxis } from './hooks/useRenameAxis';
import { useReorderAxes } from './hooks/useReorderAxes';
import { useDeleteAxis } from './hooks/useDeleteAxis';
import { useDeleteTopic } from './hooks/useDeleteTopic';

type NodeStatus = 'none' | 'partial' | 'covered';

interface MapNode {
  id: string;
  name: string;
  status: NodeStatus;
}

interface MapTrack {
  id: string;
  name: string;
  open: boolean;
  sig: [number, number, number];
  nodes: MapNode[];
}

interface MapGroup {
  id: string;
  name: string;
  trackIds: string[];
}

interface MapDim {
  lo: string;
  hi: string;
}

type EditKind =
  | { kind: 'identity' }
  | { kind: 'trackName'; tid: string }
  | { kind: 'nodeName'; tid: string; nid: string }
  | { kind: 'addNode'; tid: string }
  | { kind: 'dim'; di: number; end: 'lo' | 'hi' }
  | { kind: 'groupName'; gid: string };

interface Change {
  time: string;
  text: string;
  icon: string;
  tone: 'edit' | 'add' | 'del';
}

type Lens = 'struct' | 'shape' | 'hist';

const STATUS_META: Record<NodeStatus, { label: string; dot: string; bg: string; color: string }> = {
  covered: { label: '완료', dot: 'var(--color-sage)', bg: 'bg-sage-soft', color: 'text-sage-ink' },
  partial: { label: '학습 중', dot: 'var(--color-amber)', bg: 'bg-amber-soft', color: 'text-amber-deep' },
  none: { label: '자료 없음', dot: 'var(--color-edge-strong)', bg: 'bg-paper-2', color: 'text-cream-faint' },
};

// Track ids are encoded as `t-${axisId}` for persisted axes and `t-x-${n}` for
// locally-added (not-yet-saved) tracks. Same scheme for nodes: `n-${topicId}` vs `nx-${n}`.
function extractAxisId(trackId: string): string | null {
  if (!trackId.startsWith('t-')) return null;
  const rest = trackId.slice(2);
  if (rest.startsWith('x-')) return null;
  return rest;
}
function extractTopicId(nodeId: string): string | null {
  if (!nodeId.startsWith('n-')) return null;
  return nodeId.slice(2);
}

const STATUS_ORDER: NodeStatus[] = ['none', 'partial', 'covered'];

const DEFAULT_DIMS: MapDim[] = [
  { lo: '타임리스', hi: '툴 종속' },
  { lo: '깊이', hi: '넓이' },
  { lo: '시스템 저술', hi: '코드 생산' },
];

const DEFAULT_SIG: [number, number, number] = [0, 0, 0];

function statusFromCoverage(c: CoverageStatus): NodeStatus {
  if (c === 'COVERED') return 'covered';
  if (c === 'PARTIAL') return 'partial';
  return 'none';
}

function strength(n: MapNode): number {
  return n.status === 'covered' ? 1 : n.status === 'partial' ? 0.45 : 0;
}

function nowLabel(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function MapPage() {
  const facade = useLearningFacade();
  const renameAxisMut = useRenameAxis();
  const reorderAxesMut = useReorderAxes();
  const deleteAxisMut = useDeleteAxis();
  const deleteTopicMut = useDeleteTopic();

  const [identity, setIdentity] = useState('결제·정산 도메인을 스스로 저술할 수 있는 백엔드 엔지니어');
  const [lens, setLens] = useState<Lens>('struct');
  const [tracks, setTracks] = useState<MapTrack[]>([]);
  const [groups, setGroups] = useState<MapGroup[]>([]);
  const [dims, setDims] = useState<MapDim[]>(DEFAULT_DIMS);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [edit, setEdit] = useState<EditKind | null>(null);
  const [draft, setDraft] = useState('');
  const [changes, setChanges] = useState<Change[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<{ tid: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const nidRef = useRef(100);
  const seededRef = useRef(false);

  const openedRef = useRef(false);
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    trackEvent('home_opened');
  }, []);

  useEffect(() => {
    if (seededRef.current || !facade.data) return;
    seededRef.current = true;
    const seededTracks: MapTrack[] = facade.data.axes.map((axis) => ({
      id: `t-${axis.axisId}`,
      name: axis.name,
      open: false,
      sig: DEFAULT_SIG,
      nodes: axis.topics.map((topic) => ({
        id: `n-${topic.topicId}`,
        name: topic.name,
        status: statusFromCoverage(topic.coverageStatus),
      })),
    }));
    if (seededTracks.length > 0) {
      setTracks(seededTracks);
      setGroups([
        { id: 'g-core', name: '내 영역', trackIds: seededTracks.map((t) => t.id) },
      ]);
    } else {
      setGroups([{ id: 'g-core', name: '내 영역', trackIds: [] }]);
    }
    const primaryConcept = facade.data.concepts?.[0];
    if (primaryConcept) setIdentity(primaryConcept);
  }, [facade.data]);

  const log = (text: string, icon: string, tone: Change['tone']) => {
    setChanges((s) => [{ time: nowLabel(), text, icon, tone }, ...s]);
  };

  const startEdit = (kind: EditKind, value: string) => {
    setEdit(kind);
    setDraft(value);
  };

  const cancelEdit = () => {
    setEdit(null);
    setDraft('');
  };

  const commit = () => {
    if (!edit) return;
    const v = draft.trim();
    if (edit.kind === 'identity' && v) {
      setIdentity(v);
      log('정체성 선언 수정', '✎', 'edit');
      cancelEdit();
      return;
    }
    if (edit.kind === 'trackName' && v) {
      const tid = edit.tid;
      const original = tracks.find((t) => t.id === tid)?.name ?? '';
      if (v === original) {
        cancelEdit();
        return;
      }
      setTracks((s) => s.map((t) => (t.id === tid ? { ...t, name: v } : t)));
      cancelEdit();
      const axisId = extractAxisId(tid);
      if (!axisId) {
        log(`축 이름 변경 → ${v}`, '✎', 'edit');
        return;
      }
      renameAxisMut.mutate(
        { axisId, name: v },
        {
          onSuccess: () => log(`축 이름 변경 → ${v}`, '✎', 'edit'),
          onError: (err) => {
            setTracks((s) => s.map((t) => (t.id === tid ? { ...t, name: original } : t)));
            const msg =
              err instanceof ApiError && err.code === 'LEARNING_AXIS_DUPLICATE_NAME'
                ? '이미 있는 축 이름이에요'
                : err instanceof ApiError
                  ? err.message
                  : '이름 변경에 실패했어요.';
            toastStore.push({ message: msg, tone: 'amber' });
          },
        },
      );
      return;
    }
    if (edit.kind === 'nodeName' && v) {
      const { tid, nid } = edit;
      setTracks((s) =>
        s.map((t) =>
          t.id !== tid ? t : { ...t, nodes: t.nodes.map((n) => (n.id === nid ? { ...n, name: v } : n)) },
        ),
      );
      log(`노드 수정 → ${v}`, '✎', 'edit');
      cancelEdit();
      return;
    }
    if (edit.kind === 'groupName' && v) {
      const gid = edit.gid;
      setGroups((s) => s.map((g) => (g.id === gid ? { ...g, name: v } : g)));
      log(`Layer 1 이름 변경 → ${v}`, '✎', 'edit');
      cancelEdit();
      return;
    }
    if (edit.kind === 'dim' && v) {
      const { di, end } = edit;
      setDims((s) => s.map((d, i) => (i === di ? { ...d, [end]: v } : d)));
      log(`축을 다시 정의: ${v}`, '⟂', 'edit');
      cancelEdit();
      return;
    }
    if (edit.kind === 'addNode') {
      const tid = edit.tid;
      if (v) {
        const newId = `nx-${nidRef.current++}`;
        setTracks((s) =>
          s.map((t) =>
            t.id !== tid ? t : { ...t, nodes: [...t.nodes, { id: newId, name: v, status: 'none' }] },
          ),
        );
        log(`노드 추가 → ${v}`, '+', 'add');
        setEdit({ kind: 'addNode', tid });
        setDraft('');
        return;
      }
      cancelEdit();
      return;
    }
    cancelEdit();
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const toggleTrack = (id: string) =>
    setTracks((s) => s.map((t) => (t.id === id ? { ...t, open: !t.open } : t)));

  const cycleStatus = (tid: string, nid: string) => {
    let label = '';
    setTracks((s) =>
      s.map((t) => {
        if (t.id !== tid) return t;
        return {
          ...t,
          nodes: t.nodes.map((n) => {
            if (n.id !== nid) return n;
            const next = STATUS_ORDER[(STATUS_ORDER.indexOf(n.status) + 1) % 3]!;
            label = STATUS_META[next].label;
            return { ...n, status: next };
          }),
        };
      }),
    );
    setTimeout(() => log(`상태 전환 → ${label}`, '◐', 'edit'), 0);
  };

  const deleteNode = (tid: string, nid: string) => {
    const track = tracks.find((t) => t.id === tid);
    const node = track?.nodes.find((n) => n.id === nid);
    if (!track || !node) return;
    const name = node.name;
    setTracks((s) =>
      s.map((t) => (t.id !== tid ? t : { ...t, nodes: t.nodes.filter((n) => n.id !== nid) })),
    );
    log(`노드 삭제 — ${name}`, '−', 'del');
    const axisId = extractAxisId(tid);
    const topicId = extractTopicId(nid);
    if (!axisId || !topicId) return;
    deleteTopicMut.mutate(
      { axisId, topicId },
      {
        onError: (err) => {
          setTracks((s) =>
            s.map((t) =>
              t.id === tid
                ? { ...t, nodes: [...t.nodes, node].sort((a, b) => (a.id < b.id ? -1 : 1)) }
                : t,
            ),
          );
          const msg = err instanceof ApiError ? err.message : '주제 삭제에 실패했어요.';
          toastStore.push({ message: msg, tone: 'amber' });
        },
      },
    );
  };

  const requestDeleteTrack = (id: string) => {
    const name = tracks.find((t) => t.id === id)?.name ?? '';
    setDeleteError(null);
    setConfirmDelete({ tid: id, name });
  };

  const performDeleteTrack = () => {
    if (!confirmDelete) return;
    const id = confirmDelete.tid;
    const name = confirmDelete.name;
    const axisId = extractAxisId(id);
    if (!axisId) {
      // not persisted yet — just remove locally
      setTracks((s) => s.filter((t) => t.id !== id));
      setGroups((s) => s.map((g) => ({ ...g, trackIds: g.trackIds.filter((x) => x !== id) })));
      log(`축 삭제 — ${name}`, '−', 'del');
      setConfirmDelete(null);
      cancelEdit();
      return;
    }
    setDeleteError(null);
    deleteAxisMut.mutate(axisId, {
      onSuccess: () => {
        setTracks((s) => s.filter((t) => t.id !== id));
        setGroups((s) => s.map((g) => ({ ...g, trackIds: g.trackIds.filter((x) => x !== id) })));
        log(`축 삭제 — ${name}`, '−', 'del');
        setConfirmDelete(null);
        cancelEdit();
      },
      onError: (err) => {
        const msg = err instanceof ApiError ? err.message : '축 삭제에 실패했어요.';
        setDeleteError(msg);
      },
    });
  };

  const moveTrack = (gid: string, tid: string, dir: -1 | 1) => {
    const g = groups.find((gr) => gr.id === gid);
    if (!g) return;
    const idx = g.trackIds.indexOf(tid);
    const newIdx = idx + dir;
    if (idx === -1 || newIdx < 0 || newIdx >= g.trackIds.length) return;
    const newTrackIds = [...g.trackIds];
    const a = newTrackIds[idx]!;
    const b = newTrackIds[newIdx]!;
    newTrackIds[idx] = b;
    newTrackIds[newIdx] = a;

    const previousGroups = groups;
    setGroups((s) => s.map((gr) => (gr.id === gid ? { ...gr, trackIds: newTrackIds } : gr)));

    const orderedAxisIds = groups
      .map((gr) => (gr.id === gid ? newTrackIds : gr.trackIds))
      .flat()
      .map(extractAxisId)
      .filter((axisId): axisId is string => axisId !== null);

    if (orderedAxisIds.length === 0) {
      log('축 순서 변경', '⇅', 'edit');
      return;
    }

    reorderAxesMut.mutate(orderedAxisIds, {
      onSuccess: () => log('축 순서 변경', '⇅', 'edit'),
      onError: (err) => {
        setGroups(previousGroups);
        const msg = err instanceof ApiError ? err.message : '순서 변경에 실패했어요.';
        toastStore.push({ message: msg, tone: 'amber' });
      },
    });
  };

  const addTrackToGroup = (gid: string) => {
    const id = `t-x-${nidRef.current++}`;
    const newTrack: MapTrack = {
      id,
      name: '새 학습 축',
      open: true,
      sig: DEFAULT_SIG,
      nodes: [],
    };
    setTracks((s) => [...s, newTrack]);
    setGroups((s) => s.map((g) => (g.id === gid ? { ...g, trackIds: [...g.trackIds, id] } : g)));
    log('새 축 추가', '+', 'add');
    startEdit({ kind: 'trackName', tid: id }, '새 학습 축');
  };

  const addGroup = () => {
    const id = `g-x-${nidRef.current++}`;
    setGroups((s) => [...s, { id, name: '새 Layer 1', trackIds: [] }]);
    log('새 Layer 1 추가', '+', 'add');
  };

  const tracksById = useMemo(() => {
    const m = new Map<string, MapTrack>();
    for (const t of tracks) m.set(t.id, t);
    return m;
  }, [tracks]);

  const stats = useMemo(() => {
    let strong = 0;
    let partial = 0;
    let none = 0;
    let total = 0;
    let totalStr = 0;
    tracks.forEach((t) =>
      t.nodes.forEach((n) => {
        total += 1;
        totalStr += strength(n);
        if (n.status === 'covered') strong += 1;
        else if (n.status === 'partial') partial += 1;
        else none += 1;
      }),
    );
    const gapPct = total ? Math.round((totalStr / total) * 100) : 0;
    return { strong, partial, none, total, gapPct };
  }, [tracks]);

  const dimMarkers = useMemo(() => {
    return dims.map((d, di) => {
      let num = 0;
      let den = 0;
      tracks.forEach((t) => {
        const st = t.nodes.reduce((a, n) => a + strength(n), 0);
        num += (t.sig[di] ?? 0) * st;
        den += st;
      });
      const norm = den > 0 ? num / den : 0;
      const pct = Math.max(8, Math.min(92, 50 + norm * 50));
      const lean: 'lo' | 'hi' | 'mid' = norm < -0.08 ? 'lo' : norm > 0.08 ? 'hi' : 'mid';
      return { ...d, di, markerPct: pct, lean };
    });
  }, [dims, tracks]);

  // --- graph drag ---
  const dragRef = useRef<{
    id: string;
    kind: 'group' | 'track' | 'root';
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    moved: boolean;
    groupId?: string;
  } | null>(null);

  const nodeDown = (
    id: string,
    kind: 'group' | 'track' | 'root',
    e: React.MouseEvent,
    groupId?: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const o = offsets[id] ?? { x: 0, y: 0 };
    dragRef.current = {
      id,
      kind,
      sx: e.clientX,
      sy: e.clientY,
      ox: o.x,
      oy: o.y,
      moved: false,
      groupId,
    };
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragUp);
  };

  const onDragMove = (e: MouseEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    setOffsets((s) => ({ ...s, [d.id]: { x: d.ox + dx, y: d.oy + dy } }));
  };

  const onDragUp = () => {
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragUp);
    const d = dragRef.current;
    dragRef.current = null;
    if (d && !d.moved) {
      if (d.kind === 'group') setActiveGroup(d.id);
      else if (d.kind === 'track' && d.groupId) setActiveGroup(d.groupId);
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- graph geometry ---
  const cx = 360;
  const cy = 252;
  const R1 = 152;
  const R2 = 92;
  const off = (id: string) => offsets[id] ?? { x: 0, y: 0 };
  const npos: Record<string, { x: number; y: number }> = {};
  npos['__root'] = { x: cx + off('__root').x, y: cy + off('__root').y };
  const G = Math.max(1, groups.length);
  const groupNodes: Array<{ id: string; name: string; count: number; x: number; y: number }> = [];
  const trackNodes: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    dot: string;
    groupId: string;
  }> = [];
  const edges: Array<{ a: string; b: string }> = [];
  groups.forEach((g, gi) => {
    const ang = ((-90 + gi * (360 / G)) * Math.PI) / 180;
    const o = off(g.id);
    const gx = cx + R1 * Math.cos(ang) + o.x;
    const gy = cy + R1 * Math.sin(ang) + o.y;
    npos[g.id] = { x: gx, y: gy };
    edges.push({ a: '__root', b: g.id });
    const T = g.trackIds.length;
    g.trackIds.forEach((tid, ti) => {
      const spread = T <= 1 ? ang : ang + ((ti / Math.max(T - 1, 1) - 0.5) * 52 * Math.PI) / 180;
      const to = off(tid);
      const tx = gx + R2 * Math.cos(spread) + to.x;
      const ty = gy + R2 * Math.sin(spread) + to.y;
      npos[tid] = { x: tx, y: ty };
      edges.push({ a: g.id, b: tid });
      const t = tracksById.get(tid);
      if (t) {
        const dot = t.nodes.some((n) => n.status === 'covered')
          ? 'var(--color-sage)'
          : t.nodes.some((n) => n.status === 'partial')
            ? 'var(--color-amber)'
            : 'var(--color-edge-strong)';
        trackNodes.push({ id: tid, name: t.name, x: tx, y: ty, dot, groupId: g.id });
      }
    });
    groupNodes.push({ id: g.id, name: g.name, count: g.trackIds.length, x: gx, y: gy });
  });
  const edgeObjs = edges
    .map((e) => {
      const a = npos[e.a];
      const b = npos[e.b];
      if (!a || !b) return null;
      return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, key: `${e.a}-${e.b}` };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const activeG = groups.find((g) => g.id === activeGroup) ?? null;
  const detailTracks = activeG
    ? activeG.trackIds
        .map((id) => tracksById.get(id))
        .filter((t): t is MapTrack => Boolean(t))
    : [];

  const inDetail = lens === 'struct' && Boolean(activeG);
  const inOverview = lens === 'struct' && !activeG;

  const topbar = (
    <>
      <div className="flex items-center gap-2.5 text-[13px] text-cream-faint">
        <span>Learning Facade</span>
        <span className="opacity-50">/</span>
        <span className="font-medium text-cream-mute">지도</span>
        <span className="ml-2 rounded-full border border-edge bg-paper-2 px-2.5 py-0.5 text-[11px] tabular-nums text-cream-mute">
          구조 · 변경 {changes.length}
        </span>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-edge bg-paper-2 p-1">
        {([
          { key: 'struct', label: '구조' },
          { key: 'shape', label: '형태' },
          { key: 'hist', label: '히스토리' },
        ] as Array<{ key: Lens; label: string }>).map((l) => {
          const active = lens === l.key;
          return (
            <button
              key={l.key}
              type="button"
              onClick={() => setLens(l.key)}
              className={`whitespace-nowrap rounded-full border-0 px-4 py-1.5 text-[13px] font-medium transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] ${
                active
                  ? 'bg-surface text-cream shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                  : 'bg-transparent text-cream-faint hover:text-cream'
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <AppShell topbar={topbar}>
      <article
        className="overflow-hidden rounded-[20px] border border-edge bg-surface"
        style={{ animation: 'fadeInUp .45s var(--ease-spring) both' }}
      >
        <div className="border-b border-edge px-[30px] py-7">
          <div className="mb-3.5 flex items-center gap-2.5">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber" />
            <span className="text-[11px] uppercase tracking-[0.1em] text-cream-faint">
              북극성 · 선언한 나
            </span>
            <span className="ml-auto text-[11.5px] text-cream-faint">
              수정하면 아래 갭이 다시 계산돼요
            </span>
          </div>
          {edit?.kind === 'identity' ? (
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              onBlur={commit}
              autoFocus
              className="w-full border-0 border-b border-amber-line bg-transparent pb-1 font-serif text-[30px] font-medium leading-[1.2] tracking-[-0.01em] text-cream caret-amber outline-none"
            />
          ) : (
            <h1
              onClick={() => startEdit({ kind: 'identity' }, identity)}
              title="클릭해서 수정"
              className="m-0 max-w-[30ch] cursor-text font-serif text-[30px] font-medium leading-[1.28] tracking-[-0.01em] text-cream break-keep"
            >
              "{identity}
              <span className="text-amber">"</span>
            </h1>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
          <div className="border-b border-edge px-[30px] py-[26px] lg:border-b-0 lg:border-r">
            <div className="mb-3 text-xs text-cream-faint">선언한 나 → 지금의 나</div>
            <div className="mb-3.5 flex items-baseline gap-1.5">
              <span className="font-serif text-[48px] font-medium leading-none text-cream">
                {stats.gapPct}
              </span>
              <span className="font-serif text-[22px] text-cream-faint">%</span>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-paper-2">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${stats.gapPct}%`,
                  background:
                    'linear-gradient(90deg, var(--color-amber), var(--color-amber-deep))',
                }}
              />
            </div>
            <div className="text-[12.5px] leading-[1.55] text-cream-mute break-keep">
              강함 {stats.strong} · 진행 {stats.partial} · 미착수 {stats.none} · 노드 {stats.total}개
            </div>
          </div>

          <div className="flex flex-col justify-center gap-[18px] px-[30px] py-6">
            <div className="-mb-0.5 text-xs text-cream-faint">
              되어가는 형태 — 축을 다시 정의하면 좌표가 바뀝니다
            </div>
            {dimMarkers.map((d, i) => (
              <DimRow
                key={i}
                d={d}
                edit={edit}
                draft={draft}
                onDraft={setDraft}
                onKey={onKey}
                onCommit={commit}
                onEditLo={() => startEdit({ kind: 'dim', di: d.di, end: 'lo' }, d.lo)}
                onEditHi={() => startEdit({ kind: 'dim', di: d.di, end: 'hi' }, d.hi)}
              />
            ))}
          </div>
        </div>
      </article>

      {inOverview && (
        <OverviewLens
          groups={groups}
          groupCount={groups.length}
          trackCount={tracks.length}
          totalCount={stats.total}
          groupNodes={groupNodes}
          trackNodes={trackNodes}
          edges={edgeObjs}
          rootPos={npos['__root']!}
          onNodeDown={nodeDown}
          onAddGroup={addGroup}
        />
      )}

      {inDetail && activeG && (
        <DetailLens
          group={activeG}
          tracks={detailTracks}
          edit={edit}
          draft={draft}
          onDraft={setDraft}
          onKey={onKey}
          onCommit={commit}
          onCancelEdit={cancelEdit}
          onBack={() => setActiveGroup(null)}
          onEditGroupName={() => startEdit({ kind: 'groupName', gid: activeG.id }, activeG.name)}
          onAddTrack={() => addTrackToGroup(activeG.id)}
          onToggleTrack={toggleTrack}
          onEditTrackName={(tid, name) => startEdit({ kind: 'trackName', tid }, name)}
          onDeleteTrack={requestDeleteTrack}
          onMoveTrack={(tid, dir) => moveTrack(activeG.id, tid, dir)}
          onCycleStatus={cycleStatus}
          onEditNodeName={(tid, nid, name) => startEdit({ kind: 'nodeName', tid, nid }, name)}
          onDeleteNode={deleteNode}
          onStartAddNode={(tid) => startEdit({ kind: 'addNode', tid }, '')}
          showExceedsRecommended={facade.data?.isAxisCountExceedsRecommended === true}
        />
      )}

      {lens === 'shape' && <ShapeLens tracks={tracks} />}
      {lens === 'hist' && <HistoryLens changes={changes} />}

      <Dialog
        open={confirmDelete !== null}
        onClose={() => {
          if (!deleteAxisMut.isPending) {
            setConfirmDelete(null);
            setDeleteError(null);
          }
        }}
        title={`'${confirmDelete?.name ?? ''}' 축 삭제`}
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(null);
                setDeleteError(null);
              }}
              disabled={deleteAxisMut.isPending}
              className="rounded-full border border-edge-strong bg-transparent px-4 py-2 text-[13px] font-medium text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={performDeleteTrack}
              disabled={deleteAxisMut.isPending}
              className="rounded-full border-0 bg-amber-deep px-4 py-2 text-[13px] font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {deleteAxisMut.isPending ? '삭제 중…' : '삭제'}
            </button>
          </>
        }
      >
        <p className="m-0 text-[14px] leading-[1.6] text-cream-mute break-keep">
          이 축과 <span className="font-semibold text-cream">하위 주제가 모두 삭제</span>됩니다. 이
          작업은 되돌릴 수 없어요.
        </p>
        {deleteError && (
          <p role="alert" className="m-0 mt-3 text-sm text-amber-deep">
            {deleteError}
          </p>
        )}
      </Dialog>
    </AppShell>
  );
}

function DimRow({
  d,
  edit,
  draft,
  onDraft,
  onKey,
  onCommit,
  onEditLo,
  onEditHi,
}: {
  d: { lo: string; hi: string; markerPct: number; lean: 'lo' | 'hi' | 'mid'; di: number };
  edit: EditKind | null;
  draft: string;
  onDraft: (v: string) => void;
  onKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  onCommit: () => void;
  onEditLo: () => void;
  onEditHi: () => void;
}) {
  const editingLo = edit?.kind === 'dim' && edit.di === d.di && edit.end === 'lo';
  const editingHi = edit?.kind === 'dim' && edit.di === d.di && edit.end === 'hi';
  return (
    <div>
      <div className="mb-[7px] flex items-center justify-between gap-3 text-xs">
        {editingLo ? (
          <input
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            onKeyDown={onKey}
            onBlur={onCommit}
            autoFocus
            className="rounded border border-amber-line bg-surface px-1 py-0.5 text-xs text-cream caret-amber outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={onEditLo}
            title="축 다시 정의"
            className={`rounded px-0.5 py-0.5 hover:bg-paper-2 ${
              d.lean === 'lo' ? 'font-semibold text-cream' : 'font-normal text-cream-faint'
            }`}
          >
            {d.lo}
          </button>
        )}
        {editingHi ? (
          <input
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            onKeyDown={onKey}
            onBlur={onCommit}
            autoFocus
            className="rounded border border-amber-line bg-surface px-1 py-0.5 text-xs text-cream caret-amber outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={onEditHi}
            title="축 다시 정의"
            className={`rounded px-0.5 py-0.5 hover:bg-paper-2 ${
              d.lean === 'hi' ? 'font-semibold text-cream' : 'font-normal text-cream-faint'
            }`}
          >
            {d.hi}
          </button>
        )}
      </div>
      <div
        className="relative h-2 rounded-full"
        style={{
          background:
            'linear-gradient(90deg, var(--color-amber-soft), var(--color-paper-2), var(--color-sage-soft))',
        }}
      >
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 h-3.5 w-px -translate-x-1/2 -translate-y-1/2 bg-edge-strong"
        />
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-cream shadow-[0_2px_6px_rgba(0,0,0,0.18)] transition-[left] duration-500"
          style={{ left: `${d.markerPct}%` }}
        />
      </div>
    </div>
  );
}

function OverviewLens({
  groupCount,
  trackCount,
  totalCount,
  groupNodes,
  trackNodes,
  edges,
  rootPos,
  onNodeDown,
  onAddGroup,
}: {
  groups: MapGroup[];
  groupCount: number;
  trackCount: number;
  totalCount: number;
  groupNodes: Array<{ id: string; name: string; count: number; x: number; y: number }>;
  trackNodes: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    dot: string;
    groupId: string;
  }>;
  edges: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }>;
  rootPos: { x: number; y: number };
  onNodeDown: (
    id: string,
    kind: 'group' | 'track' | 'root',
    e: React.MouseEvent,
    groupId?: string,
  ) => void;
  onAddGroup: () => void;
}) {
  return (
    <div className="mt-7">
      <div className="mb-1.5 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-[11px]">
          <h2 className="m-0 font-serif text-[23px] font-medium text-cream">로드맵 지도</h2>
          <span className="text-[13px] text-cream-faint">
            Layer 1 {groupCount} · 축 {trackCount} · 노드 {totalCount}
          </span>
        </div>
        <button
          type="button"
          onClick={onAddGroup}
          className="inline-flex items-center gap-2 rounded-full border border-edge-strong bg-transparent px-4 py-2.5 text-[13px] font-medium text-cream-mute transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:bg-paper-2 hover:text-cream"
        >
          <Icon name="solar:add-square-linear" width={15} height={15} />
          새 Layer 1
        </button>
      </div>
      <p className="m-0 mb-1.5 text-[12.5px] text-cream-faint">
        노드를 끌어 배치하고, Layer 1을 누르면 안의 로드맵으로 들어가요
      </p>

      <div
        className="relative mx-auto mt-2 rounded-[20px] border border-edge bg-surface"
        style={{
          width: 720,
          height: 520,
          backgroundImage: 'radial-gradient(var(--color-edge) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      >
        <svg
          width={720}
          height={520}
          style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 0 }}
        >
          {edges.map((e) => (
            <line
              key={e.key}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="var(--color-edge-strong)"
              strokeWidth={1.5}
            />
          ))}
        </svg>

        <div
          className="absolute z-[2]"
          style={{
            left: rootPos.x,
            top: rootPos.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        >
          <div className="grid h-[54px] w-[54px] place-items-center rounded-full bg-cream text-canvas shadow-[0_8px_20px_-6px_rgba(0,0,0,0.4)]">
            <Icon name="solar:book-2-linear" width={24} height={24} />
          </div>
          <div className="absolute left-1/2 top-[62px] -translate-x-1/2 whitespace-nowrap text-[11px] uppercase tracking-[0.08em] text-cream-faint">
            내 로드맵
          </div>
        </div>

        {groupNodes.map((g) => (
          <div
            key={g.id}
            onMouseDown={(e) => onNodeDown(g.id, 'group', e)}
            className="absolute z-[4] cursor-grab active:cursor-grabbing"
            style={{ left: g.x, top: g.y, transform: 'translate(-50%, -50%)' }}
          >
            <div
              className="grid h-[62px] w-[62px] place-items-center rounded-full shadow-[0_10px_22px_-6px_var(--color-amber-line)] transition-transform"
              style={{
                background: 'linear-gradient(150deg, var(--color-amber), var(--color-amber-deep))',
              }}
            >
              <span className="font-serif text-[19px] font-medium text-white">{g.count}</span>
            </div>
            <div className="absolute left-1/2 top-[70px] -translate-x-1/2 whitespace-nowrap font-serif text-base font-semibold text-cream">
              {g.name}
            </div>
          </div>
        ))}

        {trackNodes.map((t) => (
          <div
            key={t.id}
            onMouseDown={(e) => onNodeDown(t.id, 'track', e, t.groupId)}
            className="absolute z-[3] cursor-grab active:cursor-grabbing"
            style={{ left: t.x, top: t.y, transform: 'translate(-50%, -50%)' }}
          >
            <div className="grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-amber-line bg-surface shadow-[0_3px_8px_rgba(0,0,0,0.08)]">
              <span
                className="block h-2.5 w-2.5 rounded-full"
                style={{ background: t.dot }}
              />
            </div>
            <div className="absolute left-1/2 top-[38px] -translate-x-1/2 whitespace-nowrap text-xs text-cream-mute">
              {t.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailLens({
  group,
  tracks,
  edit,
  draft,
  onDraft,
  onKey,
  onCommit,
  onCancelEdit,
  onBack,
  onEditGroupName,
  onAddTrack,
  onToggleTrack,
  onEditTrackName,
  onDeleteTrack,
  onMoveTrack,
  onCycleStatus,
  onEditNodeName,
  onDeleteNode,
  onStartAddNode,
  showExceedsRecommended,
}: {
  group: MapGroup;
  tracks: MapTrack[];
  edit: EditKind | null;
  draft: string;
  onDraft: (v: string) => void;
  onKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  onCommit: () => void;
  onCancelEdit: () => void;
  onBack: () => void;
  onEditGroupName: () => void;
  onAddTrack: () => void;
  onToggleTrack: (tid: string) => void;
  onEditTrackName: (tid: string, name: string) => void;
  onDeleteTrack: (tid: string) => void;
  onMoveTrack: (tid: string, dir: -1 | 1) => void;
  onCycleStatus: (tid: string, nid: string) => void;
  onEditNodeName: (tid: string, nid: string, name: string) => void;
  onDeleteNode: (tid: string, nid: string) => void;
  onStartAddNode: (tid: string) => void;
  showExceedsRecommended: boolean;
}) {
  const editingGroupName = edit?.kind === 'groupName' && edit.gid === group.id;
  return (
    <div className="mt-7">
      <button
        type="button"
        onClick={onBack}
        className="mb-[18px] inline-flex items-center gap-2 rounded-full border border-edge-strong bg-transparent px-3.5 py-2 text-[13px] font-medium text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream"
      >
        <Icon name="solar:alt-arrow-left-linear" width={16} height={16} />
        전체 지도
      </button>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex-shrink-0 rounded-[7px] bg-amber-soft px-2.5 py-1 text-[11px] font-semibold tracking-[0.05em] text-amber-deep">
            LAYER 1
          </span>
          {editingGroupName ? (
            <input
              value={draft}
              onChange={(e) => onDraft(e.target.value)}
              onKeyDown={onKey}
              onBlur={onCommit}
              autoFocus
              className="max-w-[320px] border-0 border-b border-amber-line bg-transparent font-serif text-[26px] font-semibold text-cream caret-amber outline-none"
            />
          ) : (
            <h2
              onClick={onEditGroupName}
              title="클릭해서 수정"
              className="m-0 cursor-text font-serif text-[28px] font-semibold tracking-[-0.01em] text-cream"
            >
              {group.name}
            </h2>
          )}
          <span className="whitespace-nowrap text-[13px] text-cream-faint">
            축 {tracks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onAddTrack}
          className="inline-flex items-center gap-2 rounded-full border border-edge-strong bg-transparent px-4 py-2.5 text-[13px] font-medium text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream"
        >
          <Icon name="solar:add-square-linear" width={15} height={15} />
          새 축
        </button>
      </div>

      {showExceedsRecommended && (
        <div className="mb-4 flex items-start gap-2.5 rounded-[12px] border border-amber-line bg-amber-soft px-4 py-3 text-[13px] text-amber-deep">
          <Icon name="solar:info-circle-linear" width={16} height={16} className="mt-0.5 flex-shrink-0" />
          <span className="break-keep">
            추천 축 수를 초과했어요 — 학습 효율을 위해 5개 이하를 권장해요.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tracks.map((t, i) => (
          <TrackRow
            key={t.id}
            t={t}
            index={i}
            edit={edit}
            draft={draft}
            canMoveUp={i > 0}
            canMoveDown={i < tracks.length - 1}
            onDraft={onDraft}
            onKey={onKey}
            onCommit={onCommit}
            onCancelEdit={onCancelEdit}
            onToggle={() => onToggleTrack(t.id)}
            onEditTrackName={() => onEditTrackName(t.id, t.name)}
            onDeleteTrack={() => onDeleteTrack(t.id)}
            onMoveUp={() => onMoveTrack(t.id, -1)}
            onMoveDown={() => onMoveTrack(t.id, 1)}
            onCycleStatus={(nid) => onCycleStatus(t.id, nid)}
            onEditNodeName={(nid, name) => onEditNodeName(t.id, nid, name)}
            onDeleteNode={(nid) => onDeleteNode(t.id, nid)}
            onStartAddNode={() => onStartAddNode(t.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TrackRow({
  t,
  index,
  edit,
  draft,
  canMoveUp,
  canMoveDown,
  onDraft,
  onKey,
  onCommit,
  onToggle,
  onEditTrackName,
  onDeleteTrack,
  onMoveUp,
  onMoveDown,
  onCycleStatus,
  onEditNodeName,
  onDeleteNode,
  onStartAddNode,
}: {
  t: MapTrack;
  index: number;
  edit: EditKind | null;
  draft: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDraft: (v: string) => void;
  onKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  onCommit: () => void;
  onCancelEdit: () => void;
  onToggle: () => void;
  onEditTrackName: () => void;
  onDeleteTrack: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCycleStatus: (nid: string) => void;
  onEditNodeName: (nid: string, name: string) => void;
  onDeleteNode: (nid: string) => void;
  onStartAddNode: () => void;
}) {
  const covered = t.nodes.filter((n) => n.status === 'covered').length;
  const pct = t.nodes.length ? Math.round((covered / t.nodes.length) * 100) : 0;
  const editingName = edit?.kind === 'trackName' && edit.tid === t.id;
  const adding = edit?.kind === 'addNode' && edit.tid === t.id;

  return (
    <div
      className={`group/trk overflow-hidden rounded-[16px] border bg-surface transition-colors ${
        t.open ? 'border-edge-strong' : 'border-edge'
      }`}
    >
      <div
        className="flex cursor-pointer items-center gap-3.5 px-[22px] py-[18px]"
        onClick={onToggle}
      >
        <span
          className="grid h-[22px] w-[22px] place-items-center text-cream-faint transition-transform duration-[var(--dur-fast)] ease-[var(--ease-spring)]"
          style={{ transform: t.open ? 'rotate(90deg)' : 'rotate(0)' }}
        >
          <Icon name="solar:alt-arrow-right-linear" width={16} height={16} />
        </span>
        <span className="flex-shrink-0 font-serif text-[26px] font-normal italic leading-none text-amber">
          {(index + 1).toString().padStart(2, '0')}
        </span>
        <div
          className="min-w-0 flex-1"
          onClick={(e) => editingName && e.stopPropagation()}
        >
          {editingName ? (
            <input
              value={draft}
              onChange={(e) => onDraft(e.target.value)}
              onKeyDown={onKey}
              onBlur={onCommit}
              autoFocus
              className="max-w-[340px] border-0 border-b border-amber-line bg-transparent font-serif text-[21px] font-medium text-cream caret-amber outline-none"
            />
          ) : (
            <h3
              onClick={(e) => {
                e.stopPropagation();
                onEditTrackName();
              }}
              title="클릭해서 수정"
              className="m-0 inline cursor-text font-serif text-[21px] font-medium tracking-[-0.01em] text-cream break-keep"
            >
              {t.name}
            </h3>
          )}
        </div>
        <span className="whitespace-nowrap text-xs text-cream-faint">
          {covered}/{t.nodes.length} 강함
        </span>
        <div className="h-[5px] w-16 flex-shrink-0 overflow-hidden rounded-full bg-paper-2">
          <div
            className="h-full rounded-full bg-amber transition-all duration-400"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div
          className="flex gap-1 opacity-0 transition-opacity duration-[var(--dur-fast)] ease-[var(--ease-spring)] group-hover/trk:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title="위로 이동"
            aria-label="축 위로 이동"
            className="grid h-7 w-7 place-items-center rounded-md border border-edge bg-canvas text-cream-faint transition-colors hover:border-amber-line hover:text-amber disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-edge disabled:hover:text-cream-faint"
          >
            <Icon name="solar:alt-arrow-up-linear" width={14} height={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title="아래로 이동"
            aria-label="축 아래로 이동"
            className="grid h-7 w-7 place-items-center rounded-md border border-edge bg-canvas text-cream-faint transition-colors hover:border-amber-line hover:text-amber disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-edge disabled:hover:text-cream-faint"
          >
            <Icon name="solar:alt-arrow-down-linear" width={14} height={14} />
          </button>
          <button
            type="button"
            onClick={onEditTrackName}
            title="축 이름 수정"
            className="grid h-7 w-7 place-items-center rounded-md border border-edge bg-canvas text-cream-faint hover:border-amber-line hover:text-amber"
          >
            <Icon name="solar:pen-2-linear" width={14} height={14} />
          </button>
          <button
            type="button"
            onClick={onDeleteTrack}
            title="축 삭제"
            className="grid h-7 w-7 place-items-center rounded-md border border-edge bg-canvas text-cream-faint hover:border-[rgba(180,69,58,0.4)] hover:text-[#b4453a]"
          >
            <Icon name="solar:trash-bin-trash-linear" width={14} height={14} />
          </button>
        </div>
      </div>

      {t.open && (
        <div
          className="pb-[18px] pl-[58px] pr-[22px] pt-1"
          style={{ animation: 'fadeInUp 0.25s var(--ease-spring) both' }}
        >
          {t.nodes.map((n) => {
            const meta = STATUS_META[n.status];
            const editingNode = edit?.kind === 'nodeName' && edit.nid === n.id && edit.tid === t.id;
            return (
              <div
                key={n.id}
                className="group/nd -mx-2.5 flex items-center gap-3 rounded-[9px] px-2.5 py-2 transition-colors hover:bg-paper-2"
              >
                <button
                  type="button"
                  onClick={() => onCycleStatus(n.id)}
                  title="상태 전환"
                  className={`inline-flex min-w-[74px] flex-shrink-0 items-center gap-1.5 rounded-full border-0 px-2.5 py-1 text-[11px] font-semibold ${meta.bg} ${meta.color}`}
                >
                  <span
                    className="h-[7px] w-[7px] rounded-full"
                    style={{ background: meta.dot }}
                  />
                  {meta.label}
                </button>
                <div className="min-w-0 flex-1">
                  {editingNode ? (
                    <input
                      value={draft}
                      onChange={(e) => onDraft(e.target.value)}
                      onKeyDown={onKey}
                      onBlur={onCommit}
                      autoFocus
                      className="w-full border-0 border-b border-amber-line bg-transparent text-[14.5px] text-cream caret-amber outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => onEditNodeName(n.id, n.name)}
                      title="클릭해서 수정"
                      className="cursor-text text-[14.5px] text-cream"
                    >
                      {n.name}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteNode(n.id)}
                  title="삭제"
                  className="grid h-[26px] w-[26px] flex-shrink-0 place-items-center border-0 bg-transparent text-cream-faint opacity-0 transition-opacity hover:text-[#b4453a] group-hover/nd:opacity-100"
                >
                  <Icon name="solar:close-circle-linear" width={15} height={15} />
                </button>
              </div>
            );
          })}

          {adding ? (
            <div className="-mx-2.5 mt-0.5 flex items-center gap-3 px-2.5 py-2">
              <span className="min-w-[74px] flex-shrink-0 rounded-full bg-paper-2 px-2.5 py-1 text-center text-[11px] font-semibold text-cream-faint">
                미착수
              </span>
              <input
                value={draft}
                onChange={(e) => onDraft(e.target.value)}
                onKeyDown={onKey}
                onBlur={onCommit}
                autoFocus
                placeholder="새 노드 이름 — Enter로 추가"
                className="flex-1 border-0 border-b border-amber-line bg-transparent text-[14.5px] text-cream caret-amber outline-none placeholder:text-cream-faint"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={onStartAddNode}
              className="mt-1.5 inline-flex items-center gap-2 rounded-lg border border-dashed border-edge-strong bg-transparent px-3 py-1.5 text-[13px] font-medium text-cream-faint hover:border-amber-line hover:text-amber"
            >
              <Icon name="solar:add-square-linear" width={15} height={15} />
              노드 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ShapeLens({ tracks }: { tracks: MapTrack[] }) {
  const strengths = tracks.map((t) => ({
    t,
    str: t.nodes.reduce((a, n) => a + strength(n), 0),
    covered: t.nodes.filter((n) => n.status === 'covered').length,
  }));
  const maxStr = Math.max(0, ...strengths.map((s) => s.str));

  return (
    <div className="mt-7">
      <h2 className="m-0 mb-1.5 font-serif text-[23px] font-medium text-cream">
        되어가는 나 — 형태 렌즈
      </h2>
      <p className="m-0 mb-6 max-w-[60ch] text-sm text-cream-mute break-keep">
        구조에서 계산되어 나온 모습이에요. 각 축이 지금의 강함에 얼마나 기여하는지 보여줍니다.
      </p>
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {strengths.map((s, i) => {
          const contrib = maxStr > 0 ? Math.round((s.str / maxStr) * 100) : 0;
          return (
            <div key={s.t.id} className="rounded-[14px] border border-edge bg-surface px-[22px] py-5">
              <div className="mb-3.5 flex items-baseline gap-2.5">
                <span className="font-serif text-lg italic text-amber">
                  {(i + 1).toString().padStart(2, '0')}
                </span>
                <h3 className="m-0 font-serif text-lg font-medium text-cream break-keep">
                  {s.t.name}
                </h3>
              </div>
              <div className="mb-2.5 h-1.5 overflow-hidden rounded-full bg-paper-2">
                <div
                  className="h-full rounded-full bg-amber transition-all duration-500"
                  style={{ width: `${contrib}%` }}
                />
              </div>
              <div className="text-xs text-cream-faint">
                기여도 {contrib}% · 강함 {s.covered}/{s.t.nodes.length}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryLens({ changes }: { changes: Change[] }) {
  const TONE: Record<Change['tone'], { bg: string; color: string }> = {
    edit: { bg: 'bg-amber-soft', color: 'text-amber-deep' },
    add: { bg: 'bg-sage-soft', color: 'text-sage-ink' },
    del: { bg: 'bg-[rgba(180,69,58,0.12)]', color: 'text-[#b4453a]' },
  };

  return (
    <div className="mt-7">
      <h2 className="m-0 mb-1.5 font-serif text-[23px] font-medium text-cream">구조 히스토리</h2>
      <p className="m-0 mb-6 text-sm text-cream-mute">
        이번 세션에서 구조를 어떻게 고쳤는지 — 되어가는 궤적의 변경 이력.
      </p>
      {changes.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-edge-strong px-12 py-12 text-center">
          <p className="m-0 text-[15px] text-cream-faint">
            아직 변경이 없어요 — 구조 렌즈에서 로드맵을 고치면 여기에 기록됩니다.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {changes.map((h, i) => {
            const tone = TONE[h.tone];
            return (
              <div key={i} className="flex gap-4 border-b border-edge py-3.5">
                <span className="w-[52px] flex-shrink-0 pt-0.5 text-xs tabular-nums text-cream-faint">
                  {h.time}
                </span>
                <span
                  className={`grid h-[22px] w-[22px] flex-shrink-0 place-items-center rounded-full text-[11px] ${tone.bg} ${tone.color}`}
                >
                  {h.icon}
                </span>
                <span className="text-sm leading-[1.5] text-cream break-keep">{h.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
