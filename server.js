import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createConnection, escape} from 'mysql';
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
    updateClientLastInteraction(socket.id);
    //console.log('Data received:', data);
    (async () => {
        try {
          await updatePixelsData(db, data);
          broadCastPixels(io);
          
        } catch (error) {
          console.error('Failed to get pixels from database:', error);
        }
      })();
  });

  socket.on('get_pixels', () => {
    updateClientLastInteraction(socket.id);
    (async () => {
        try {
          const pixels = await getPixelsData(db);
          socket.emit('refresh_pixels', pixels);
        } catch (error) {
          console.error('Failed to get pixels from database:', error);
        }
      })();
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

function updateClientLastInteraction(socketId){
    const updateTimestampQuery = "UPDATE connected_clients SET last_interaction = NOW() WHERE socket_id = ?";
    db.query(updateTimestampQuery, [socketId], (err, result) => {
      if (err) throw err;
      console.log(`Updated last interaction for client ${socketId}.`);
    });
}


// Utility function to make MySQL queries return promises
function queryAsync(connection, query) {
    return new Promise((resolve, reject) => {
      connection.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
}

// Make sure to mark the function as async
async function getPixelsData(connection) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM PIXELS';
      
      connection.query(query, (err, results) => {
        if (err) {
          console.error('Error executing query:', err);
          reject(err); // Reject the Promise if there's an error
        } else {
          resolve(results); // Resolve the Promise with the query results
        }
      });
    });
}


async function updatePixelsData(connection, data) {
    if (Array.isArray(data)) {
      for (let item of data) {
        if (item.key && item.color) {
          const key = escape(item.key);
          const color = escape(item.color);
          try {
            const checkQuery = `SELECT * FROM PIXELS WHERE PIXEL_KEY = ${key}`;
            const [queryResult] = await queryAsync(connection, checkQuery);
  
            if (queryResult && queryResult.length > 0) {
              // If a record exists, update it
              const updateQuery = `UPDATE PIXELS SET COLOR = ${color} WHERE PIXEL_KEY = ${key}`;
              await queryAsync(connection, updateQuery);
              console.log(`Record with key ${item.key} updated successfully.`);
            } else {
              // If no record exists, insert a new one
              const insertQuery = `INSERT INTO PIXELS (PIXEL_KEY, COLOR) VALUES (${key}, ${color})`;
              await queryAsync(connection, insertQuery);
              console.log(`New record with key ${item.key} inserted successfully.`);
            }
          } catch (err) {
            console.error('Database operation failed:', err);
          }
        } else {
          console.log("Missing key or color for some items.");
        }
      }
    } else {
      console.log("Invalid data format.");
    }
}

async function broadCastPixels(io)
{
    const pixels = await getPixelsData(db);
    io.emit('refresh_pixels', pixels);
//   fetch(host+'/Pixels.php',{method: 'GET'})
//   .then(response =>{
//     if (!response.ok) {
//       console.error('Error fetching pixels');
//     }
//     return response.json();
//   } )
//   .then(data => {
//     io.emit('refresh_pixels', data)
//     })
//   .catch(error => console.error('Broadcast pixels Error:', error));
}