import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createConnection } from 'mysql';

// Setup Express and HTTP server
const app = express();
const server = createServer(app);
const io = new Server(server,{
    cors: {
        origin: "*", // This allows all domains. For production, specify your domain e.g., "http://example.com"
        methods: ["GET", "POST", "UPDATE"], // Allowed HTTP methods
        //allowedHeaders: ["my-custom-header"], // Custom headers here
        credentials: true // This allows cookies and credentials to be sent along with the request
    }
}
);

const host = 'http://localhost';

// Setup MySQL connection
const db = createConnection({
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
  socket.on('submit_pixels', (data) => {
    UpdateClientLastInteraction(socket.id);
    //console.log('Data received:', data);
    fetch(host+'/Pixels.php', {
        method: 'POST',
        body: data,
      })
      .then(response => {
        if (!response.ok) {
          console.error('Error submitting form data');
        }

      })
      .then(()=>{
        BroadCastPixels(io);
      })
      .catch(error => {
        console.error('Error:', error);
    });
  });

  socket.on('get_pixels', () => {
    UpdateClientLastInteraction(socket.id);
    console.log(socket.id, 'requested pixels')
    fetch(host+'/Pixels.php',{method: 'GET'})
    .then(response => {
      if (!response.ok) {
        console.error('Error fetching pixels');
      }
      return response.json();
    })
    .then(data => {
        console.log('Get pixels:', data);
      socket.emit('refresh_pixels', data);
    })
    .catch(error => console.error('Get pixels Error:', error));
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

function BroadCastPixels(io)
{
  fetch(host+'/Pixels.php',{method: 'GET'})
  .then(response =>{
    if (!response.ok) {
      console.error('Error fetching pixels');
    }
    return response.json();
  } )
  .then(data => {
    io.emit('refresh_pixels', data)
    })
  .catch(error => console.error('Broadcast pixels Error:', error));
}