import { supabase } from '../supabase';
import { User, ExerciseSession, LevelProgress } from '../types';

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  lastSyncedAt: Date | null;
  message?: string;
}

/**
 * Normalizes user data fetched from Supabase to ensure safe arrays and objects.
 */
export const normalizeUserData = (raw: any): User => {
  return {
    ra: raw.ra,
    name: raw.name || '',
    completedLessons: Array.isArray(raw.completedLessons) ? raw.completedLessons : [],
    avatarColor: raw.avatarColor || 'bg-blue-600',
    totalXP: typeof raw.totalXP === 'number' ? raw.totalXP : parseInt(raw.totalXP as any) || 0,
    exerciseProgress: raw.exerciseProgress && typeof raw.exerciseProgress === 'object' ? raw.exerciseProgress : {},
    listProgress: raw.listProgress && typeof raw.listProgress === 'object' ? raw.listProgress : {},
    isRankVisible: raw.isRankVisible !== false
  };
};

/**
 * Calculates correct mathematical totalXP based on completed lessons (10 XP each)
 * and exercise scores.
 */
export const calculateTotalXP = (user: User): number => {
  let xp = 0;
  if (Array.isArray(user.completedLessons)) {
    xp += user.completedLessons.length * 10;
  }
  if (user.exerciseProgress) {
    Object.entries(user.exerciseProgress).forEach(([key, val]) => {
      if (key === '_session_history') {
        try {
          const sessions: ExerciseSession[] = JSON.parse(val);
          if (Array.isArray(sessions)) {
            sessions.forEach(s => {
              if (s.xpEarned && s.xpEarned > 0) {
                // Exercise session XP is tracked
              }
            });
          }
        } catch {
          // ignore
        }
      } else if (val && typeof val === 'object' && 'score' in val) {
        const lp = val as LevelProgress;
        if (lp.score > 0) {
          xp += Math.round(lp.score / 10);
        }
      }
    });
  }
  // Ensure we don't downgrade XP if user earned bonus/session XP
  return Math.max(user.totalXP || 0, xp);
};

/**
 * Fetches fresh user data directly from Supabase table 'users'.
 */
export const fetchServerUser = async (ra: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('ra', ra)
      .limit(1);

    if (error) {
      console.error('[SyncService] Erro ao buscar usuário remoto:', error);
      return null;
    }

    if (data && data.length > 0) {
      return normalizeUserData(data[0]);
    }
    return null;
  } catch (err) {
    console.error('[SyncService] Falha de rede ao buscar usuário:', err);
    return null;
  }
};

/**
 * Merges local and remote exercise sessions without duplicating.
 */
export const mergeSessionHistories = (
  localProgress?: Record<string, any>,
  serverProgress?: Record<string, any>
): Record<string, any> => {
  const merged: Record<string, any> = {
    ...(serverProgress || {}),
    ...(localProgress || {})
  };

  const parseHistory = (prog?: Record<string, any>): ExerciseSession[] => {
    try {
      const raw = prog?._session_history;
      if (!raw) return [];
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const localSessions = parseHistory(localProgress);
  const serverSessions = parseHistory(serverProgress);

  if (localSessions.length === 0 && serverSessions.length === 0) {
    return merged;
  }

  // Map by session ID, prefer completed sessions or the one with latest lastActiveIndex / answers
  const sessionMap = new Map<string, ExerciseSession>();

  serverSessions.forEach(s => {
    if (s && s.id) sessionMap.set(s.id, s);
  });

  localSessions.forEach(s => {
    if (!s || !s.id) return;
    const existing = sessionMap.get(s.id);
    if (!existing) {
      sessionMap.set(s.id, s);
    } else {
      // If one is completed and other is not, keep completed
      if (s.isCompleted && !existing.isCompleted) {
        sessionMap.set(s.id, s);
      } else {
        // Keep the one with more answered questions
        const localAnswers = Object.keys(s.answers || {}).length;
        const existingAnswers = Object.keys(existing.answers || {}).length;
        if (localAnswers >= existingAnswers) {
          sessionMap.set(s.id, s);
        }
      }
    }
  });

  const mergedSessions = Array.from(sessionMap.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  merged._session_history = JSON.stringify(mergedSessions);
  return merged;
};

/**
 * Safe toggling of a lesson's completed status.
 * Fetches the latest database state first to prevent overwriting lessons completed on another device,
 * then updates the database, updates localStorage, and notifies cross-tab channels.
 */
export const toggleLessonProgressSafely = async (
  currentUser: User,
  lessonId: string
): Promise<User> => {
  // 1. Fetch latest server state
  const serverUser = await fetchServerUser(currentUser.ra);
  const baseUser = serverUser || currentUser;

  const currentCompleted = Array.isArray(baseUser.completedLessons)
    ? [...baseUser.completedLessons]
    : [];

  const isCompleted = currentCompleted.includes(lessonId);
  let nextCompleted: string[];

  if (isCompleted) {
    // User wants to uncheck
    nextCompleted = currentCompleted.filter(id => id !== lessonId);
  } else {
    // User wants to complete
    nextCompleted = Array.from(new Set([...currentCompleted, lessonId]));
  }

  // Recalculate XP
  const xpDifference = isCompleted ? -10 : 10;
  const nextTotalXP = Math.max(0, (baseUser.totalXP || 0) + xpDifference);

  const updatedUser: User = {
    ...baseUser,
    completedLessons: nextCompleted,
    totalXP: nextTotalXP
  };

  // 2. Persist to Supabase
  try {
    const { error } = await supabase
      .from('users')
      .update({
        completedLessons: nextCompleted,
        totalXP: nextTotalXP
      })
      .eq('ra', updatedUser.ra);

    if (error) {
      console.error('[SyncService] Erro ao salvar aula no Supabase:', error);
    }
  } catch (err) {
    console.error('[SyncService] Falha de conexão ao salvar aula:', err);
  }

  // 3. Update localStorage and broadcast to other tabs on the same machine
  saveUserToLocalAndBroadcast(updatedUser);

  return updatedUser;
};

/**
 * Saves user to localStorage and dispatches cross-tab broadcast.
 */
export const saveUserToLocalAndBroadcast = (user: User) => {
  try {
    localStorage.setItem('medferpa_user', JSON.stringify(user));
    localStorage.setItem('medferpa_last_synced', new Date().toISOString());

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('medferpa_sync_channel');
      bc.postMessage({ type: 'USER_UPDATED', user, timestamp: Date.now() });
      bc.close();
    }
  } catch (e) {
    console.error('[SyncService] Erro ao salvar localmente:', e);
  }
};
