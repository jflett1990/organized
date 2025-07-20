# Cursor Agent Rules

## Goals
- Ensure consistent modular architecture
- Maintain context awareness across tabs, archives, and UI
- Prioritize MVP-first implementation with clean handoffs

## Naming Conventions
- camelCase for variables and functions
- PascalCase for components
- kebab-case for filenames

## Testing
- Use Jest with mock APIs for browser-specific functionality
- Include coverage for all services and IndexedDB interactions

## Folder Structure
- `/src/background`: Event listeners and service hooks
- `/src/components`: Reusable UI components
- `/src/services`: Business logic (tab manager, archiver)
- `/src/utils`: Utility functions and IndexedDB handlers
- `/tests`: Unit and integration tests

## Commit Format
- Use conventional commits (`feat:`, `fix:`, `chore:`)
- Descriptive messages tied to checklist items

## Agent Directives
- Check implementation against PRD features
- Maintain a changelog in `CHANGELOG.md`
- Record decisions and anomalies in `/docs/dev_notes.md`
