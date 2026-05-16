# Changelog

## [2.0.0] — 2025-05

### Added
- Native Claude tool-calling replacing sentinel protocol (7 validated tools)
- Zod validation on all tool inputs and API request bodies
- Two-phase streaming architecture (tool resolution → text stream, separated)
- SQLite persistence via better-sqlite3 (menu, orders, interactions, preferences)
- Multi-signal recommendation engine (popularity + affinity + pairing + dietary)
- "For You" recommendation strip on menu screen (personalised per session)
- AI Tool Inspector — long-press action chips to see raw tool JSON and validation status
- Input method indicator (🎤 voice vs ⌨ text) on every user message bubble
- Recommendations inline in chat ("You might also like →")
- Conversation summarisation for sessions > 8 turns (haiku model, cost-efficient)
- Rate limiting: 30/min chat, 100/min API, 20/min transcribe
- Helmet security middleware
- Enhanced `/api/health` with DB status, version, and uptime
- `/api/metrics` endpoint — in-memory counters, Claude P95 latency, tool distribution
- `POST /api/orders` — persistent order placement to SQLite
- `GET /api/orders/:sessionId` — server-side order history (last 20)
- `PATCH /api/orders/:orderId/status` — order status progression
- `GET /api/recommendations` — personalised recommendations with 4-signal scoring
- Order status animation screen — 4 stages (received → kitchen → almost ready → pickup!)
- Confetti celebration on order ready (Animated confetti pulse)
- 28+ menu items across 6 categories with allergens, pairings, and calorie data
- Cart fingerprinting — skips redundant recommendation calls on quantity-only changes
- demos/ directory for development artifacts

### Changed
- `/api/menu` now reads from SQLite instead of static JSON
- `chatSlice` stores raw tool payloads and `inputMethod` alongside messages
- `streamParser` updated for structured SSE event types (actions/delta/done/recommendations)
- `streamChat` API updated to use structured callbacks (onActions, onDelta, onRecommendations, onDone)
- `CheckoutScreen` now places a real order via `POST /api/orders` and shows stage animation
- System prompt updated: tool-calling instructions replace sentinel protocol instructions
- Menu expanded from 14 items to 28+ items across 5 categories

### Fixed
- Removed `.DS_Store` from git tracking
- Moved `bistro-chat-ui.html` to `demos/`
- Updated `.gitignore` with macOS, Windows, and SQLite patterns

### Tests
- 150 total tests across 8 suites (up from 105)
- New: `tools.test.ts` — Zod schema validation for all 7 tools (20+ tests)
- New: `streamParser.test.ts` — structured SSE event parsing (mobile, 30 tests)
- Updated: `anthropic.test.ts` — tool-calling instructions, no sentinel tests
- Updated: `menu.schema.test.ts` — new menu structure with 28+ items
- Updated: legacy sentinel tests replaced with structured SSE tests

## [1.0.0] — 2025-04

### Added
- Initial release
- Voice STT via Groq Whisper + expo-speech-recognition
- Voice TTS via expo-speech with waveform animation
- Sentinel protocol streaming (✦ACTION✦...✦END✦)
- Zustand store: cartSlice, chatSlice, profileSlice
- Order history + favourites via AsyncStorage
- Dietary intelligence with session-aware conflict warnings
- Checkout narration via TTS
- GitHub Actions CI
- 105 tests across 6 suites
