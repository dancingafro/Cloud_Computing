
<?php include "../inc/dbinfo.inc"; ?>
<html>
<body>
<h1>Edit Users Page</h1>
<?php

  /* Connect to MySQL and select the database. */
  $connection = mysqli_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD);

    if (mysqli_connect_errno()) echo "Failed to connect to MySQL: " . mysqli_connect_error();

    $database = mysqli_select_db($connection, DB_DATABASE);

      /* Ensure that the attendance table exists. */
      VerifyTable($connection, DB_DATABASE);

    // Get input data
$id = isset($_POST['id']) ? (int)$_POST['id'] : 0; // Cast ID to integer for security
$email = htmlentities($_POST['email']);

    // Decide to add or update based on if ID is provided
if ($id > 0) {
        // Update record
    UpdateRecord($connection, $id, $email);
} else {
        // Add new record
    if (strlen($studentid))
        {
            AddData($connection, $email);

        }
}



?>

<h2> -------------------------------------------------------------------------------------------</h2>

<!-- Display table data. -->
<table border="1" cellpadding="2" cellspacing="2">
  <tr>
    <td>ID</td>
    <td>Emails</td>
  </tr>

<?php

	$result = mysqli_query($connection, "SELECT * FROM users");

//	while($query_data = mysqli_fetch_row($result)) {
//		  echo "<tr>";
//		    echo "<td>",$query_data[0], "</td>",
//			 "<td>",$query_data[1], "</td>",
//			 "<td>",$query_data[2], "</td>",
//		         "<td>",$query_data[3], "</td>";
//
//        echo '<td><button type="submit" name="edit" value="', $query_data[0], '">Edit</button></td>';
//		    echo "</tr>";
//	}
while($query_data = mysqli_fetch_row($result)) {
        // Start of the form for each row
    echo '<form method="POST" action="' . htmlspecialchars($_SERVER["PHP_SELF"]) . '">';
    echo "<tr>";
    echo "<td><input type='text' readonly name='id' value='".$query_data[0]."'></td>",
    "<td><input type='text' name='Email' value='".$query_data[1]."'></td>",
    
        // Save button - to submit the form
    echo '<td><input type="submit" name="update" value="Save"></td>';
    
    echo "</tr>";
    echo '</form>';
}


?>


</table>

<!-- Clean up. -->
<?php

	  mysqli_free_result($result);
	  mysqli_close($connection);

?>

</body>
</html>


<?php

	  /* Add an attendance to the table. */
	  function AddData($connection, $email) {
		     $n = mysqli_real_escape_string($connection, $email);

		        $query = "INSERT INTO users (email) VALUES ('$n');";

			   if(!mysqli_query($connection, $query)) echo("<p>Error adding data.</p>");
	  }

	  /* Check whether the table exists and, if not, create it. */
	  function VerifyTable($connection, $dbName) {
		    if(!TableExists("users", $connection, $dbName))
			      {
				           $query = "CREATE TABLE users (
						            id int(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
							    email VARCHAR(90),
									  )";

     if(!mysqli_query($connection, $query)) echo("<p>Error creating table.</p>");
  }
	  }

	  /* Check for the existence of a table. */
	  function TableExists($tableName, $connection, $dbName) {
		    $t = mysqli_real_escape_string($connection, $tableName);
		      $d = mysqli_real_escape_string($connection, $dbName);

		      $checktable = mysqli_query($connection,
			            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_NAME = '$t' AND TABLE_SCHEMA = '$d'");

		        if(mysqli_num_rows($checktable) > 0) return true;

		        return false;
	  }


function UpdateRecord($connection, $id, $email)
{
    $id = mysqli_real_escape_string($connection, $id);
    $studentid = mysqli_real_escape_string($connection, $studentid);
    
    $query = "UPDATE users SET email = '$email' WHERE id = $id";
    
    if (mysqli_query($connection, $query)) {
            // Data updated successfully, redirect to avoid form resubmission
        header('Location: ' . $_SERVER['PHP_SELF']);
        exit;
    } else {
        echo("<p>Error updating data.</p>");
    }
    echo ("Done updating");
}

?>                        
                
