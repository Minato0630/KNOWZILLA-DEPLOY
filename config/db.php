<?php
function getMongoDB() {
    static $db = null;
    if ($db === null) {
        try {
$uri = $_ENV['MONGODB_URI'] ?? getenv('MONGODB_URI') ?? 'mongodb+srv://knowzilla_admin:Knowzilla123@knowzilla.1che8oy.mongodb.net/?appName=knowzilla/knowzilla';
$client = new MongoDB\Client($uri);
            $db = $client->selectDatabase("user_management");
        } catch (Exception $e) {
            die("MongoDB connection failed: " . $e->getMessage());
        }
    }
    return $db;
}

function getCollection($collectionName) {
    $db = getMongoDB();
    return $db->selectCollection($collectionName);
}
?>

