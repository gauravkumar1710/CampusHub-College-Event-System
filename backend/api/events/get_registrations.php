<?php
require_once '../../config.php';
header('Content-Type: application/json');

$event_id = isset($_GET['event_id']) ? (int)$_GET['event_id'] : null;
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

if (!$event_id || !$user_id) {
    echo json_encode(["status" => "error", "message" => "Missing event_id or user_id."]);
    exit;
}

$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit;
}

$stmt = $pdo->prepare("SELECT title, organizer_id FROM events WHERE id = ?");
$stmt->execute([$event_id]);
$event = $stmt->fetch();

if (!$event) {
    echo json_encode(["status" => "error", "message" => "Event not found."]);
    exit;
}

if ($user['role'] !== 'Admin' && ($user['role'] !== 'Organizer' || $event['organizer_id'] != $user_id)) {
    echo json_encode(["status" => "error", "message" => "Unauthorized. You cannot view these registrations."]);
    exit;
}

$stmt = $pdo->prepare("
    SELECT u.name, u.email, r.roll_no, r.course, r.section, r.college, r.registered_at
    FROM registrations r
    JOIN users u ON r.student_id = u.id
    WHERE r.event_id = ?
    ORDER BY r.registered_at ASC
");
$stmt->execute([$event_id]);
$registrations = $stmt->fetchAll();

echo json_encode(["status" => "success", "registrations" => $registrations]);
?>
