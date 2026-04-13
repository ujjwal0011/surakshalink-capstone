import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const PROGRESS_PREFIX = 'quiz_progress_';
const SUBMIT_QUEUE_KEY = 'quiz_submit_queue';
const STALE_HOURS = 24;

/**
 * useQuizPersistence — Handles offline resilience for quiz-taking.
 *
 * Features:
 * - Auto-saves quiz progress (answers, bookmarks, timer, current question) to localStorage
 * - Restores progress on page refresh / remount
 * - Queues failed submissions for retry when back online
 * - Tracks online/offline status
 * - Pauses timer when offline (lenient mode)
 *
 * @param {string} quizId
 */
export const useQuizPersistence = (quizId) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  const retryTimeoutRef = useRef(null);

  const storageKey = `${PROGRESS_PREFIX}${quizId}`;

  // --- Online/Offline detection ---
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      toast.success('🟢 Connection restored!', { duration: 3000 });
      retryPendingSubmissions();
    };
    const goOffline = () => {
      setIsOnline(false);
      toast.error('🔴 You are offline! Your progress is saved locally.', { duration: 5000, icon: '📡' });
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  // --- Check for saved progress on mount ---
  useEffect(() => {
    if (!quizId) return;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Check staleness
        const savedAt = new Date(parsed.savedAt);
        const hoursSince = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSince < STALE_HOURS) {
          setHasSavedProgress(true);
          setSavedProgress(parsed);
        } else {
          // Stale — clean up
          localStorage.removeItem(storageKey);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    // Also clean up any stale progress from other quizzes on load
    cleanupStaleProgress();
  }, [quizId]);

  // --- Save progress to localStorage ---
  const saveProgress = useCallback((state) => {
    if (!quizId) return;
    const data = {
      quizId,
      answers: state.answers,
      bookmarks: Array.from(state.bookmarks || []),
      currentQuestionIndex: state.currentQuestionIndex,
      timeLeft: state.timeLeft,
      violations: state.violations || 0,
      startedAt: state.startedAt || new Date().toISOString(),
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // localStorage full or unavailable — silent fail
    }
  }, [quizId, storageKey]);

  // --- Load saved progress ---
  const loadProgress = useCallback(() => {
    return savedProgress;
  }, [savedProgress]);

  // --- Clear progress (after successful submit) ---
  const clearProgress = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasSavedProgress(false);
    setSavedProgress(null);
  }, [storageKey]);

  // --- Dismiss saved progress (start fresh) ---
  const dismissSavedProgress = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasSavedProgress(false);
    setSavedProgress(null);
  }, [storageKey]);

  // --- Queue a failed submission for retry ---
  const queueSubmission = useCallback((payload) => {
    try {
      const raw = localStorage.getItem(SUBMIT_QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      // Avoid duplicates for same quiz
      const filtered = queue.filter(q => q.quizId !== payload.quizId);
      filtered.push({ ...payload, queuedAt: new Date().toISOString() });
      localStorage.setItem(SUBMIT_QUEUE_KEY, JSON.stringify(filtered));
    } catch {
      // silent fail
    }
  }, []);

  // --- Retry pending submissions ---
  const retryPendingSubmissions = useCallback(async () => {
    try {
      const raw = localStorage.getItem(SUBMIT_QUEUE_KEY);
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (queue.length === 0) return;

      const remaining = [];
      for (const payload of queue) {
        try {
          await api.post('/quiz/submit', payload);
          toast.success('📤 Pending quiz submitted successfully!', { duration: 4000 });
          // Clear the saved progress for this quiz too
          localStorage.removeItem(`${PROGRESS_PREFIX}${payload.quizId}`);
        } catch {
          remaining.push(payload);
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem(SUBMIT_QUEUE_KEY, JSON.stringify(remaining));
      } else {
        localStorage.removeItem(SUBMIT_QUEUE_KEY);
      }
    } catch {
      // silent fail
    }
  }, []);

  // --- Cleanup stale progress from all quizzes ---
  const cleanupStaleProgress = useCallback(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PROGRESS_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            const hoursSince = (Date.now() - new Date(parsed.savedAt).getTime()) / (1000 * 60 * 60);
            if (hoursSince >= STALE_HOURS) {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch {
      // silent fail
    }
  }, []);

  return {
    isOnline,
    hasSavedProgress,
    savedProgress,
    saveProgress,
    loadProgress,
    clearProgress,
    dismissSavedProgress,
    queueSubmission,
    retryPendingSubmissions,
  };
};
