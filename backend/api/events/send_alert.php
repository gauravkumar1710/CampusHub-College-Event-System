<?php
header("Content-Type: application/json");
require_once '../../config.php';
require_once '../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$data = json_decode(file_get_contents("php://input"));

if (isset($data->event_id) && isset($data->admin_id) && isset($data->message)) {
    $event_id = (int)$data->event_id;
    $admin_id = (int)$data->admin_id;
    $message = trim($data->message);
    
    if (empty($message)) {
        echo json_encode(["status" => "error", "message" => "Message cannot be empty."]);
        exit;
    }

    // Verify Admin or Organizer permission
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$admin_id]);
    $user = $stmt->fetch();
    
    if (!$user || ($user['role'] !== 'Admin' && $user['role'] !== 'Organizer')) {
        echo json_encode(["status" => "error", "message" => "Unauthorized. Only Admins or Organizers can send alerts."]);
        exit;
    }
    
    // For organizers, ensure they own the event
    if ($user['role'] === 'Organizer') {
        $stmt = $pdo->prepare("SELECT id, title FROM events WHERE id = ? AND organizer_id = ?");
        $stmt->execute([$event_id, $admin_id]);
    } else {
        $stmt = $pdo->prepare("SELECT id, title FROM events WHERE id = ?");
        $stmt->execute([$event_id]);
    }
    
    $event = $stmt->fetch();
    if (!$event) {
        echo json_encode(["status" => "error", "message" => "Event not found or unauthorized access."]);
        exit;
    }

    // Fetch all registered students
    $stmt = $pdo->prepare("
        SELECT u.email, u.name 
        FROM registrations r 
        JOIN users u ON r.student_id = u.id 
        WHERE r.event_id = ?
    ");
    $stmt->execute([$event_id]);
    $attendees = $stmt->fetchAll();
    
    if (count($attendees) === 0) {
        echo json_encode(["status" => "error", "message" => "No attendees found for this event."]);
        exit;
    }

    // Initialize PHPMailer
    $mail = new PHPMailer(true);
    
    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->Port       = SMTP_PORT;
        
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        
        // Add all attendees as BCC so they don't see each other's emails
        foreach ($attendees as $attendee) {
            $mail->addBCC($attendee['email'], $attendee['name']);
        }

        // Content
        $mail->isHTML(true);
        $mail->Subject = "Important Update: " . $event['title'];
        $mail->Body    = "
            <div style='font-family: Arial, sans-serif; padding: 20px; color: #333;'>
                <h2 style='color: #4F46E5;'>CampusHub Event Alert</h2>
                <p><strong>Event:</strong> {$event['title']}</p>
                <hr style='border: 1px solid #eee;' />
                <p>" . nl2br(htmlspecialchars($message)) . "</p>
                <br>
                <p style='font-size: 0.9em; color: #777;'>Sent by CampusHub Administration</p>
            </div>
        ";
        $mail->AltBody = strip_tags($message); // Plain text fallback

        $mail->send();
        echo json_encode(["status" => "success", "message" => "Alert email sent to " . count($attendees) . " attendees."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Message could not be sent. Mailer Error: {$mail->ErrorInfo}"]);
    }

} else {
    echo json_encode(["status" => "error", "message" => "Missing required fields."]);
}
?>
