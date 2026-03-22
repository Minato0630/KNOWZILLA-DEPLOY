<?php
require_once __DIR__ . '/vendor/autoload.php';
include __DIR__ . '/config/db.php';

$reviews = getCollection('reviews');

$reviewsCursor = $reviews->find([], ['sort' => ['submitted_at' => -1]]);
echo "<h2>User Reviews</h2>";
$reviewsList = iterator_to_array($reviewsCursor);
if (count($reviewsList) > 0) {
    foreach ($reviewsList as $row) {
        echo "<div style='border: 1px solid #ddd; padding: 10px; margin: 10px;'>";
        echo "<strong>" . htmlspecialchars($row['name']) . " (" . htmlspecialchars($row['email']) . ")</strong><br>";
        echo "<p>" . nl2br(htmlspecialchars($row['message'])) . "</p>";
        echo "<small>Submitted on: " . $row['submitted_at'] . "</small>";
        echo "</div>";
    }
} else {
    echo "No reviews yet!";
}

?>

