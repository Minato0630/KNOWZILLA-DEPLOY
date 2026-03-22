<?php
require_once __DIR__ . '/vendor/autoload.php';
include __DIR__ . '/config/db.php';

// Process form data
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST['name'];
    $phone = $_POST['phone'];
    $email = $_POST['email'];
    $message = $_POST['message'];

    // Check if required fields are empty
    if (empty($name) || empty($email) || empty($message)) {
        header("Location: contact.html?error=empty_fields");
        exit();
    }

    // Insert into database
    $contact = getCollection('contact');
    $contact->insertOne([
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'message' => $message,
        'submitted_at' => new \DateTime()
    ]);
    // Redirect to contact.html with success message
    header("Location: contact.html?success=1");
    exit();
}

?>

