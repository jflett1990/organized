# TabSense

TabSense is a cross-browser extension designed to intelligently manage browser tabs and windows using AI-driven automation and a minimalist UI. This project aims to reduce tab clutter, enhance focus, and improve contextual recall.

## ✨ Recent Visual Improvements

**Completely redesigned UI with modern, professional styling:**
- 🎨 **Modern Design System**: Clean color palette with CSS custom properties for theming
- 📱 **Better Layout**: Increased popup size (380x600px) with improved spacing and typography
- 🌓 **Enhanced Dark/Light Themes**: Polished theme switching with smooth transitions
- 📊 **Stats Dashboard**: Real-time tab count statistics at the top
- 🔍 **Improved Search**: Modern search input with icon and better focus states
- ✨ **Smooth Animations**: Hover effects, transitions, and micro-interactions
- 🎯 **Better Visual Hierarchy**: Clear section titles with accent colors
- 📁 **Enhanced Tab Cards**: Better favicon handling, click-to-switch functionality
- ⚡ **Loading States**: Professional loading spinner and overlay
- 🎭 **Empty States**: Friendly empty state messages with emojis
- 📅 **Timestamps**: Shows when tabs were archived with relative time

## 🎯 Demo

Open `demo.html` in your browser to see the visual improvements side-by-side in both light and dark themes.

## Tech Stack
- Browser Extension APIs (WebExtension Standard)
- React + Modern CSS for UI
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

## Development
```bash
# Development build with file watching
npm run dev

# Production build
npm run build

# Clean build directory
npm run clean
```

## Features

### Current (MVP)
- ✅ Smart tab archiving with metadata extraction
- ✅ Fuzzy search through archived tabs
- ✅ Dark/light theme toggle
- ✅ Click-to-switch tab functionality
- ✅ Timestamps and relative time display
- ✅ Modern, responsive UI design

### Premium Features (Ready for Monetization)
- 🚀 **AI-Powered Analytics**: Productivity tracking, focus time analysis, and behavioral insights
- 📁 **Smart Auto-Grouping**: Automatic tab categorization by domain, activity, and time
- ⏰ **Intelligent Auto-Archive**: Idle detection with customizable timers
- 🔍 **Advanced Search**: Full-text search with content intelligence
- 📊 **Productivity Dashboard**: Comprehensive analytics with actionable recommendations
- ⌨️ **Keyboard Shortcuts**: Power user efficiency (Ctrl+Shift+A to archive)
- 🎯 **Smart Suggestions**: AI recommendations for tab management optimization
- 📈 **Usage Analytics**: Detailed insights into browsing patterns and productivity

### Planned
- 🔄 AI-powered tab summaries and auto-tagging
- ☁️ Cloud sync across devices
- 📈 Productivity analytics and insights
- 🤖 Smart auto-grouping by topic/domain
- ⌨️ Keyboard shortcuts
- 📱 Mobile companion app

## Browser Support
- Chrome (Manifest V3)
- Firefox (WebExtension)
- Safari (planned)
