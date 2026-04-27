terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ssm_parameter" "ubuntu_ami" {
  name = "/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id"
}

resource "aws_security_group" "blindly_api" {
  name        = "blindly-api-sg"
  description = "Security group for the Blindly demo backend"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr]
  }

  ingress {
    description = "Blindly API"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "blindly-api-sg"
  }
}

resource "aws_instance" "blindly_api" {
  ami                    = data.aws_ssm_parameter.ubuntu_ami.value
  instance_type          = var.instance_type
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.blindly_api.id]
  key_name               = var.key_name

  user_data = <<-EOF
    #!/bin/bash
    set -euxo pipefail

    export DEBIAN_FRONTEND=noninteractive

    apt-get update -y
    apt-get install -y ca-certificates curl gnupg git

    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
      | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
      > /etc/apt/sources.list.d/nodesource.list

    apt-get update -y
    apt-get install -y nodejs
    npm install -g pm2

    mkdir -p /opt/blindly

    if [ ! -d /opt/blindly/app/.git ]; then
      git clone --branch "${var.app_repo_branch}" "${var.app_repo_url}" /opt/blindly/app
    else
      cd /opt/blindly/app
      git fetch origin
      git checkout "${var.app_repo_branch}"
      git pull origin "${var.app_repo_branch}"
    fi

    cd /opt/blindly/app/${var.backend_subdir}

    cat > .env <<ENVVARS
    PORT=3000
    LLM_BACKEND_URL=${var.llm_backend_url}
    ENVVARS

    npm install --omit=dev

    pm2 delete blindly-backend || true
    pm2 start src/server.js --name blindly-backend
    pm2 save
    pm2 startup systemd -u root --hp /root
  EOF

  tags = {
    Name = "blindly-api"
  }
}
