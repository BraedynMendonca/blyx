import {
  getState,
  subscribe,
  updateSettings,
  setNotes,
  setWeather,
  pushChatMessage,
} from './state.js';
import { startSession, pauseSession, resumeSession, abortSession, hydrateSession } from './session.js';
import { QUOTES } from './quotes.js';
import { summarizeText } from './summarizer.js';
import { createChatReply } from './chatbot.js';

const clockElement = document.getElementById('header-clock');
const dateElement = document.getElementById('header-date');
const sessionStateElement = document.getElementById('session-state');
const focusStatusElement = document.getElementById('focus-status');
const timerDisplayElement = document.getElementById('timer-display');
const timerMessageElement = document.getElementById('timer-message');
const timerProgressElement = document.getElementById('timer-progress');
const treeStageElement = document.getElementById('tree-stage');
const treeVisualElement = document.getElementById('tree-visual');
const forestGridElement = document.getElementById('forest-grid');
const quoteTickerElement = document.getElementById('quote-ticker');
const quoteToggleElement = document.getElementById('toggle-quote-visibility');
const presetSelect = document.getElementById('preset-select');
const customDurationInput = document.getElementById('custom-duration');
const startButton = document.getElementById('start-session');
const pauseButton = document.getElementById('pause-session');
const abortButton = document.getElementById('abort-session');
const themeSwatchesElement = document.getElementById('theme-swatches');
const reducedMotionToggle = document.getElementById('toggle-reduced-motion');
const dyslexiaToggle = document.getElementById('toggle-dyslexia');
const quotesToggle = document.getElementById('toggle-quotes');
const ambientIndicator = document.getElementById('ambient-indicator');
const weatherForm = document.getElementById('weather-form');
const zipInput = document.getElementById('zip-input');
const weatherTemp = document.getElementById('weather-temp');
const weatherCondition = document.getElementById('weather-condition');
const weatherError = document.getElementById('weather-error');
const notebookTextarea = document.getElementById('notebook');
const notebookStatus = document.getElementById('notebook-status');
const exportNotesButton = document.getElementById('export-notes');
const summarizerInput = document.getElementById('summarizer-input');
const summarizeButton = document.getElementById('summarize-button');
const summaryOutput = document.getElementById('summary-output');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatThread = document.getElementById('chat-thread');
const calculatorModal = document.getElementById('calculator-modal');
const openCalculatorButton = document.getElementById('open-calculator');
const closeCalculatorButton = document.getElementById('close-calculator');
const calculatorButtons = document.getElementById('calculator-buttons');
const calculatorInput = document.getElementById('calculator-input');
const calculatorOutput = document.getElementById('calculator-output');
const focusNotebookButton = document.getElementById('focus-notebook');
const focusSummarizerButton = document.getElementById('focus-summarizer');
const statMinutes = document.getElementById('stat-minutes');
const statSessions = document.getElementById('stat-sessions');
const statCoins = document.getElementById('stat-coins');
const statStreak = document.getElementById('stat-streak');
const spotifyConnectButton = document.getElementById('connect-spotify');
const spotifyControls = document.getElementById('spotify-controls');

let notebookSaveTimer = null;
let quoteIndex = 0;
let quoteIntervalId = null;
let calculatorExpression = '';
let spotifyConnected = false;

const THEMES = ['forest', 'dawn', 'midnight', 'ember', 'glacier'];

