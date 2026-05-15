# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Intelligent Bistro** is a mobile food ordering app where users order through a conversational AI. The stack is a Turborepo monorepo with two apps:

- `apps/mobile` — Expo React Native app (TypeScript)
- `apps/api` — Node.js + Express backend (TypeScript)

## Commands

### Run everything (from root)
```bash
npm run dev       # starts both api and mobile concurrently via Turborepo
```

### Backend only (from `apps/api/`)
```bash
npm run dev       # nodemon + ts-node, hot-reloads on change, port 3001
```

### Mobile only (from `apps/mobile/`)
```bash
npm run dev       # expo start (interactive — choose iOS/Android/web)
npm run ios       # expo start --ios
npm run android   # expo start --android
npm run web       # expo start --web
```

### Clear Expo cache (when Reanimated or Babel issues arise)
```bash
npx expo start --clear
```

## Environment Setup

Copy `apps/api/.env.example` to `apps/api/.env` and fill in:
```
OPENROUTER_API_KEY=<your key>
```

The API client (`apps/api/src/services/anthropic.ts`) uses **OpenRouter** (not the direct Anthropic API) — it points to `https://openrouter.ai/api/v1` and uses the model ID `anthropic/claude-3.5-sonnet`. The env var is `OPENROUTER_API_KEY`, not `ANTHROPIC_API_KEY` (the `.env.example` is outdated).

## Architecture

### Data flow: user message → cart update

1. User types/speaks in `ChatScreen` → `handleSend()`
2. Chat message added to Zustand store; an empty streaming assistant message is appended
3. `streamChat()` (`apps/mobile/src/services/api.ts`) POSTs to `/chat` and reads SSE
4. Each SSE chunk is fed to `useStreamParser` which parses the **sentinel protocol**
5. Clean text is appended to the assistant message; parsed `CartAction` objects immediately update the Zustand cart
6. When streaming ends, `useTTS` speaks the full response

### Sentinel streaming protocol

The AI embeds structured JSON inside natural language using Unicode delimiters:

```
"I've added that! ✦ACTION✦{"op":"add","items":[...]}✦END✦ Great choice!"
```

`useStreamParser` (`apps/mobile/src/hooks/useStreamParser.ts`) processes the stream character-by-character. Everything inside `✦ACTION✦...✦END✦` is stripped from visible text and dispatched as a `CartAction`. Supported ops: `add`, `remove`, `update`, `clear`, `clarify`, `upsell`.

### Zustand store (`apps/mobile/src/store/`)

Three slices composed into one `useStore`:
- `cartSlice` — `items[]`, `isAnimating`, add/remove/update/clear actions
- `chatSlice` — `messages[]`, `isStreaming`, `isAiSpeaking`, `quickReplies[]`
- `profileSlice` — `restrictions[]` (dietary preferences, persisted for session)

### VoiceWaveUI

`apps/mobile/src/components/VoiceWaveUI/VoiceWaveUI.tsx` is a WebView wrapper around a self-contained HTML/CSS/Canvas animation. State is pushed from React Native via `injectJavaScript` (`rn-state-update` custom event); button presses are sent back via `postMessage`. Modes: `idle` | `user` (listening) | `ai` (responding).

### Navigation

- Root: `AppNavigator` — NativeStack containing `TabNavigator` + `CheckoutScreen` (pushed)
- Tabs: Home (menu), Chat (default), Cart icon

### Backend SSE endpoint

`POST /chat` streams via Server-Sent Events. Keep-alive pings every 15s prevent dropped connections. The system prompt is built fresh each request from current cart + dietary profile + full menu JSON (`apps/api/src/data/menu.json` is the single source of truth for menu items).

## Key Constraints

- **Babel plugin order**: `react-native-reanimated/plugin` must be **last** in `babel.config.js`
- **Sentinel characters**: `✦` is Unicode U+2726 — never substitute with `*`, `[`, or other chars
- **Menu IDs**: the AI must use exact `id` fields from `menu.json`; `useStreamParser` reconstructs `MenuItem` with a generic fallback image since the AI only knows the ID
- **Mobile API base URL**: `apps/mobile/src/services/api.ts` hardcodes `http://localhost:3001` — change to your machine's LAN IP when testing on a physical device
- **Voice features require `expo-dev-client`**: `expo-speech-recognition` does not work in Expo Go; use `npx expo run:ios` or `npx expo run:android`
