Update Part 1 only.

The current React Native UI flow is wrong because it jumps straight from “Find Blind Match” to chat.

Change the app flow to match this product structure:

User creates account
→ User enters profile/preferences
→ User enters schedule/place
→ Backend/mock system finds match
→ At scheduled time, user receives blind date popup
→ User joins anonymous chat
→ Both users agree to reveal
→ Profile is revealed

Do not change backend or Terraform yet.

Updated React Native screens:

1. Create Account Screen
- Inputs:
  - Name
  - Age
- Button: “Continue”

2. Profile Setup Screen
- Inputs:
  - Dating goal
  - Preference
  - Personality traits
- Button: “Next”

3. Schedule / Place Screen
- Inputs:
  - Place: example “Blue Bottle Coffee”
  - Time: example “Tonight, 7–9 PM”
- Button: “Save Schedule”

4. Matchmaking Waiting Screen
- Text:
  “We’re checking your schedule for a compatible blind match.”
- Show loading state
- After 2–3 seconds, simulate match found

5. Blind Date Popup Screen
- Modal/card:
  “You have a potential blind match for your scheduled time.”
  “Compatibility: 87%”
- Buttons:
  - “Join Blind Chat”
  - “Ignore”

6. Anonymous Blind Chat Screen
- Keep anonymous chat UI
- Use local state for messages
- Include 2–3 mock messages
- Include:
  - message input
  - send button
  - “Ask App Assistant”
  - “Request Reveal”

7. App Assistant Modal
- Keep existing LLM app-help integration
- Calls:
  POST {API_URL}/api/app-help

8. Reveal Flow
- User taps “Request Reveal”
- Show:
  “Waiting for the other person to agree…”
- After 1 second, simulate other user agreeing

9. Revealed Profile Screen
- Show mock revealed profile:
  - Name: Maya
  - Age: 25
  - Dating goal: Intentional dating
  - Personality: Curious, calm, creative
- Button:
  “Continue Chat”

Important constraints:
- No real auth
- No database
- No real matchmaking
- No real schedule trigger
- Use local state/mock transitions
- Keep UI polished and mobile-first
- Keep code clean and componentized

The goal is not to build the full platform. The goal is to accurately demonstrate the first product flow:
scheduled blind match → popup → anonymous chat → mutual reveal.