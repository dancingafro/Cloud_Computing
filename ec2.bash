#!/bin/bash
# Update package and start Apache web server
sudo yum update -y
sudo yum install httpd -y

# Enable .htaccess by modifying the Apache configuration
CONFIG_PATH="/etc/httpd/conf/httpd.conf"
# Use sed to change AllowOverride from None to All for the /var/www directory
sudo sed -i 's/AllowOverride None/AllowOverride All/g' $CONFIG_PATH

# Create a simple index.html file
echo '<html><h1>Hello From Web Server 1!</h1></html>' > a.html
sudo cp a.html /var/www/html/index.html
rm a.html
# Set appropriate permissions
sudo chown apache:apache /var/www/html/index.html
sudo chmod 644 /var/www/html/index.html
# Install PHP
sudo yum install php-cli php-pdo php-fpm php-json php-mysqlnd -y
# Install MySQL client
sudo wget https://dev.mysql.com/get/mysql80-community-release-el9-1.noarch.rpm
sudo dnf install mysql80-community-release-el9-1.noarch.rpm -y
sudo rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2023
sudo dnf install mysql-community-client -y
# Install Git
sudo yum install git -y
# Start the web server
sudo systemctl start httpd
sudo systemctl enable httpd
# Display server status
sudo systemctl status httpd
