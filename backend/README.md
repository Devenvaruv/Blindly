# Blindly Backend

Small Express API for the Blindly MVP.

## Endpoints

- `GET /health`
- `POST /api/mock-match`
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

## Notes

- `POST /api/mock-match` always returns the same mock match.
- `POST /api/app-help` forwards `{ "message": "..." }` to `LLM_BACKEND_URL`.
- If `LLM_BACKEND_URL` is missing or the request fails, the API returns a fallback answer instead of erroring.

## Quick Checks

```powershell
Invoke-WebRequest http://localhost:3000/health | Select-Object -Expand Content
```

```powershell
Invoke-WebRequest http://localhost:3000/api/mock-match -Method POST | Select-Object -Expand Content
```

```powershell
Invoke-WebRequest http://localhost:3000/api/app-help -Method POST -ContentType "application/json" -Body '{"message":"How does reveal work?"}' | Select-Object -Expand Content
```
