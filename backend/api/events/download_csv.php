<?php
require_once '../../config.php';

$event_id = isset($_GET['event_id']) ? (int)$_GET['event_id'] : null;
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

if (!$event_id || !$user_id) {
    die("Missing event_id or user_id.");
}

// 1. Verify user is Admin OR Organizer of THIS event
$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!$user) {
    die("Unauthorized user.");
}

$stmt = $pdo->prepare("SELECT title, organizer_id FROM events WHERE id = ?");
$stmt->execute([$event_id]);
$event = $stmt->fetch();

if (!$event) {
    die("Event not found.");
}

// Check authorization
if ($user['role'] !== 'Admin' && ($user['role'] !== 'Organizer' || $event['organizer_id'] != $user_id)) {
    die("Unauthorized access. You must be an Admin or the Organizer of this event to download registrations.");
}

// 2. Fetch registrations
$stmt = $pdo->prepare("
    SELECT u.name as student_name, u.email as student_email, r.roll_no, r.section, r.college, r.course, r.registered_at
    FROM registrations r
    JOIN users u ON r.student_id = u.id
    WHERE r.event_id = ?
    ORDER BY r.registered_at ASC
");
$stmt->execute([$event_id]);
$registrations = $stmt->fetchAll();

// 3. Output CSV
$safeTitle = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $event['title']);
$filename = "registrations_{$safeTitle}.csv";

header("Content-Type: text/csv");
header("Content-Disposition: attachment; filename=\"$filename\"");
header("Pragma: no-cache");
header("Expires: 0");

$output = fopen("php://output", "w");
fputcsv($output, ["Student Name", "Email", "Roll No", "Section", "College", "Course", "Registration Date"]);

foreach ($registrations as $row) {
    fputcsv($output, [
        $row['student_name'],
        $row['student_email'],
        $row['roll_no'],
        $row['section'],
        $row['college'],
        $row['course'],
        $row['registered_at']
    ]);
}
fclose($output);
exit;
?>
