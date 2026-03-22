<?php
require_once __DIR__ . '/vendor/autoload.php';
include __DIR__ . '/config/db.php';

// Process form data
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];

    // Check if email is empty
    if (empty($email)) {
        header("Location: about.html?error=empty_email");
        exit();
    }

    // Insert into database
    $subscriptions = getCollection('subscriptions');
    try {
        $subscriptions->insertOne([
            'email' => $email,
            'subscribed_at' => new \DateTime()
        ]);
        // Redirect to about.html with success message
        header("Location: about.html?success=1");
        exit();
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'E11000') !== false) {
            header("Location: about.html?error=duplicate_email");
        } else {
            header("Location: about.html?error=unknown");
        }
        exit();
    }
}

?>

