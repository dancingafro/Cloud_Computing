<?php
/* Connect to MySQL and select the database. */
$connection = mysqli_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD);
if (mysqli_connect_errno()) echo "Failed to connect to MySQL: " . mysqli_connect_error();
$database = mysqli_select_db($connection, DB_DATABASE);
$result = mysqli_query($connection, "SELECT * FROM PIXELS");
// Initialize an array to store the results
$data = array();
// Loop through the query results and add each row to the data array
while ($query_data = mysqli_fetch_assoc($result)) {
    $data[] = $query_data;
}
// Set the content type to JSON
header('Content-Type: application/json');
// Output JSON data
echo json_encode($data);
?>