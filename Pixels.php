<?php include "dbinfo.inc"; ?>
<?php
/* Connect to MySQL and select the database. */
$connection = mysqli_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD);
if (mysqli_connect_errno()) echo "Failed to connect to MySQL: " . mysqli_connect_error();
$database = mysqli_select_db($connection, DB_DATABASE);
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $data = json_decode(file_get_contents('php://input'));

    // Check if data is an array
    if (is_array($data)) {
        foreach ($data as $item) {
            // Check if both 'key' and 'color' are set for this item
            if (isset($item->key) && isset($item->color)) {
                $key = mysqli_real_escape_string($connection, $item->key);
                $color = mysqli_real_escape_string($connection, $item->color);
                
                // Prepare the check query
                $checkQuery = "SELECT * FROM PIXELS WHERE PIXEL_KEY = '$key'";
                $checkResult = mysqli_query($connection, $checkQuery);
                
                if (mysqli_num_rows($checkResult) > 0) {
                    // If a record exists, update it
                    $updateQuery = "UPDATE PIXELS SET COLOR = '$color' WHERE PIXEL_KEY = '$key'";
                    mysqli_query($connection, $updateQuery);
                    echo "Record with key $key updated successfully. ";
                } else {
                    // If no record exists, insert a new one
                    $insertQuery = "INSERT INTO PIXELS (PIXEL_KEY, COLOR) VALUES ('$key', '$color')";
                    mysqli_query($connection, $insertQuery);
                    echo "New record with key $key inserted successfully. ";
                }
            } else {
                echo "Missing key or color for some items. ";
            }
        }
    } else {
        echo "Invalid data format. ";
    }
} 
else if ($_SERVER["REQUEST_METHOD"] == "GET") 
{
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
}
else 
{
    echo "Error: This script only accepts POST or GET requests.";
}
?>