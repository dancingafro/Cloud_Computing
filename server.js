import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createConnection, escape} from 'mysql';
import { readFileSync } from 'fs';

class Pixel {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }
}

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
  database: 'my_database',
  ssl : {
   ca : readFileSync('/etc/ssl/certs/rds-ca-bundle.pem')
  }
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to the database.');
});

db.query('SELECT COUNT(*) AS count FROM pixels',  (error, results, fields) => {
    if (error) throw error;
    console.log('Number of rows:', results[0].count);
    if(results[0].count == 0)
    {
        console.log('Database empty. Initializing the database with default values');
        initDatabase();
    }
    else{
        console.log('Database already has data, no initialization needed.');
    }
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
  socket.on('submit_pixels', (pixelArray) => {
    updateClientLastInteraction(socket.id);
    //console.log('Data received:', data);
    (async () => {
        try {
          await updatePixelsData(db, pixelArray);
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

  socket.on('get_userlist', () => {
    updateClientLastInteraction(socket.id);
    (async () => {
        try {
          const pixels = await getUserList(db);
          socket.emit('refresh_userlist', pixels);
        } catch (error) {
          console.error('Failed to get userlist from database:', error);
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

setInterval(() => {
    broadCastPixels(io);
},1000)

function updateClientLastInteraction(socketId){
    const updateTimestampQuery = "UPDATE connected_clients SET last_interaction = NOW() WHERE socket_id = ?";
    db.query(updateTimestampQuery, [socketId], (err, result) => {
      if (err) throw err;
      //console.log(`Updated last interaction for client ${socketId}.`);
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
      const query = 'SELECT * FROM pixels';
      
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

async function getUserList(connection) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM connected_clients';
    
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


async function updatePixelsData(connection, pixelArray) {
    if (Array.isArray(pixelArray)) {

        // Construct the VALUES part of the query dynamically
        const values = pixelArray.map(pixel => 
            `(${escape(pixel.x)}, ${escape(pixel.y)}, ${escape(pixel.color)})`
        ).join(', ');

        // Complete SQL statement
        const sql = `
            INSERT INTO pixels (x, y, color) VALUES ${values}
            ON DUPLICATE KEY UPDATE color = VALUES(color);
        `;

        // Assuming you're using the mysql package in Node.js, execute the query
        await queryAsync(connection, sql);
    }

}

async function broadCastPixels(io)
{
    const pixels = await getPixelsData(db);
    io.emit('refresh_pixels', pixels);
}


async function initDatabase() {
    let pixels = []; // Initialize the array

    for (let i = 0; i < 90; i++) {
        for (let j = 0; j < 150; j++) {
            const pixel = new Pixel(i, j, '#FFFFFF'); // Create a new Pixel object
            pixels.push(pixel); // Add the Pixel object to the array
        }
    }

    updatePixelsData(db, pixels); // Assuming you have a function to update the data
}
