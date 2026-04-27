Create a small Express backend.

Endpoints:

GET /health
Response:
{
  "status": "ok"
}

POST /api/mock-match
Response:
{
  "matchId": "match_001",
  "compatibility": 87,
  "anonymousLabel": "Blind Match",
  "sharedIntent": "Intentional dating"
}

POST /api/app-help
Request:
{
  "message": "How does reveal work?"
}

Behavior:
- Read LLM_BACKEND_URL from environment variables.
- Forward the user message to existing LLM backend.
- Return:
{
  "answer": "..."
}
- If LLM_BACKEND_URL is missing or request fails, return a useful fallback answer.

Important:
- Add CORS.
- Add JSON body parsing.
- Keep code small.
- Do not add database.
- Do not add auth.
- Add README instructions.

Suggested structure:
backend/
  package.json
  src/server.js
  .env.example

Environment:
PORT=3000
LLM_BACKEND_URL=https://your-existing-llm-backend.com/chat