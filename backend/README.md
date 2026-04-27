# Blindly Backend

Small Express API for the Blindly MVP.

## Endpoints

- `GET /health`
- `POST /api/session`
- `PATCH /api/session/:sessionId/profile`
- `PATCH /api/session/:sessionId/schedule`
- `GET /api/session/:sessionId/match-status`
- `POST /api/session/:sessionId/match/join`
- `POST /api/session/:sessionId/match/ignore`
- `POST /api/session/:sessionId/chat/messages`
- `POST /api/session/:sessionId/reveal-request`
- `GET /api/session/:sessionId/reveal-status`
- `POST /api/app-help`

## Setup

1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env`
4. Set `LLM_BACKEND_URL` if you have an existing LLM backend
5. Run `npm start`

Default local URL: `http://localhost:3000`

## Environment

```env
PORT=3000
LLM_BACKEND_URL=https://your-existing-llm-backend.com/chat
```

## Placeholder Behavior

- No database
- No auth
- No WebSockets
- All session state is stored in memory
- Match availability is simulated on the server
- Reveal timing is simulated on the server
- Chat messages are stored in memory and get placeholder replies

## Example Flow

1. `POST /api/session`
2. `PATCH /api/session/:sessionId/profile`
3. `PATCH /api/session/:sessionId/schedule`
4. Poll `GET /api/session/:sessionId/match-status`
5. `POST /api/session/:sessionId/match/join`
6. `POST /api/session/:sessionId/chat/messages`
7. `POST /api/session/:sessionId/reveal-request`
8. Poll `GET /api/session/:sessionId/reveal-status`

## Notes

- `POST /api/app-help` forwards `{ "message": "..." }` to `LLM_BACKEND_URL`.
- If `LLM_BACKEND_URL` is missing or the request fails, the API returns a fallback answer instead of erroring.
- In-memory sessions reset when the backend restarts.
