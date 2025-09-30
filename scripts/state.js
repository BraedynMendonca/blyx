const STORAGE_KEY = 'blyx-state-v2';

const clone = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const defaultState = {
  session: {
    status: 'idle',
    plannedMinutes: 25,
    remainingSeconds: 25 * 60,
    startedAt: null,
    pausedAt: null,
    streakCount: 0,
    coinsEarned: 0,
    treeStage: 'Seedling',
  },
  stats: {
    dailyFocusMinutes: 0,
    sessionsCompleted: 0,
    coins: 0,
    streak: 0,
    lastCompletion: null,
  },
  forest: [],
  settings: {
    theme: 'forest',
    reducedMotion: false,
    dyslexiaFont: false,
    showQuotes: true,
  },
  notes: '',
  weather: {
    zip: '94105',
    cachedAt: 0,
    temperature: null,
    condition: null,
  },
  chat: {
    messages: [],
  },
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(defaultState);
    const parsed = JSON.parse(raw);
    return { ...clone(defaultState), ...parsed };
  } catch (error) {
    console.warn('Failed to load stored state', error);
    return clone(defaultState);
  }
}

const state = loadState();
const listeners = new Set();
let saveScheduled = false;

function persistSoon() {
  if (saveScheduled) return;
  saveScheduled = true;
  queueMicrotask(() => {
    saveScheduled = false;
    try {
      const payload = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, payload);
    } catch (error) {
      console.warn('Failed to persist state', error);
    }
  });
}

function notify() {
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (error) {
      console.error('State listener failed', error);
    }
  });
}

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateSession(updater) {
  const next = updater({ ...state.session });
  state.session = { ...state.session, ...next };
  persistSoon();
  notify();
}

export function updateSettings(updater) {
  const next = updater({ ...state.settings });
  state.settings = { ...state.settings, ...next };
  persistSoon();
  notify();
}

export function updateStats(updater) {
  const next = updater({ ...state.stats });
  state.stats = { ...state.stats, ...next };
  persistSoon();
  notify();
}

export function setForest(entries) {
  state.forest = entries.slice(0, 50);
  persistSoon();
  notify();
}

export function setNotes(content) {
  state.notes = content;
  persistSoon();
  notify();
}

export function setWeather(data) {
  state.weather = { ...state.weather, ...data };
  persistSoon();
  notify();
}

export function pushChatMessage(message) {
  state.chat.messages = [...state.chat.messages.slice(-20), message];
  persistSoon();
  notify();
}

export function replaceChatMessages(messages) {
  state.chat.messages = messages;
  persistSoon();
  notify();
}

export function resetState() {
  Object.assign(state, clone(defaultState));
  persistSoon();
  notify();
}
