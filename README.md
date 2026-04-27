# Blindly MVP

Blindly is a dating MVP centered on one flow:

scheduled blind match -> popup -> anonymous chat -> mutual reveal

The mobile app is built with Expo React Native. The backend is a small Express API. Deployment is a single EC2 instance provisioned with Terraform.

## What the app does

- Lets a user create a lightweight profile
- Captures a preferred time and place
- Simulates a blind match at that scheduled slot
- Opens an anonymous chat
- Lets both people reveal only after agreement
- Includes one app-help endpoint backed by an existing LLM URL

## Architecture

```text
[Expo React Native App]
        |
        | POST /api/app-help
        | POST /api/session
        | GET /api/session/:id/match-status
        | POST /api/session/:id/chat/messages
        v
[Express Backend on EC2]
        |
        | POST message
        v
[Existing LLM Backend URL]
```

## Run the mobile app locally

1. Install dependencies:

```powershell
npm install
```

2. Set the API URL for Expo:

```powershell
$env:EXPO_PUBLIC_API_URL="http://localhost:3000"
```

3. Start Expo:

```powershell
npm start
```

## Run the backend locally

1. Install backend dependencies:

```powershell
cd backend
npm install
```

2. Create a local env file from `backend/.env.example`.

3. Start the API:

```powershell
npm start
```

Default local API URL: `http://localhost:3000`

## Deploy EC2 with Terraform

1. Change into the infra directory:

```powershell
cd infra
```

2. Initialize Terraform:

```powershell
terraform init
```

3. Apply the stack:

```powershell
terraform apply `
  -var "app_repo_url=https://github.com/your-org/your-repo.git" `
  -var "app_repo_branch=main" `
  -var "backend_subdir=backend" `
  -var "llm_backend_url=https://your-existing-llm-backend.com/chat" `
  -var "ssh_cidr=0.0.0.0/0"
```

4. Use the output `api_base_url` as the mobile app API base URL.

## What was intentionally skipped

- Real authentication
- Database and persistence
- Real matchmaking logic
- Redis
- WebSockets / realtime chat transport
- Background job scheduling
- Production HTTPS and domain setup
- Load balancer, autoscaling, RDS, Docker, CI/CD
- Analytics, moderation, and abuse prevention

## What I would build next

- Real auth and user accounts
- Persistent chat and profile storage
- Match lifecycle state in a database
- Scheduled notifications and actual reveal coordination
- Safer deployment with HTTPS, secrets management, and CI/CD
- Better app assistant contract with a stable upstream LLM schema
