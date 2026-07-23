import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Animation, AppTheme, cardShadow } from '@/constants/app-theme';
import { useTasks } from '@/context/TaskContext';
import type { Task } from '@/types/tasks';

const TASK_ROW_MIN_HEIGHT = 52;

function TaskRow({
  item,
  drag,
  isActive,
  onEdit,
  onDelete,
}: {
  item: Task;
  drag: () => void;
  isActive: boolean;
  onEdit: (title: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditTitle(item.title);
    }
  }, [item.title, isEditing]);

  useEffect(() => {
    if (!isEditing) return;

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [isEditing]);

  const startEditing = useCallback(() => {
    setEditTitle(item.title);
    setIsEditing(true);
  }, [item.title]);

  const cancelEditing = useCallback(() => {
    inputRef.current?.blur();
    Keyboard.dismiss();
    setEditTitle(item.title);
    setIsEditing(false);
  }, [item.title]);

  const saveEditing = useCallback(() => {
    const trimmed = editTitle.trim();
    inputRef.current?.blur();
    Keyboard.dismiss();

    if (!trimmed) {
      setEditTitle(item.title);
      setIsEditing(false);
      return;
    }

    onEdit(trimmed);
    setIsEditing(false);
  }, [editTitle, item.title, onEdit]);

  return (
    <View style={styles.taskItemWrapper}>
      <View style={[styles.taskRow, isActive && styles.taskRowActive]}>
        <Pressable
          onLongPress={isEditing ? undefined : drag}
          delayLongPress={Animation.longPressDelay}
          disabled={isEditing}
          style={styles.dragHandle}>
          <Ionicons
            name="reorder-three"
            size={24}
            color={isEditing ? AppTheme.border : AppTheme.textSecondary}
          />
        </Pressable>

        {isEditing ? (
          <TextInput
            ref={inputRef}
            autoFocus
            style={styles.taskTitleInput}
            value={editTitle}
            onChangeText={setEditTitle}
            onSubmitEditing={saveEditing}
            blurOnSubmit={false}
            returnKeyType="done"
            selectTextOnFocus
          />
        ) : (
          <Text style={styles.taskTitle} numberOfLines={2}>
            {item.title}
          </Text>
        )}

        {isEditing ? (
          <>
            <Pressable
              onPress={saveEditing}
              hitSlop={8}
              style={({ pressed }) => [styles.iconAction, pressed && styles.iconActionPressed]}>
              <Ionicons name="checkmark" size={22} color={AppTheme.primary} />
            </Pressable>
            <Pressable
              onPress={cancelEditing}
              hitSlop={8}
              style={({ pressed }) => [styles.iconAction, pressed && styles.iconActionPressed]}>
              <Ionicons name="close" size={22} color={AppTheme.textSecondary} />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={startEditing}
              hitSlop={8}
              style={({ pressed }) => [styles.iconAction, pressed && styles.iconActionPressed]}>
              <Ionicons name="pencil" size={20} color={AppTheme.primary} />
            </Pressable>
            <Pressable
              onPress={onDelete}
              hitSlop={8}
              style={({ pressed }) => [styles.iconAction, pressed && styles.iconActionPressed]}>
              <Ionicons name="close-circle" size={22} color={AppTheme.danger} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

export default function TaskListScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoading, getList, addTask, updateTask, deleteTask, reorderTasks } = useTasks();
  const [newTask, setNewTask] = useState('');

  const list = id ? getList(id) : undefined;

  const handleAdd = useCallback(() => {
    if (!id) return;
    const trimmed = newTask.trim();
    if (!trimmed) return;
    addTask(id, trimmed);
    setNewTask('');
    Keyboard.dismiss();
  }, [id, newTask, addTask]);

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Task>) => (
      <TaskRow
        item={item}
        drag={drag}
        isActive={isActive}
        onEdit={(title) => id && updateTask(id, item.id, title)}
        onDelete={() => id && deleteTask(id, item.id)}
      />
    ),
    [id, updateTask, deleteTask],
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppTheme.primary} />
      </View>
    );
  }

  if (!list) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={48} color={AppTheme.textSecondary} />
          <Text style={styles.notFoundText}>List not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={AppTheme.text} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{list.title}</Text>
        <Text style={styles.headerSubtitle}>
          {list.tasks.length === 1 ? '1 task' : `${list.tasks.length} tasks`}
        </Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task..."
          placeholderTextColor={AppTheme.textSecondary}
          value={newTask}
          onChangeText={setNewTask}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable
          onPress={handleAdd}
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      {list.tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkbox-outline" size={48} color={AppTheme.primary} />
          <Text style={styles.emptyTitle}>No tasks yet</Text>
          <Text style={styles.emptyText}>Add a task above to get started</Text>
          <Text style={styles.dragHint}>Long-press and drag to reorder tasks</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={list.tasks}
          keyExtractor={(item) => item.id}
          onDragEnd={({ data }) => id && reorderTasks(id, data)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          animationConfig={Animation.dragSpring}
          autoscrollSpeed={200}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: AppTheme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    paddingHorizontal: AppTheme.spacing.sm,
    paddingTop: AppTheme.spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: AppTheme.spacing.sm,
    paddingHorizontal: 11,
    alignSelf: 'flex-start',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backLabel: {
    fontSize: 16,
    color: AppTheme.text,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: AppTheme.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: AppTheme.textSecondary,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: AppTheme.spacing.md,
    gap: AppTheme.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: AppTheme.card,
    borderRadius: AppTheme.radius,
    paddingHorizontal: AppTheme.spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: AppTheme.text,
    borderWidth: 1,
    borderColor: AppTheme.border,
    ...cardShadow,
  },
  addButton: {
    backgroundColor: AppTheme.primary,
    borderRadius: AppTheme.radius,
    paddingHorizontal: AppTheme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: AppTheme.spacing.md,
    paddingTop: 16,
    paddingBottom: 100,
  },
  taskItemWrapper: {
    marginBottom: 6,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppTheme.card,
    borderRadius: AppTheme.radius,
    paddingVertical: 10,
    paddingHorizontal: AppTheme.spacing.xs,
    minHeight: TASK_ROW_MIN_HEIGHT,
    ...cardShadow,
  },
  taskRowActive: {
    shadowOpacity: 0.08,
    shadowRadius: 9,
    elevation: 4,
  },
  dragHandle: {
    padding: AppTheme.spacing.sm,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    color: AppTheme.text,
    lineHeight: 22,
    paddingLeft: 6,
  },
  taskTitleInput: {
    flex: 1,
    fontSize: 16,
    color: AppTheme.text,
    lineHeight: 22,
    paddingVertical: 0,
    margin: 0,
    backgroundColor: 'transparent',
  },
  iconAction: {
    padding: AppTheme.spacing.sm,
  },
  iconActionPressed: {
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppTheme.spacing.xl,
    paddingBottom: 80,
    gap: AppTheme.spacing.sm,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AppTheme.text,
    marginTop: AppTheme.spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    color: AppTheme.textSecondary,
    textAlign: 'center',
  },
  dragHint: {
    fontSize: 13,
    color: AppTheme.textSecondary,
    marginTop: AppTheme.spacing.md,
    fontStyle: 'italic',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppTheme.spacing.md,
  },
  notFoundText: {
    fontSize: 18,
    color: AppTheme.textSecondary,
  },
  backLink: {
    padding: AppTheme.spacing.md,
  },
  backLinkText: {
    color: AppTheme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
