-- CampusHub Database Schema

CREATE DATABASE IF NOT EXISTS campushub;
USE campushub;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Student', 'Organizer', 'Admin') NOT NULL DEFAULT 'Student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    location VARCHAR(200) NOT NULL,
    capacity INT NOT NULL,
    organizer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Event Registrations table
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    student_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (event_id, student_id)
);

-- Note: The admin password hash should be generated using password_hash() in PHP.
-- E.g., password_hash('admin123', PASSWORD_DEFAULT)
-- Example manual insert for an admin user (Password is 'admin123' if using the hash below):
-- INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@campushub.com', '$2y$10$Y1gW9R4F9p8GkUoQe1yJTuB9M/eR9uG7a2t/3iI3D.o/wT8R5aR9S', 'Admin');
