const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql');

// Setup Express and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Setup MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'my_database'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to the database.');
});

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  // Store client info in the database
  const query = "INSERT INTO connected_clients (socket_id) VALUES (?)";
  db.query(query, [socket.id], (err, result) => {
    if (err) throw err;
    console.log(`Client ${socket.id} added to the database.`);
  });

  // Listen for data update requests from clients
  socket.on('updateData', (data) => {
    // Assuming data has properties `tableName` and `newValue`
    const updateQuery = `UPDATE ${data.tableName} SET value = ? WHERE id = 1`; // Example query
    db.query(updateQuery, [data.newValue], (err, result) => {
      if (err) {
        socket.emit('updateStatus', 'Error updating database');
        throw err;
      }
      console.log(`Database updated. Rows affected: ${result.affectedRows}`);
      socket.emit('updateStatus', 'Database update completed');
    });
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected ${socket.id}`);
    // Remove client info from the database
    const deleteQuery = "DELETE FROM connected_clients WHERE socket_id = ?";
    db.query(deleteQuery, [socket.id], (err, result) => {
      if (err) throw err;
      console.log(`Client ${socket.id} removed from the database.`);
    });
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});

setInterval(() => {
    const thresholdMinutes = 10; // Duration to consider a client inactive
    const removeInactiveClientsQuery = `
      DELETE FROM connected_clients 
      WHERE last_interaction < (NOW() - INTERVAL ? MINUTE)
    `;
  
    db.query(removeInactiveClientsQuery, [thresholdMinutes], (err, result) => {
      if (err) throw err;
      if (result.affectedRows > 0) {
        console.log(`Removed ${result.affectedRows} inactive clients.`);
      }
    });
}, 60000); // Check every minute (60000 milliseconds)

function UpdateClientLastInteraction(socketId){
    const updateTimestampQuery = "UPDATE connected_clients SET last_interaction = NOW() WHERE socket_id = ?";
    db.query(updateTimestampQuery, [socketId], (err, result) => {
      if (err) throw err;
      console.log(`Updated last interaction for client ${socketId}.`);
    });
}