<?php
require_once __DIR__ . '/vendor/autoload.php';
include __DIR__ . '/config/db.php';

// Process form data
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST['name'];
    $phone = $_POST['phone'];
    $email = $_POST['email'];
    $message = $_POST['message'];

    // Insert into database
    $reviews = getCollection('reviews');
    $reviews->insertOne([
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'message' => $message,
        'submitted_at' => new \DateTime()
    ]);
    // Redirect to index.html with success message
    header("Location: index.html?success=1");
    exit();
}

?>

