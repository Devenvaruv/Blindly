Create an Expo React Native app.

Build a polished mobile UI with these screens/components:

1. Home / Setup Screen
- App name: “Blindly” or “Blind Match”
- Short tagline: “Meet through conversation first.”
- Mock user card:
  - Name: Deven
  - Age: 24
  - Dating goal: Intentional dating
  - Availability: Tonight, 7–9 PM
- Button: “Find Blind Match”

2. Match Found Screen
- Show anonymous match card:
  - “Blind Match Found”
  - Compatibility: 87%
  - Shared intent: “Intentional dating”
  - Do not show name/photo yet
- Button: “Start Blind Chat”

3. Blind Chat Screen
- Anonymous chat UI
- Use local state for messages
- Include 2–3 prefilled mock messages from the match
- User can type and send messages
- Add button: “Ask App Assistant”
- Add button: “Request Reveal”

4. App Assistant Modal/Panel
- User can ask how the app works
- Calls backend endpoint:
  POST {API_URL}/api/app-help
- Shows LLM response
- If backend fails, show graceful fallback:
  “The assistant is unavailable, but blind matches reveal only when both people agree.”

5. Reveal Screen
- First click “Request Reveal”
- Simulate the other person agreeing after 1 second
- Then reveal mock profile:
  - Name: Maya
  - Age: 25
  - Dating goal: Intentional dating
  - Personality: Curious, calm, creative
- Continue chat button

UI expectations:
- Clean, modern, dating-app style
- Use soft gradients/cards
- Smooth spacing
- Good empty/loading states
- Mobile-first design
- Keep code clean and componentized

Files:
- App.tsx
- src/components/*
- src/screens/*
- src/config.ts for API_URL

generate clean, easy to understand code.