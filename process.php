<?php
session_start();

require_once __DIR__ . '/vendor/autoload.php';
include __DIR__ . '/config/.env';
include __DIR__ . '/config/db.php';

// Handle signup
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['signup'])) {
    $name = $_POST['name'];
    $registration_no = $_POST['registration_no'];
    $email = $_POST['email'];
    $phone_no = $_POST['phone_no'];
    $class = $_POST['class'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // Check if registration number already exists
    $users = getCollection('users');
    $existingUser = $users->findOne(['registration_no' => $registration_no]);

    if ($existingUser !== null) {
        echo "Registration number already exists. Please use a different one.";
    } else {
        $users->insertOne([
            'name' => $name,
            'registration_no' => $registration_no,
            'email' => $email,
            'phone_no' => $phone_no,
            'class' => $class,
            'password' => $password,
            'created_at' => new \DateTime()
        ]);
        $_SESSION['username'] = $name;
        header("Location: index.html");
        exit();
    }
}

// Handle login
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['login'])) {
    $registration_no = $_POST['registration_no'];
    $password = $_POST['password'];

    $users = getCollection('users');
    $user = $users->findOne(['registration_no' => $registration_no]);

    if ($user !== null) {
        if (password_verify($password, $user['password'])) {
            $_SESSION['username'] = $user['name']; // Store username in session
            header("Location: index.html"); // Redirect to the index page
            exit();
        } else {
            echo "Invalid password.";
        }
    } else {
        echo "No user found with that registration number.";
    }
}

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: login.html"); // Redirect to the login page
    exit();
}
?>