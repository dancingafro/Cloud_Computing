
<?php include "../inc/dbinfo.inc"; ?>
<html>
<body>
<h1>Attendance of ICT123</h1>
<?php

  /* Connect to MySQL and select the database. */
  $connection = mysqli_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD);

    if (mysqli_connect_errno()) echo "Failed to connect to MySQL: " . mysqli_connect_error();

    $database = mysqli_select_db($connection, DB_DATABASE);

      /* Ensure that the attendance table exists. */
      VerifyTable($connection, DB_DATABASE);

      /* If input fields are populated, add a row to the EMPLOYEES table. */
      $studentid = htmlentities($_POST['STUDENTID']);
        $name = htmlentities($_POST['NAME']);

        if (strlen($studentid) || strlen($name)) {
		    AddAttendance($connection, $studentid, $name);
		      }
?>

<!-- Input form -->
<form action="<?PHP echo $_SERVER['SCRIPT_NAME'] ?>" method="POST">
  <table border="0">
    <tr>
      <td>STUDENTID</td>
      <td>NAME</td>
    </tr>
    <tr>
      <td>
        <input type="text" name="STUDENTID" maxlength="45" size="30" />
      </td>
      <td>
        <input type="text" name="NAME" maxlength="90" size="60" />
      </td>
      <td>
        <input type="submit" value="Add" />
      </td>
    </tr>
  </table>
</form>

<h2> -------------------------------------------------------------------------------------------</h2>

<!-- Display table data. -->
<table border="1" cellpadding="2" cellspacing="2">
  <tr>
    <td>ID</td>
    <td>STUDENTID</td>
    <td>NAME     </td>
    <td>TIME</td>
  </tr>

<?php

	$result = mysqli_query($connection, "SELECT * FROM ICT123");

	while($query_data = mysqli_fetch_row($result)) {
		  echo "<tr>";
		    echo "<td>",$query_data[0], "</td>",
			 "<td>",$query_data[1], "</td>",
			 "<td>",$query_data[2], "</td>",
		         "<td>",$query_data[3], "</td>";
		    echo "</tr>";
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
	  function AddAttendance($connection, $studentid, $name) {
		     $n = mysqli_real_escape_string($connection, $studentid);
		        $a = mysqli_real_escape_string($connection, $name);

		        $query = "INSERT INTO ICT123 (STUDENTID, NAME) VALUES ('$n', '$a');";

			   if(!mysqli_query($connection, $query)) echo("<p>Error adding data.</p>");
	  }

	  /* Check whether the table exists and, if not, create it. */
	  function VerifyTable($connection, $dbName) {
		    if(!TableExists("ICT123", $connection, $dbName))
			      {
				           $query = "CREATE TABLE ICT123 (
						            ID int(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
							    STUDENTID VARCHAR(45),
							    NAME VARCHAR(90),
							    TIME DATETIME DEFAULT CURRENT_TIMESTAMP
									  )";

     if(!mysqli_query($connection, $query)) echo("<p>Error creating table.</p>");
  }
	  }

	  /* Check for the existence of a table. */
	  function TableExists($tableName, $connection, $dbName) {
		    $t = mysqli_real_escape_string($connection, $tableName);
			$d = mysqli_real_escape_string($connection, $dbName);

			$checktable = mysqli_query($connection, "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_NAME = '$t' AND TABLE_SCHEMA = '$d'");

			if(mysqli_num_rows($checktable) > 0) return true;

			return false;
	  }
?>                        
                
