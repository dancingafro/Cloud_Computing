#!/bin/bash
# Update package and start Apache web server
sudo yum update -y
sudo yum install httpd -y
sudo yum install -y nodejs npm

# Enable .htaccess by modifying the Apache configuration
CONFIG_PATH="/etc/httpd/conf/httpd.conf"
# Use sed to change AllowOverride from None to All for the /var/www directory
sudo sed -i 's/AllowOverride None/AllowOverride All/g' $CONFIG_PATH

# Install PHP
sudo yum install php-cli php-pdo php-fpm php-json php-mysqlnd -y

# Install MySQL client
sudo wget https://dev.mysql.com/get/mysql80-community-release-el9-1.noarch.rpm
sudo dnf install mysql80-community-release-el9-1.noarch.rpm -y
sudo rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2023
sudo dnf install mysql-community-client -y

# Download the certificate to a secure location outside /var/www/html
sudo wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O /etc/ssl/certs/rds-ca-bundle.pem

# Set the ownership and permissions so that only root and web server's user can read it
sudo chown root:apache /etc/ssl/certs/rds-ca-bundle.pem
sudo chmod 640 /etc/ssl/certs/rds-ca-bundle.pem


# Install Git
sudo yum install git -y

# Clear the existing web root directory
sudo rm -rf /var/www/html/*

# Clone the Git repository into the web root directory
GIT_REPO="https://github.com/dancingafro/Cloud_Computing.git"
sudo git clone $GIT_REPO /var/www/html/

# Set appropriate permissions for HTML, CSS, and PHP files
sudo find /var/www/html/ -type f \( -name '*.html' -o -name '*.css' -o -name '*.php' \) -exec chmod 644 {} \;

# Set appropriate ownership for all files and directories within /var/www/html
sudo chown -R apache:apache /var/www/html/

# Start the web server
sudo systemctl start httpd
sudo systemctl enable httpd
# Display server status
sudo systemctl status httpd
