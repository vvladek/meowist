import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTheme, cardShadow, listItemSpacing } from '@/constants/app-theme';
import { useTasks } from '@/context/TaskContext';
import type { TaskList } from '@/types/tasks';

function ListCard({
  item,
  onPress,
  onRename,
  onDelete,
}: {
  item: TaskList;
  onPress: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const inputRef = useRef<TextInput>(null);
  const taskCount = item.tasks.length;
  const taskLabel = taskCount === 1 ? '1 task' : `${taskCount} tasks`;

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

    onRename(trimmed);
    setIsEditing(false);
  }, [editTitle, item.title, onRename]);

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        onPress={isEditing ? undefined : onPress}
        style={({ pressed }) => [styles.card, !isEditing && pressed && styles.cardPressed]}>
        <View style={styles.cardIcon}>
          <Ionicons name="list" size={22} color={AppTheme.primary} />
        </View>
        <View style={styles.cardContent}>
          {isEditing ? (
            <TextInput
              ref={inputRef}
              autoFocus
              style={styles.cardTitleInput}
              value={editTitle}
              onChangeText={setEditTitle}
              onSubmitEditing={saveEditing}
              blurOnSubmit={false}
              returnKeyType="done"
              selectTextOnFocus
            />
          ) : (
            <Text style={styles.cardTitle}>{item.title}</Text>
          )}
          <Text style={styles.cardSubtitle}>{taskLabel}</Text>
        </View>
        {isEditing ? (
          <>
            <Pressable
              onPress={saveEditing}
              hitSlop={8}
              style={({ pressed }) => [styles.editAction, pressed && styles.editActionPressed]}>
              <Ionicons name="checkmark" size={20} color={AppTheme.primary} />
            </Pressable>
            <Pressable
              onPress={cancelEditing}
              hitSlop={8}
              style={({ pressed }) => [styles.editAction, pressed && styles.editActionPressed]}>
              <Ionicons name="close" size={20} color={AppTheme.textSecondary} />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={startEditing}
              hitSlop={12}
              style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}>
              <Ionicons name="pencil" size={18} color={AppTheme.primary} />
            </Pressable>
            <Pressable
              onPress={onDelete}
              hitSlop={12}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]}>
              <Ionicons name="trash-outline" size={20} color={AppTheme.danger} />
            </Pressable>
            {/* <Ionicons name="chevron-forward" size={20} color={AppTheme.textSecondary} /> */}
          </>
        )}
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { lists, isLoading, createList, renameList, deleteList } = useTasks();
  const [newTitle, setNewTitle] = useState('');

  const handleCreate = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    createList(trimmed);
    setNewTitle('');
    Keyboard.dismiss();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppTheme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Lists</Text>
        <Text style={styles.headerSubtitle}>Organize your tasks by category</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="New list title..."
          placeholderTextColor={AppTheme.textSecondary}
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={handleCreate}
          returnKeyType="done"
        />
        <Pressable
          onPress={handleCreate}
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {lists.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="folder-open-outline" size={48} color={AppTheme.primary} />
          </View>
          <Text style={styles.emptyTitle}>No lists yet</Text>
          <Text style={styles.emptyText}>Create your first list to get started</Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <ListCard
              item={item}
              onPress={() => router.push({ pathname: '/list/[id]', params: { id: item.id } })}
              onRename={(title) => renameList(item.id, title)}
              onDelete={() => deleteList(item.id)}
            />
          )}
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
  header: {
    paddingHorizontal: AppTheme.spacing.md,
    paddingTop: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.md,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: AppTheme.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
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
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  listContent: {
    paddingHorizontal: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl,
    paddingTop: 16,
  },
  cardWrapper: {
    marginBottom: listItemSpacing,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppTheme.card,
    borderRadius: AppTheme.radius,
    padding: 14,
    gap: AppTheme.spacing.sm,
    minHeight: 76,
    ...cardShadow,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardIcon: {
    width: 35,
    height: 35,
    borderRadius: AppTheme.radiusSm,
    backgroundColor: AppTheme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: AppTheme.text,
    lineHeight: 22,
  },
  cardTitleInput: {
    fontSize: 17,
    fontWeight: '600',
    color: AppTheme.text,
    lineHeight: 22,
    paddingVertical: 0,
    margin: 0,
    backgroundColor: 'transparent',
  },
  cardSubtitle: {
    fontSize: 13,
    color: AppTheme.textSecondary,
    marginTop: 2,
  },
  editButton: {
    padding: AppTheme.spacing.sm,
    borderRadius: AppTheme.radiusSm,
    backgroundColor: AppTheme.primaryLight,
  },
  editButtonPressed: {
    opacity: 0.7,
  },
  editAction: {
    padding: AppTheme.spacing.sm,
    borderRadius: AppTheme.radiusSm,
  },
  editActionPressed: {
    opacity: 0.7,
  },
  deleteButton: {
    padding: AppTheme.spacing.sm,
    borderRadius: AppTheme.radiusSm,
    backgroundColor: AppTheme.dangerLight,
  },
  deletePressed: {
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppTheme.spacing.xl,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: AppTheme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppTheme.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AppTheme.text,
    marginBottom: AppTheme.spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    color: AppTheme.textSecondary,
    textAlign: 'center',
  },
});
