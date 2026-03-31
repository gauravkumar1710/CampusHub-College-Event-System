<?php
header("Content-Type: application/json");
require_once '../../config.php';

$data = json_decode(file_get_contents("php://input"));

if (isset($data->name) && isset($data->email) && isset($data->password)) {
    $name = trim($data->name);
    $email = trim($data->email);
    // Hash password
    $password = password_hash($data->password, PASSWORD_DEFAULT);
    // Default role is Student
    $role = isset($data->role) && in_array($data->role, ['Student', 'Organizer', 'Admin']) ? $data->role : 'Student';
    
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->rowCount() > 0) {
        echo json_encode(["status" => "error", "message" => "Email already registered."]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    if ($stmt->execute([$name, $email, $password, $role])) {
        echo json_encode(["status" => "success", "message" => "User registered successfully."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Registration failed due to a database error."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid input data. Name, email, and password required."]);
}
?>
