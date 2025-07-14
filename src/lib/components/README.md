# Component Architecture

This directory contains all the Svelte components organized by their purpose and functionality.

## Folder Structure

```
src/lib/components/
├── index.ts                    # Main component exports
│
├── screens/                    # Top-level screen components
│   ├── index.ts
│   ├── WelcomeScreen.svelte   # Main landing/auth screen
│   ├── Lobby.svelte           # Game lobby with player list
│   └── GameResults.svelte     # Final game results
│
├── game/                       # Game-specific components
│   ├── index.ts
│   ├── GamePlay.svelte        # Main gameplay orchestrator
│   ├── GameQuestion.svelte    # Question display + audio controls
│   ├── RoundResults.svelte    # Results after each round
│   ├── ScoresSidebar.svelte   # Live player scores
│   └── SongInfo.svelte        # Song/artist display component
│
├── forms/                      # Form components
│   ├── index.ts
│   ├── CreateGameForm.svelte  # Host game creation form
│   ├── JoinGameForm.svelte    # Join existing game form
│   └── GameConfigForm.svelte  # Game configuration settings
│
└── common/                     # Shared/utility components
    ├── index.ts
    ├── ConnectionStatus.svelte # WebSocket connection status
    ├── ConnectPrompt.svelte   # Connection prompts
    ├── GameModeMenu.svelte    # Game mode selection
    └── GameTimer.svelte       # Countdown timer with warning states
```

## Import Guidelines

### Preferred: Use the main barrel export

```typescript
import { WelcomeScreen, GamePlay, ConnectionStatus } from "$lib/components";
```

### Alternative: Use category-specific exports

```typescript
import { GamePlay, GameQuestion } from "$lib/components/game";
import { CreateGameForm } from "$lib/components/forms";
```

### Direct imports (when needed)

```typescript
import GameTimer from "$lib/components/common/GameTimer.svelte";
```

## Component Categories

### Screens (`/screens/`)

- **Purpose**: Top-level application views/pages
- **Characteristics**: Handle routing logic, orchestrate multiple components
- **Examples**: Welcome screen, game lobby, results screen

### Game (`/game/`)

- **Purpose**: Game-specific functionality and UI
- **Characteristics**: Handle game state, player interactions, music playback
- **Examples**: Question display, score tracking, round results

### Forms (`/forms/`)

- **Purpose**: User input and data collection
- **Characteristics**: Form validation, user interaction, data submission
- **Examples**: Login forms, game creation, settings

### Common (`/common/`)

- **Purpose**: Reusable utility components
- **Characteristics**: No business logic, pure UI components, widely reusable
- **Examples**: Timers, status indicators, connection prompts

## Adding New Components

1. Determine the appropriate category based on purpose
2. Add the component to the correct folder
3. Export it in the folder's `index.ts`
4. Follow the naming convention: `PascalCase.svelte`
5. Include proper TypeScript interfaces for props

## Benefits

- **Better Organization**: Components grouped by purpose
- **Easier Navigation**: Clear folder structure
- **Cleaner Imports**: Barrel exports reduce import noise
- **Scalability**: Easy to add new components in appropriate categories
- **Maintainability**: Related components are co-located
