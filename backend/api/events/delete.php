<?php
require_once __DIR__ . '/../../config.php';
header('Content-Type: application/json');

// Ensure request is POST or DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->event_id) || !isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "Missing required fields."]);
    exit;
}

$event_id = $data->event_id;
$user_id = $data->user_id;

// Validate user and ownership
try {
    // Check user role
    $stmtUser = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmtUser->execute([$user_id]);
    $user = $stmtUser->fetch();

    if (!$user) {
        echo json_encode(["status" => "error", "message" => "User not found."]);
        exit;
    }

    $role = $user['role'];

    // Check event ownership
    $stmtEvent = $pdo->prepare("SELECT organizer_id FROM events WHERE id = ?");
    $stmtEvent->execute([$event_id]);
    $event = $stmtEvent->fetch();

    if (!$event) {
        echo json_encode(["status" => "error", "message" => "Event not found."]);
        exit;
    }

    // Admins can delete any event. Organizers can only delete their own.
    if ($role !== 'Admin' && ($role !== 'Organizer' || $event['organizer_id'] != $user_id)) {
        echo json_encode(["status" => "error", "message" => "Unauthorized. You cannot delete this event."]);
        exit;
    }

    // Delete event (Registrations cascade automatically due to foreign key constraints in SQLite)
    $stmtDel = $pdo->prepare("DELETE FROM events WHERE id = ?");
    $stmtDel->execute([$event_id]);

    echo json_encode(["status" => "success", "message" => "Event successfully deleted."]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error.", "details" => $e->getMessage()]);
}
?>
