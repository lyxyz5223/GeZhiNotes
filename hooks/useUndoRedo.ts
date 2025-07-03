import { useCallback, useMemo, useRef } from "react";

export interface UndoRedoStack<T> {
  undoStack: T[];
  redoStack: T[];
  push: (state: T) => void;
  undo: () => T | undefined;
  redo: () => T | undefined;
  clear: () => void;
}

export function useUndoRedo<T>(initialState: T = null as any): UndoRedoStack<T> {
  const undoStack = useRef<T[]>([]);
  const redoStack = useRef<T[]>([]);
  const state = useRef<T>(initialState);

  const push = useCallback((newState: T) => {
    undoStack.current.push(state.current);
    state.current = newState;
    redoStack.current = [];
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return undefined;
    const prev = undoStack.current.pop()!;
    redoStack.current.push(state.current);
    state.current = prev;
    return prev;
  }, []);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return undefined;
    const next = redoStack.current.pop()!;
    undoStack.current.push(state.current);
    state.current = next;
    return next;
  }, []);

  const clear = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
  }, []);

  return useMemo(() => ({
    get undoStack() { return undoStack.current; },
    get redoStack() { return redoStack.current; },
    push,
    undo,
    redo,
    clear,
  }), [undoStack, redoStack, push, undo, redo, clear]);
}
