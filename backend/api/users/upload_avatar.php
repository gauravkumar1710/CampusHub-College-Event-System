<?php
require_once '../../config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
    exit;
}

if (!isset($_POST['user_id']) || !isset($_FILES['avatar'])) {
    echo json_encode(["status" => "error", "message" => "User ID and avatar file are required."]);
    exit;
}

$user_id = (int)$_POST['user_id'];
$file = $_FILES['avatar'];

// Basic validation
if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["status" => "error", "message" => "File upload error code: " . $file['error']]);
    exit;
}

$maxSize = 5 * 1024 * 1024; // 5MB limit
if ($file['size'] > $maxSize) {
    echo json_encode(["status" => "error", "message" => "File exceeds 5MB limit."]);
    exit;
}

$allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, $allowedMimeTypes)) {
    echo json_encode(["status" => "error", "message" => "Invalid file format. Only JPG, PNG, GIF, and WEBP are allowed."]);
    exit;
}

// Ensure dir exists
$uploadDir = __DIR__ . '/../../uploads/avatars/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Secure filename
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = "user_{$user_id}_" . time() . "." . strtolower($ext);
$targetPath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $relativePath = "backend/uploads/avatars/" . $filename;
    
    try {
        // Clean up old avatar if it exists
        $stmt = $pdo->prepare("SELECT profile_picture FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $oldUser = $stmt->fetch();
        if ($oldUser && $oldUser['profile_picture']) {
            $oldPath = __DIR__ . '/../../../' . $oldUser['profile_picture'];
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        // Update Database
        $stmtUpdate = $pdo->prepare("UPDATE users SET profile_picture = ? WHERE id = ?");
        $stmtUpdate->execute([$relativePath, $user_id]);

        echo json_encode([
            "status" => "success", 
            "message" => "Avatar uploaded successfully.",
            "profile_picture" => $relativePath
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error.", "details" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Failed to move uploaded file."]);
}
?>
