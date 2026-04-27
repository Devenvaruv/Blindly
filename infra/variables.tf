variable "aws_region" {
  description = "AWS region for the demo deployment."
  type        = string
  default     = "us-west-2"
}

variable "instance_type" {
  description = "EC2 instance type for the backend."
  type        = string
  default     = "t3.micro"
}

variable "ssh_cidr" {
  description = "CIDR block allowed to SSH to the instance. Use 0.0.0.0/0 only for demo purposes."
  type        = string
  default     = "0.0.0.0/0"
}

variable "key_name" {
  description = "Optional EC2 key pair name for SSH access."
  type        = string
  default     = null
}

variable "app_repo_url" {
  description = "Git repository URL that the EC2 instance will clone."
  type        = string
}

variable "app_repo_branch" {
  description = "Git branch to deploy from the app repository."
  type        = string
  default     = "main"
}

variable "backend_subdir" {
  description = "Path to the backend directory inside the repository."
  type        = string
  default     = "backend"
}

variable "llm_backend_url" {
  description = "Existing LLM backend URL used by POST /api/app-help."
  type        = string
  default     = ""
}
