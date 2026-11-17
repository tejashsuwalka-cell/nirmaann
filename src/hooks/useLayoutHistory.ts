import { useCallback, useRef, useState } from 'react';
import { commit, undo, redo, type History } from '@/lib/editing';
import { emptyLayout, type Layout } from '@/lib/layout-types';

export function useLayoutHistory() {
  const [history, setHistory] = useState<History<Layout>>({ past: [], present: emptyLayout(), future: [] });
  const base = useRef<Layout | null>(null);
  const reset = useCallback((value: Layout) => { base.current = null; setHistory({ past: [], present: value, future: [] }); }, []);
  const update = useCallback((value: Layout) => setHistory(h => base.current ? { ...h, present: value } : commit(h, value)), []);
  const begin = useCallback(() => setHistory(h => { base.current = h.present; return h; }), []);
  const end = useCallback(() => setHistory(h => {
    const before = base.current; base.current = null;
    return before ? commit({ ...h, present: before }, h.present) : h;
  }), []);
  const back = useCallback(() => { base.current = null; setHistory(undo); }, []);
  const forward = useCallback(() => { base.current = null; setHistory(redo); }, []);
  return { layout: history.present, reset, update, begin, end, back, forward, canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
}