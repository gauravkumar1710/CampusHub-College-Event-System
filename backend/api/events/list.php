<?php
header("Content-Type: application/json");
require_once '../../config.php';

$organizer_id = isset($_GET['organizer_id']) ? (int)$_GET['organizer_id'] : null;

try {
    if ($organizer_id) {
        $stmt = $pdo->prepare("
            SELECT e.*, u.name as organizer_name, 
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) as registered_count 
            FROM events e 
            JOIN users u ON e.organizer_id = u.id 
            WHERE e.organizer_id = ? 
            ORDER BY e.event_date DESC
        ");
        $stmt->execute([$organizer_id]);
    } else {
        $stmt = $pdo->query("
            SELECT e.*, u.name as organizer_name,
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) as registered_count 
            FROM events e 
            JOIN users u ON e.organizer_id = u.id 
            ORDER BY e.event_date DESC
        ");
    }
    
    $events = $stmt->fetchAll();
    echo json_encode(["status" => "success", "events" => $events]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Failed to fetch events: " . $e->getMessage()]);
}
?>
