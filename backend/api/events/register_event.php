<?php
header("Content-Type: application/json");
require_once '../../config.php';

$data = json_decode(file_get_contents("php://input"));

if (isset($data->event_id) && isset($data->student_id)) {
    $event_id = (int)$data->event_id;
    $student_id = (int)$data->student_id;
    
    // Additional form fields
    $roll_no = isset($data->roll_no) ? trim($data->roll_no) : null;
    $section = isset($data->section) ? trim($data->section) : null;
    $college = isset($data->college) ? trim($data->college) : null;
    $course = isset($data->course) ? trim($data->course) : null;
    
    // Check if event exists and has capacity
    $stmt = $pdo->prepare("
        SELECT capacity, 
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = events.id) as registered_count 
        FROM events WHERE id = ?
    ");
    $stmt->execute([$event_id]);
    $event = $stmt->fetch();
    
    if (!$event) {
        echo json_encode(["status" => "error", "message" => "Event not found."]);
        exit;
    }
    
    if ($event['registered_count'] >= $event['capacity']) {
        echo json_encode(["status" => "error", "message" => "Event is already full."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO registrations (event_id, student_id, roll_no, section, college, course) VALUES (?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([$event_id, $student_id, $roll_no, $section, $college, $course])) {
            echo json_encode(["status" => "success", "message" => "Successfully registered for the event."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Registration failed."]);
        }
    } catch (PDOException $e) {
        // Handle duplicate key error
        if ($e->getCode() == 23000 || $e->getCode() == 1062) {
            echo json_encode(["status" => "error", "message" => "You are already registered for this event."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Database error.", "details" => $e->getMessage()]);
        }
    }
} else {
    echo json_encode(["status" => "error", "message" => "Missing event_id or student_id."]);
}
?>
