<?php
header("Content-Type: application/json");
require_once '../../config.php';

$data = json_decode(file_get_contents("php://input"));

if (isset($data->email) && isset($data->password)) {
    $email = trim($data->email);
    $password = $data->password;
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Return user data (excluding password)
        unset($user['password']);
        echo json_encode([
            "status" => "success",
            "message" => "Login successful.",
            "user" => $user
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid credentials."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid input data. Email and password required."]);
}
?>
