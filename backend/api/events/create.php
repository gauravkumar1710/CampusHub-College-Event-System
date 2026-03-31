<?php
header("Content-Type: application/json");
require_once '../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
    exit;
}

if (isset($_POST['title']) && isset($_POST['event_date']) && isset($_POST['location']) && isset($_POST['capacity']) && isset($_POST['organizer_id'])) {
    
    $title = trim($_POST['title']);
    $description = isset($_POST['description']) ? trim($_POST['description']) : '';
    $category = isset($_POST['category']) ? trim($_POST['category']) : 'General';
    $event_date = $_POST['event_date'];
    $location = trim($_POST['location']);
    $capacity = (int)$_POST['capacity'];
    $organizer_id = (int)$_POST['organizer_id'];
    
    // Check if the user is an Organizer or Admin
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$organizer_id]);
    $user = $stmt->fetch();
    
    if (!$user || ($user['role'] !== 'Organizer' && $user['role'] !== 'Admin')) {
        echo json_encode(["status" => "error", "message" => "Unauthorized. Only Organizers or Admins can create events."]);
        exit;
    }

    $image_url_val = null;

    // Handle Image Upload if present
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['image'];
        $maxSize = 5 * 1024 * 1024; // 5MB
        if ($file['size'] > $maxSize) {
            echo json_encode(["status" => "error", "message" => "Image exceeds 5MB limit."]);
            exit;
        }

        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime, $allowedMimeTypes)) {
            echo json_encode(["status" => "error", "message" => "Invalid image format. Only JPG, PNG, GIF, and WEBP."]);
            exit;
        }

        $uploadDir = __DIR__ . '/../../uploads/events/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = "event_" . time() . "_" . rand(1000, 9999) . "." . strtolower($ext);
        $targetPath = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $image_url_val = "backend/uploads/events/" . $filename;
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to securely save uploaded image."]);
            exit;
        }
    }

    $stmt = $pdo->prepare("INSERT INTO events (title, description, category, event_date, location, capacity, organizer_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    if ($stmt->execute([$title, $description, $category, $event_date, $location, $capacity, $organizer_id, $image_url_val])) {
        echo json_encode(["status" => "success", "message" => "Event created successfully.", "event_id" => $pdo->lastInsertId()]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to create event. Details: " . implode(" ", $stmt->errorInfo())]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Missing required event fields."]);
}
?>
