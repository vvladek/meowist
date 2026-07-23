import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TaskList } from '@/types/tasks';

const STORAGE_KEY = '@meowist_task_lists';

export async function loadLists(): Promise<TaskList[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TaskList[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveLists(lists: TaskList[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
}
