# TabSense

TabSense is a cross-browser extension designed to intelligently manage browser tabs and windows using AI-driven automation and a minimalist UI. This project aims to reduce tab clutter, enhance focus, and improve contextual recall.

## Tech Stack
- Browser Extension APIs (WebExtension Standard)
- React + Tailwind for UI
- IndexedDB for local storage
- Node.js + Firebase (post-MVP for cloud sync & AI)

## Project Structure
- `/src` – Source code
  - `/background` – Background scripts (tab events, idle detection)
  - `/popup` – React-based UI
  - `/components` – UI components (TabCard, TabGroup, etc.)
  - `/services` – Business logic (tabManager, archiveManager)
  - `/utils` – IndexedDB, helper functions
- `/docs` – Documentation including PRD and architecture
- `/tests` – Unit and integration tests

## Setup
```bash
npm install
npm run build
```
Load the `/dist` folder as an unpacked extension in your browser.
