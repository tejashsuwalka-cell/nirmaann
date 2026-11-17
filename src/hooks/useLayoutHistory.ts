import { useCallback, useState } from 'react';
import { commit, undo, redo, type History } from '@/lib/editing';
import { emptyLayout, type Layout } from '@/lib/layout-types';

export function useLayoutHistory() {
  const [history, setHistory] = useState<History<Layout>>({ past: [], present: emptyLayout(), future: [] });
  const reset = useCallback((value: Layout) => setHistory({ past: [], present: value, future: [] }), []);
  const update = useCallback((value: Layout) => setHistory(h => commit(h, value)), []);
  const back = useCallback(() => setHistory(undo), []);
  const forward = useCallback(() => setHistory(redo), []);
  return { layout: history.present, reset, update, back, forward, canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
}