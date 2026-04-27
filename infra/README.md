# Blindly Terraform

Simple EC2 deployment for the Blindly Express backend.

## What It Creates

- AWS provider config
- Default VPC lookup
- Security group
  - SSH on `22` from `var.ssh_cidr`
  - API on `3000` from `0.0.0.0/0`
- One Ubuntu EC2 instance
- `user_data` that installs Node.js, npm, git, and pm2
- Backend startup with pm2

## Required Inputs

- `app_repo_url`

## Optional Inputs

- `aws_region` default: `us-west-2`
- `instance_type` default: `t3.micro`
- `ssh_cidr` default: `0.0.0.0/0`
- `key_name` default: `null`
- `app_repo_branch` default: `main`
- `backend_subdir` default: `backend`
- `llm_backend_url` default: `""`

## Example

```powershell
cd infra
terraform init
terraform apply `
  -var "app_repo_url=https://github.com/your-org/your-repo.git" `
  -var "app_repo_branch=main" `
  -var "backend_subdir=backend" `
  -var "llm_backend_url=https://your-existing-llm-backend.com/chat" `
  -var "ssh_cidr=0.0.0.0/0"
```

## Outputs

- `public_ip`
- `api_base_url`

## Notes

- The EC2 instance clones the repo directly in `user_data`, so the repo needs to be reachable from the instance.
- If you want SSH access, provide an existing AWS key pair name through `key_name`.
- This is intentionally demo-grade: no HTTPS, no load balancer, no autoscaling, no Docker, no CI/CD.
