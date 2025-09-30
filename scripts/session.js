import {
  getState,
  updateSession,
  updateStats,
  setForest,
} from './state.js';

let timerId = null;

const TREE_STAGES = [
  { threshold: 0, label: 'Seedling' },
  { threshold: 25, label: 'Sapling' },
  { threshold: 50, label: 'Growing' },
  { threshold: 75, label: 'Blooming' },
  { threshold: 95, label: 'Flourishing' },
];

function determineTreeStage(progress) {
  for (let i = TREE_STAGES.length - 1; i >= 0; i -= 1) {
    if (progress >= TREE_STAGES[i].threshold) {
      return TREE_STAGES[i].label;
    }
  }
  return TREE_STAGES[0].label;
}

function ensureTimer() {
  if (timerId) return;
  timerId = window.setInterval(() => tick(), 1000);
}

function clearTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function normalizeDailyStats(stats, now) {
  const last = stats.lastCompletion ? new Date(stats.lastCompletion) : null;
  if (!last) {
    return stats;
  }
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (today.getTime() !== lastDay.getTime()) {
    return { ...stats, dailyFocusMinutes: 0, sessionsCompleted: 0 };
  }
  return stats;
}

function handleCompletion() {
  clearTimer();
  const now = new Date();
  const { session, forest, stats } = getState();
  const minutes = session.plannedMinutes;
  const coins = Math.max(5, Math.round(minutes / 5) * 2);
  const entry = {
    id: `${now.toISOString()}-${Math.random().toString(36).slice(2, 8)}`,
    completedAt: now.toISOString(),
    duration: minutes,
    status: 'completed',
    stage: 'Flourishing',
  };

  const normalizedStats = normalizeDailyStats(stats, now);
  const streak = computeStreak(normalizedStats.lastCompletion, now);
  updateStats(() => ({
    ...normalizedStats,
    dailyFocusMinutes: normalizedStats.dailyFocusMinutes + minutes,
    sessionsCompleted: normalizedStats.sessionsCompleted + 1,
    coins: normalizedStats.coins + coins,
    streak,
    lastCompletion: now.toISOString(),
  }));
  setForest([entry, ...forest]);

  updateSession(() => ({
    status: 'completed',
    remainingSeconds: 0,
    coinsEarned: coins,
    treeStage: 'Flourishing',
  }));
}

function computeStreak(lastCompletionISO, now) {
  if (!lastCompletionISO) return 1;
  const last = new Date(lastCompletionISO);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diff = (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24);
  if (diff === 0) {
    return getState().stats.streak;
  }
  if (diff === 1) {
    return getState().stats.streak + 1;
  }
  return 1;
}

function handleFailure() {
  clearTimer();
  const { session, forest } = getState();
  const now = new Date();
  const elapsedSeconds = session.plannedMinutes * 60 - session.remainingSeconds;
  const elapsedMinutes = Math.max(0, Math.round(elapsedSeconds / 60));
  const entry = {
    id: `${now.toISOString()}-${Math.random().toString(36).slice(2, 8)}`,
    completedAt: now.toISOString(),
    duration: elapsedMinutes,
    status: 'failed',
    stage: 'Withered',
  };
  setForest([entry, ...forest]);
  updateSession(() => ({
    status: 'failed',
    treeStage: 'Withered',
  }));
}

function tick() {
  const { session } = getState();
  if (session.status !== 'running') {
    clearTimer();
    return;
  }
  const nextRemaining = Math.max(0, session.remainingSeconds - 1);
  const progress = 100 - Math.round((nextRemaining / (session.plannedMinutes * 60)) * 100);
  const treeStage = determineTreeStage(progress);
  if (nextRemaining <= 0) {
    handleCompletion();
  } else {
    updateSession(() => ({
      remainingSeconds: nextRemaining,
      treeStage,
    }));
  }
}

export function startSession(minutes) {
  const duration = Math.max(5, Math.min(180, Math.round(minutes)));
  const seconds = duration * 60;
  const now = Date.now();
  updateSession(() => ({
    status: 'running',
    plannedMinutes: duration,
    remainingSeconds: seconds,
    startedAt: now,
    pausedAt: null,
    coinsEarned: 0,
    treeStage: 'Seedling',
  }));
  ensureTimer();
}

export function pauseSession() {
  const { session } = getState();
  if (session.status !== 'running') return;
  updateSession(() => ({ status: 'paused', pausedAt: Date.now() }));
  clearTimer();
}

export function resumeSession() {
  const { session } = getState();
  if (session.status !== 'paused') return;
  updateSession(() => ({ status: 'running', pausedAt: null }));
  ensureTimer();
}

export function abortSession() {
  const { session } = getState();
  if (session.status === 'idle') return;
  handleFailure();
}

export function hydrateSession() {
  const { session } = getState();
  if (session.status === 'running') {
    ensureTimer();
  }
}
