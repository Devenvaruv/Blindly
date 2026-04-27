Create Terraform config to provision one EC2 instance and run the Express backend.

Infrastructure:
- AWS provider
- Use default VPC
- Security group allowing:
  - SSH 22 from my IP or 0.0.0.0/0 for demo only
  - HTTP 3000 from 0.0.0.0/0
- EC2 instance:
  - Ubuntu AMI
  - t2.micro or t3.micro
  - user_data script installs:
    - Node.js
    - npm
    - git
    - pm2
  - Clones or prepares backend app
  - Runs backend using pm2

Terraform files:
infra/
  main.tf
  variables.tf
  outputs.tf
  README.md

Outputs:
- public_ip
- api_base_url = http://<public_ip>:3000

Keep Terraform simple.
Do not add:
- Load balancer
- Auto scaling group
- RDS
- Redis
- Docker
- HTTPS
- CI/CD
- CloudFront

Also create a root README with:
1. What the app does
2. Architecture diagram in text
3. How to run mobile app locally
4. How to run backend locally
5. How to deploy EC2 with Terraform
6. What was intentionally skipped due to 90–120 minute scope
7. What I would build next