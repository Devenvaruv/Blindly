output "public_ip" {
  description = "Public IP of the EC2 instance."
  value       = aws_instance.blindly_api.public_ip
}

output "api_base_url" {
  description = "Base URL for the deployed backend API."
  value       = "http://${aws_instance.blindly_api.public_ip}:3000"
}
