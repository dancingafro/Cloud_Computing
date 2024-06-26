SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    login_type VARCHAR(50) NOT NULL,
    token VARCHAR(255), -- Column to store the generated token
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
