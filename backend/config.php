<?php
// CampusHub SMTP Configuration (e.g. Mailtrap or Gmail App Password)
define('SMTP_HOST', 'sandbox.smtp.mailtrap.io');
define('SMTP_PORT', 2525);
define('SMTP_USER', 'your-mailtrap-username'); // Replace with actual credentials
define('SMTP_PASS', 'your-mailtrap-password'); // Replace with actual credentials
define('SMTP_FROM_EMAIL', 'admin@campushub.local');
define('SMTP_FROM_NAME', 'CampusHub Admin');

// CampusHub SQLite Configuration
// This entirely removes the need for a separate MySQL server!
$db_file = __DIR__ . '/../database/campushub.sqlite';
$is_new_db = !file_exists($db_file);

try {
    $pdo = new PDO("sqlite:" . $db_file);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Enable SQLite foreign keys
    $pdo->exec('PRAGMA foreign_keys = ON;');

    // Auto-create schema on first run!
    if ($is_new_db) {
        $schema = "
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'Student',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT DEFAULT 'General',
                event_date DATETIME NOT NULL,
                location TEXT NOT NULL,
                capacity INTEGER NOT NULL,
                organizer_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                roll_no TEXT,
                section TEXT,
                college TEXT,
                course TEXT,
                registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE (event_id, student_id)
            );
        ";
        $pdo->exec($schema);
    }
    
    // Automatic Migration: Add profile_picture to users if missing
    $colsQuery = $pdo->query("PRAGMA table_info(users)");
    $cols = $colsQuery->fetchAll(PDO::FETCH_ASSOC);
    $hasProfilePic = false;
    foreach($cols as $col) {
        if ($col['name'] === 'profile_picture') {
            $hasProfilePic = true;
            break;
        }
    }
    if (!$hasProfilePic) {
        $pdo->exec("ALTER TABLE users ADD COLUMN profile_picture TEXT DEFAULT NULL");
    }

    // Automatic Migration: Add image_url to events if missing
    $eventColsQuery = $pdo->query("PRAGMA table_info(events)");
    $eventCols = $eventColsQuery->fetchAll(PDO::FETCH_ASSOC);
    $hasEventImage = false;
    foreach($eventCols as $col) {
        if ($col['name'] === 'image_url') {
            $hasEventImage = true;
            break;
        }
    }
    if (!$hasEventImage) {
        $pdo->exec("ALTER TABLE events ADD COLUMN image_url TEXT DEFAULT NULL");
    }

} catch (PDOException $e) {
    die(json_encode(["error" => "Database initialization failed", "details" => $e->getMessage()]));
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}
?>
