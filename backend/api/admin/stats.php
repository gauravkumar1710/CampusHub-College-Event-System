<?php
header("Content-Type: application/json");
require_once '../../config.php';

// Accept admin_id via query param to verify role
$admin_id = isset($_GET['admin_id']) ? (int)$_GET['admin_id'] : null;

if (!$admin_id) {
    echo json_encode(["status" => "error", "message" => "Admin ID required."]);
    exit;
}

// Verify admin
$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$admin_id]);
$user = $stmt->fetch();

if (!$user || $user['role'] !== 'Admin') {
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit;
}

try {
    $stats = [];
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
    $stats['total_users'] = $stmt->fetch()['total'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users WHERE role = 'Student'");
    $stats['total_students'] = $stmt->fetch()['total'];

    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users WHERE role = 'Organizer'");
    $stats['total_organizers'] = $stmt->fetch()['total'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM events");
    $stats['total_events'] = $stmt->fetch()['total'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM registrations");
    $stats['total_registrations'] = $stmt->fetch()['total'];
    
    $stmt = $pdo->query("SELECT title, event_date FROM events ORDER BY created_at DESC LIMIT 5");
    $stats['recent_events'] = $stmt->fetchAll();

    echo json_encode(["status" => "success", "stats" => $stats]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Failed to fetch stats: " . $e->getMessage()]);
}
?>
