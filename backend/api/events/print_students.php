<?php
require_once '../../config.php';

$event_id = isset($_GET['event_id']) ? (int)$_GET['event_id'] : null;
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

if (!$event_id || !$user_id) die("Missing required parameters.");

$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!$user) die("Unauthorized.");

$stmt = $pdo->prepare("SELECT title, organizer_id, event_date, location FROM events WHERE id = ?");
$stmt->execute([$event_id]);
$event = $stmt->fetch();

if (!$event) die("Event not found.");

if ($user['role'] !== 'Admin' && ($user['role'] !== 'Organizer' || $event['organizer_id'] != $user_id)) {
    die("Unauthorized.");
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
?>
<!DOCTYPE html>
<html>
<head>
    <title>Registration List - <?php echo htmlspecialchars($event['title']); ?></title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; padding: 40px; }
        h1 { font-size: 24px; margin-bottom: 5px; color: #4F46E5; }
        h3 { font-size: 14px; margin-bottom: 30px; color: #666; font-weight: normal; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f4f4f5; font-weight: bold; text-transform: uppercase; font-size: 11px; }
        @media print {
            body { padding: 0; }
            button { display: none; }
        }
    </style>
</head>
<body onload="window.print()">
    <button onclick="window.print()" style="float:right; padding:10px 20px; background:#4F46E5; color:white; border:none; border-radius:6px; cursor:pointer;">Print / Save as PDF</button>
    <h1><?php echo htmlspecialchars($event['title']); ?> - Attendee Roster</h1>
    <h3>Date: <?php echo date('F j, Y', strtotime($event['event_date'])); ?> | Total Registered: <?php echo count($registrations); ?></h3>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Roll No</th>
                <th>Course Details</th>
                <th>Registered At</th>
            </tr>
        </thead>
        <tbody>
            <?php if (count($registrations) > 0): ?>
                <?php foreach ($registrations as $index => $row): ?>
                    <tr>
                        <td><?php echo $index + 1; ?></td>
                        <td><?php echo htmlspecialchars($row['name']); ?></td>
                        <td><?php echo htmlspecialchars($row['email']); ?></td>
                        <td><?php echo htmlspecialchars($row['roll_no']); ?></td>
                        <td><?php echo htmlspecialchars($row['course'] . ($row['section'] ? ' - ' . $row['section'] : '')); ?></td>
                        <td><?php echo date('M j, Y h:i A', strtotime($row['registered_at'])); ?></td>
                    </tr>
                <?php endforeach; ?>
            <?php else: ?>
                <tr><td colspan="6" style="text-align:center; padding: 20px;">No registrations found.</td></tr>
            <?php endif; ?>
        </tbody>
    </table>
</body>
</html>
