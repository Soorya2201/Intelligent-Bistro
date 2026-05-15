# Intelligent Bistro

A conversational AI food ordering app built with React Native (Expo) and Node.js.

![CI](https://github.com/Soorya2201/Intelligent-Bistro/actions/workflows/ci.yml/badge.svg)

## Overview

Intelligent Bistro lets users browse a menu and manage their cart entirely through natural conversation. Instead of tapping through a traditional UI, you talk to Bistro — an AI waiter that understands orders, handles modifications, warns about dietary conflicts, and upsells pairings naturally.

## Features

- **Conversational ordering** — "Add two spicy chicken sandwiches and a large water" updates the cart instantly
- **Voice input** — Speak your order using your microphone; Whisper transcribes it via Groq
- **AI responses spoken aloud** — Text-to-speech reads every Bistro reply back to you
- **Smart cart** — Add, remove, update quantities, or clear via chat or the menu UI
- **Dietary awareness** — Tell Bistro your restrictions once; it warns you before adding conflicting items
- **Favourites** — Heart items to get personalised recommendations
- **Visual menu browsing** — Category tabs, food cards, and suggested item tiles inside the chat
- **Checkout narration** — Bistro reads your full order back before you confirm

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Expo (React Native), TypeScript, Zustand |
| Backend | Node.js, Express, TypeScript |
| AI | Anthropic Claude (`claude-sonnet-4-5`) |
| Voice (STT) | Groq Whisper (`whisper-large-v3-turbo`) |
| Voice (TTS) | `expo-speech` |
| Monorepo | Turborepo + npm workspaces |
| CI | GitHub Actions |

## Project Structure

```
Intelligent-Bistro/
├── apps/
│   ├── api/          # Node.js + Express backend
│   └── mobile/       # Expo React Native app
└── package.json      # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com)
- A [Groq API key](https://console.groq.com) (free — 2,000 min/day)

### Setup

```bash
git clone https://github.com/Soorya2201/Intelligent-Bistro.git
cd Intelligent-Bistro
npm install

# Configure environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env and add:
#   ANTHROPIC_API_KEY=...
#   GROQ_API_KEY=...
```

### Run

```bash
npm run dev        # starts API (port 3001) + Expo simultaneously
```

> **Physical Android device?** Run `cd apps/mobile && npx expo start --lan --clear` in a separate terminal. Your phone must be on the same Wi-Fi as your machine.

> **Voice features** require a custom dev client — they do not work in Expo Go.

## Architecture

### Sentinel Streaming Protocol

The AI embeds structured cart actions inside natural language using Unicode delimiters:

```
"I've added that! ✦ACTION✦{"op":"add","items":[...]}✦END✦ Great choice!"
```

The mobile app parses the stream character-by-character, strips action blocks from visible text, and dispatches them to the Zustand cart store in real time.

### Supported Cart Actions

| Op | Effect |
|---|---|
| `add` | Add items to cart |
| `remove` | Remove items from cart |
| `update` | Change item quantity |
| `clear` | Empty the cart |
| `clarify` | Ask a follow-up with quick-reply chips |
| `upsell` | Suggest a pairing item |
| `suggest` | Show visual food cards in chat |

## Tests

```bash
cd apps/api    && npm test   # 29 tests
cd apps/mobile && npm test   # 73 tests
```
