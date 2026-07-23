import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { createId } from '@/lib/id';
import { loadLists, saveLists } from '@/lib/storage';
import type { PendingUndo, Task, TaskList } from '@/types/tasks';

const UNDO_TIMEOUT_MS = 4000;

type TaskContextValue = {
  lists: TaskList[];
  isLoading: boolean;
  pendingUndo: PendingUndo | null;
  createList: (title: string) => void;
  renameList: (listId: string, title: string) => void;
  deleteList: (listId: string) => void;
  getList: (listId: string) => TaskList | undefined;
  addTask: (listId: string, title: string) => void;
  updateTask: (listId: string, taskId: string, title: string) => void;
  deleteTask: (listId: string, taskId: string) => void;
  reorderTasks: (listId: string, tasks: Task[]) => void;
  undoDelete: () => void;
  dismissUndo: () => void;
};

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [lists, setLists] = useState<TaskList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadLists().then((loaded) => {
      setLists(loaded);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;
    saveLists(lists);
  }, [lists, isLoading]);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const dismissUndo = useCallback(() => {
    clearUndoTimer();
    setPendingUndo(null);
  }, [clearUndoTimer]);

  const scheduleUndoExpiry = useCallback(() => {
    clearUndoTimer();
    undoTimerRef.current = setTimeout(() => {
      setPendingUndo(null);
      undoTimerRef.current = null;
    }, UNDO_TIMEOUT_MS);
  }, [clearUndoTimer]);

  const createList = useCallback(
    (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;

      setLists((prev) => [
        ...prev,
        { id: createId(), title: trimmed, tasks: [] },
      ]);
    },
    [],
  );

  const deleteList = useCallback(
    (listId: string) => {
      dismissUndo();
      setLists((prev) => prev.filter((list) => list.id !== listId));
    },
    [dismissUndo],
  );

  const renameList = useCallback((listId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setLists((prev) =>
      prev.map((list) => (list.id === listId ? { ...list, title: trimmed } : list)),
    );
  }, []);

  const getList = useCallback(
    (listId: string) => lists.find((list) => list.id === listId),
    [lists],
  );

  const addTask = useCallback((listId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, tasks: [...list.tasks, { id: createId(), title: trimmed }] }
          : list,
      ),
    );
  }, []);

  const updateTask = useCallback((listId: string, taskId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              tasks: list.tasks.map((task) =>
                task.id === taskId ? { ...task, title: trimmed } : task,
              ),
            }
          : list,
      ),
    );
  }, []);

  const deleteTask = useCallback(
    (listId: string, taskId: string) => {
      dismissUndo();

      let undoPayload: PendingUndo | null = null;

      setLists((prev) => {
        const list = prev.find((item) => item.id === listId);
        if (!list) return prev;

        const index = list.tasks.findIndex((task) => task.id === taskId);
        if (index === -1) return prev;

        undoPayload = { listId, task: list.tasks[index], index };

        return prev.map((item) =>
          item.id === listId
            ? { ...item, tasks: item.tasks.filter((t) => t.id !== taskId) }
            : item,
        );
      });

      if (undoPayload) {
        setPendingUndo(undoPayload);
        scheduleUndoExpiry();
      }
    },
    [dismissUndo, scheduleUndoExpiry],
  );

  const undoDelete = useCallback(() => {
    if (!pendingUndo) return;

    const { listId, task, index } = pendingUndo;
    dismissUndo();

    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;

        const tasks = [...list.tasks];
        tasks.splice(index, 0, task);
        return { ...list, tasks };
      }),
    );
  }, [pendingUndo, dismissUndo]);

  const reorderTasks = useCallback((listId: string, tasks: Task[]) => {
    setLists((prev) =>
      prev.map((list) => (list.id === listId ? { ...list, tasks } : list)),
    );
  }, []);

  useEffect(() => {
    return () => clearUndoTimer();
  }, [clearUndoTimer]);

  return (
    <TaskContext.Provider
      value={{
        lists,
        isLoading,
        pendingUndo,
        createList,
        renameList,
        deleteList,
        getList,
        addTask,
        updateTask,
        deleteTask,
        reorderTasks,
        undoDelete,
        dismissUndo,
      }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