function initializeClock() {
  const update = () => {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    dateElement.textContent = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };
  update();
  setInterval(update, 1000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function renderSession(state) {
  const { session } = state;
  sessionStateElement.textContent = session.status.charAt(0).toUpperCase() + session.status.slice(1);
  focusStatusElement.textContent = sessionStateElement.textContent;
  timerDisplayElement.textContent = formatTime(session.remainingSeconds);
  const progress = Math.min(100, Math.round(((session.plannedMinutes * 60 - session.remainingSeconds) / (session.plannedMinutes * 60)) * 100));
  timerProgressElement.value = progress;
  timerProgressElement.textContent = `${progress}%`;
  treeStageElement.textContent = session.treeStage;

  const statusMessage = {
    idle: 'Select a duration and plant your focus tree.',
    running: 'Your tree is growing. Stay in the zone!',
    paused: 'Session paused. Resume soon to keep the streak alive.',
    completed: `You grew a tree! +${session.coinsEarned} coins`,
    failed: 'The tree withered. Try again when you are ready.',
  }[session.status];
  timerMessageElement.textContent = statusMessage;

  startButton.disabled = session.status === 'running' || session.status === 'paused';
  pauseButton.disabled = session.status === 'idle' || session.status === 'completed' || session.status === 'failed';
  abortButton.disabled = session.status === 'idle' || session.status === 'completed' || session.status === 'failed';
  pauseButton.textContent = session.status === 'paused' ? 'Resume' : 'Pause';

  renderTree(progress, session.treeStage);
}

function renderTree(progress, stage) {
  const growth = Math.max(10, Math.min(100, progress));
  treeVisualElement.innerHTML = '';
  const trunk = document.createElement('div');
  trunk.className = 'tree-trunk';
  const canopy = document.createElement('div');
  canopy.className = 'tree-canopy';
  canopy.style.setProperty('--progress', `${growth}%`);
  canopy.dataset.stage = stage;
  treeVisualElement.appendChild(canopy);
  treeVisualElement.appendChild(trunk);
}

function renderForest(state) {
  forestGridElement.innerHTML = '';
  const entries = state.forest.slice(0, 9);
  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'Grow a tree to see it appear here.';
    forestGridElement.appendChild(empty);
    return;
  }
  entries.forEach((entry) => {
    const card = document.createElement('div');
    const statusClass = entry.status === 'failed' ? ' failed' : '';
    card.className = `forest-card${statusClass}`;
    const duration = `${entry.duration} min`;
    const date = new Date(entry.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    card.innerHTML = `
      <strong>${entry.stage}</strong>
      <span>${duration}</span>
      <time>${date}</time>
    `;
    forestGridElement.appendChild(card);
  });
}

function renderStats(state) {
  const { stats } = state;
  statMinutes.textContent = stats.dailyFocusMinutes;
  statSessions.textContent = stats.sessionsCompleted;
  statCoins.textContent = stats.coins;
  statStreak.textContent = stats.streak;
}

function renderNotes(state) {
  if (document.activeElement !== notebookTextarea) {
    notebookTextarea.value = state.notes;
  }
}

function renderWeather(state) {
  const { weather } = state;
  zipInput.value = weather.zip ?? '';
  if (weather.temperature != null && weather.condition) {
    weatherTemp.textContent = `${weather.temperature}°F`;
    weatherCondition.textContent = weather.condition;
    weatherError.hidden = true;
  }
}

function renderSettings(state) {
  const { settings } = state;
  document.body.setAttribute('data-theme', settings.theme);
  document.body.setAttribute('data-reduced-motion', settings.reducedMotion ? 'true' : 'false');
  document.body.style.fontFamily = settings.dyslexiaFont
    ? 'Atkinson Hyperlegible, "OpenDyslexic", system-ui'
    : "'Inter', system-ui";
  reducedMotionToggle.checked = settings.reducedMotion;
  dyslexiaToggle.checked = settings.dyslexiaFont;
  quotesToggle.checked = settings.showQuotes;
  renderThemeSwatches(settings.theme);
  quoteToggleElement.textContent = settings.showQuotes ? 'Pause' : 'Resume';
  if (!settings.showQuotes) {
    stopQuoteTicker();
    quoteTickerElement.textContent = 'Quotes are paused.';
  } else if (!quoteIntervalId) {
    startQuoteTicker();
  }
}

function renderThemeSwatches(activeTheme) {
  themeSwatchesElement.innerHTML = '';
  THEMES.forEach((theme) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `theme-dot${theme === activeTheme ? ' active' : ''}`;
    button.dataset.theme = theme;
    button.title = `Switch to ${theme} theme`;
    button.addEventListener('click', () => {
      updateSettings(() => ({ theme }));
    });
    themeSwatchesElement.appendChild(button);
  });
}

function renderQuotes(state) {
  if (!state.settings.showQuotes) return;
  const quote = QUOTES[quoteIndex % QUOTES.length];
  quoteTickerElement.innerHTML = `<blockquote>“${quote.text}”<cite>— ${quote.author}</cite></blockquote>`;
}

function startQuoteTicker() {
  renderQuotes(getState());
  if (quoteIntervalId) return;
  quoteIntervalId = window.setInterval(() => {
    quoteIndex = (quoteIndex + 1) % QUOTES.length;
    renderQuotes(getState());
  }, 15000);
}

function stopQuoteTicker() {
  if (quoteIntervalId) {
    clearInterval(quoteIntervalId);
    quoteIntervalId = null;
  }
}

function renderChat(state) {
  chatThread.innerHTML = '';
  state.chat.messages.forEach((message) => {
    const item = document.createElement('div');
    item.className = `chat-message ${message.role}`;
    const text = document.createElement('p');
    text.textContent = message.content;
    const time = document.createElement('time');
    time.dateTime = message.createdAt;
    time.textContent = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    item.append(text, time);
    chatThread.appendChild(item);
  });
  chatThread.scrollTop = chatThread.scrollHeight;
}

function renderAmbient(state) {
  const now = new Date();
  const hour = now.getHours();
  const { weather } = state;
  const isDay = hour >= 6 && hour < 18;
  ambientIndicator.dataset.time = isDay ? 'day' : 'night';
  ambientIndicator.dataset.condition = weather.condition?.toLowerCase().includes('rain') ? 'rainy' : 'clear';
}

function handleStateChange(state) {
  renderSession(state);
  renderForest(state);
  renderStats(state);
  renderNotes(state);
  renderWeather(state);
  renderSettings(state);
  renderQuotes(state);
  renderChat(state);
  renderAmbient(state);
}

function handleStartSession() {
  const value = presetSelect.value;
  if (value === 'custom') {
    const custom = Number(customDurationInput.value);
    if (!custom || Number.isNaN(custom)) {
      customDurationInput.focus();
      return;
    }
    startSession(custom);
  } else {
    startSession(Number(value));
  }
}

function handlePauseOrResume() {
  const { session } = getState();
  if (session.status === 'running') {
    pauseSession();
  } else if (session.status === 'paused') {
    resumeSession();
  }
}

function handleAbort() {
  abortSession();
}

function setupSessionControls() {
  startButton.addEventListener('click', handleStartSession);
  pauseButton.addEventListener('click', handlePauseOrResume);
  abortButton.addEventListener('click', handleAbort);
  presetSelect.addEventListener('change', () => {
    customDurationInput.classList.toggle('hidden', presetSelect.value !== 'custom');
    if (presetSelect.value !== 'custom') {
      customDurationInput.value = '';
    } else {
      customDurationInput.focus();
    }
  });
}

function setupThemeToggles() {
  reducedMotionToggle.addEventListener('change', () => {
    updateSettings(() => ({ reducedMotion: reducedMotionToggle.checked }));
  });
  dyslexiaToggle.addEventListener('change', () => {
    updateSettings(() => ({ dyslexiaFont: dyslexiaToggle.checked }));
  });
  quotesToggle.addEventListener('change', () => {
    updateSettings(() => ({ showQuotes: quotesToggle.checked }));
  });
  quoteToggleElement.addEventListener('click', () => {
    const { settings } = getState();
    updateSettings(() => ({ showQuotes: !settings.showQuotes }));
    quoteToggleElement.textContent = settings.showQuotes ? 'Resume' : 'Pause';
  });
}

function setupNotebook() {
  notebookTextarea.addEventListener('input', () => {
    notebookStatus.textContent = 'Saving…';
    if (notebookSaveTimer) {
      clearTimeout(notebookSaveTimer);
    }
    notebookSaveTimer = setTimeout(() => {
      setNotes(notebookTextarea.value);
      notebookStatus.textContent = 'Saved';
    }, 300);
  });
  exportNotesButton.addEventListener('click', () => {
    const blob = new Blob([notebookTextarea.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blyx-notes-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  });
}

function setupSummarizer() {
  summarizeButton.addEventListener('click', () => {
    const bullets = summarizeText(summarizerInput.value);
    summaryOutput.innerHTML = '';
    if (bullets.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'Nothing to summarize yet.';
      summaryOutput.appendChild(empty);
      return;
    }
    bullets.forEach((line) => {
      const item = document.createElement('li');
      item.textContent = line;
      summaryOutput.appendChild(item);
    });
  });
}

function setupQuotes() {
  startQuoteTicker();
}

async function fetchWeather(zip) {
  try {
    weatherError.hidden = true;
    weatherCondition.textContent = 'Fetching…';
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(zip)}&count=1&language=en&format=json`);
    const geoData = await geoResponse.json();
    if (!geoData?.results?.length) {
      throw new Error('Location not found');
    }
    const { latitude, longitude, name } = geoData.results[0];
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
    );
    const weatherJson = await weatherResponse.json();
    if (!weatherJson?.current_weather) {
      throw new Error('Weather unavailable');
    }
    const tempC = weatherJson.current_weather.temperature;
    const temperature = Math.round((tempC * 9) / 5 + 32);
    const condition = mapWeatherCode(weatherJson.current_weather.weathercode);
    setWeather({
      zip,
      temperature,
      condition: `${condition} · ${name}`,
      cachedAt: Date.now(),
    });
  } catch (error) {
    weatherError.hidden = false;
    weatherError.textContent = error.message ?? 'Weather unavailable right now.';
    weatherCondition.textContent = 'Weather paused';
  }
}

function mapWeatherCode(code) {
  if ([0].includes(code)) return 'Clear skies';
  if ([1, 2].includes(code)) return 'Partly cloudy';
  if ([3].includes(code)) return 'Overcast';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 61, 63, 65].includes(code)) return 'Rainy';
  if ([71, 73, 75].includes(code)) return 'Snowy';
  return 'Shifting weather';
}

function setupWeather() {
  weatherForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = zipInput.value.trim();
    if (!value) return;
    fetchWeather(value);
  });
}

function setupChatbot() {
  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;
    const now = new Date().toISOString();
    pushChatMessage({ role: 'user', content: message, createdAt: now });
    chatInput.value = '';
    setTimeout(() => {
      const reply = createChatReply(message);
      pushChatMessage({ role: 'assistant', content: reply, createdAt: new Date().toISOString() });
    }, 400);
  });
}

function setupQuickTools() {
  openCalculatorButton.addEventListener('click', () => {
    calculatorModal.showModal();
    calculatorInput.focus();
  });
  closeCalculatorButton.addEventListener('click', () => {
    calculatorModal.close();
  });
  calculatorModal.addEventListener('close', () => {
    calculatorExpression = '';
    updateCalculatorDisplay();
  });
  focusNotebookButton.addEventListener('click', () => {
    notebookTextarea.focus();
  });
  focusSummarizerButton.addEventListener('click', () => {
    summarizerInput.focus();
  });
}

function updateCalculatorDisplay() {
  calculatorInput.value = calculatorExpression;
  try {
    // eslint-disable-next-line no-new-func
    const result = calculatorExpression ? Function(`"use strict";return (${calculatorExpression})`)() : 0;
    calculatorOutput.textContent = String(result);
  } catch (error) {
    calculatorOutput.textContent = 'Error';
  }
}

function setupCalculator() {
  const buttons = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+', 'C'];
  buttons.forEach((label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      if (label === 'C') {
        calculatorExpression = '';
      } else if (label === '=') {
        try {
          // eslint-disable-next-line no-new-func
          const result = calculatorExpression ? Function(`"use strict";return (${calculatorExpression})`)() : 0;
          calculatorExpression = String(result);
        } catch (error) {
          calculatorExpression = '';
          calculatorOutput.textContent = 'Error';
          return;
        }
      } else {
        calculatorExpression += label;
      }
      updateCalculatorDisplay();
    });
    calculatorButtons.appendChild(button);
  });
  calculatorInput.addEventListener('input', () => {
    calculatorExpression = calculatorInput.value.replace(/[^0-9+\-*/.()]/g, '');
    updateCalculatorDisplay();
  });
}

function setupAmbientHotkeys() {
  window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'c') {
      event.preventDefault();
      calculatorModal.showModal();
      calculatorInput.focus();
    }
    if (event.key === '/') {
      event.preventDefault();
      chatInput.focus();
    }
    if (event.key === 'Escape') {
      if (calculatorModal.open) {
        calculatorModal.close();
      }
    }
  });
}

function setupSpotify() {
  spotifyConnectButton.addEventListener('click', () => {
    spotifyConnected = !spotifyConnected;
    spotifyControls.hidden = !spotifyConnected;
    spotifyConnectButton.textContent = spotifyConnected ? 'Disconnect' : 'Connect Spotify';
  });
  spotifyControls.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const action = event.target.dataset.action;
    const status = document.createElement('div');
    status.className = 'muted';
    status.textContent = `Command sent: ${action}`;
    spotifyControls.appendChild(status);
    setTimeout(() => status.remove(), 1500);
  });
}

function restoreWeatherIfStale(state) {
  const { weather } = state;
  if (!weather.zip) return;
  const stale = !weather.cachedAt || Date.now() - weather.cachedAt > 1000 * 60 * 60;
  if (stale) {
    fetchWeather(weather.zip).catch(() => {});
  } else {
    renderWeather(state);
  }
}

function init() {
  initializeClock();
  setupSessionControls();
  setupThemeToggles();
  setupNotebook();
  setupSummarizer();
  setupQuotes();
  setupWeather();
  setupChatbot();
  setupQuickTools();
  setupCalculator();
  setupAmbientHotkeys();
  setupSpotify();

  const state = getState();
  restoreWeatherIfStale(state);
  handleStateChange(state);
  hydrateSession();
  subscribe(handleStateChange);
}

init();
