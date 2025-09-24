# Blyx

Grow a tree, grow your focus. Blyx is a minimalist deep work dashboard inspired by plant-growing focus apps. Start a timed session, watch a calming tree animation grow, and keep supportive utilities within reach—without tabbing away.

## Features

- **Focus session engine** with 25/45/60 minute presets, custom durations, pause/resume, and fail states that wither your tree.
- **Tree visualiser** that grows alongside the timer and saves completed trees to today’s forest grid.
- **On-page utilities** including a calculator modal (hotkey `C`), autosaving notebook, lightweight summariser, and quick tools panel.
- **Ambient support** with inspirational quote ticker, weather lookup by ZIP code, and theme picker with reduced-motion and accessibility toggles.
- **Compact chatbot** that keeps replies concise and nudges you back on task.
- **Persistent stats** tracking coins, streaks, and today’s forest in local storage.

## Getting started

Blyx now runs as a static, dependency-free web app. You can open `index.html` directly in a browser, or serve the directory locally with the provided script:

```bash
npm install
npm start
```

`npm start` launches a tiny Node HTTP server on [http://localhost:4173](http://localhost:4173) that serves the static files in this folder.

## Project structure

```
.
├── index.html         # Application shell and layout
├── styles/global.css  # Theming, layout, and component styling
├── scripts/           # Vanilla JS modules powering Blyx
│   ├── main.js        # App bootstrap and UI wiring
│   ├── session.js     # Focus-session state machine
│   ├── state.js       # Local-storage backed state container
│   ├── quotes.js      # Offline quote catalogue
│   ├── summarizer.js  # Lightweight text summariser
│   └── chatbot.js     # Focus-friendly chatbot heuristics
└── server.mjs         # Optional static file server used by `npm start`
```

## Keyboard shortcuts

- `C` — open the calculator modal
- `/` — focus the chatbot composer
- `Esc` — close the calculator

## Offline-friendly defaults

- The quotes ticker ships with 20 preloaded quotes and keeps running offline.
- Weather gracefully degrades if the Open-Meteo APIs are unreachable.
- Notes, settings, and active sessions persist in `localStorage` to survive refreshes.

## License

MIT
