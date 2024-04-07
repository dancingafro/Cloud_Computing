// Import necessary modules and libraries
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createConnection, escape } from 'mysql';
import { readFileSync } from 'fs';
import cors from 'cors';

class Pixel {
    constructor(x, y, color) {
        this.x = x; // Pixel's x-coordinate
        this.y = y; // Pixel's y-coordinate
        this.color = color; // Pixel's color
    }
}

// Setup Express and HTTP server with CORS enabled for cross-origin requests
const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow requests from all origins, consider specifying for production
        methods: ["GET", "POST", "UPDATE"], // Specify allowed request methods
        credentials: true // Allow credentials to be sent with requests
    }
});

// Initialize MySQL database connection with SSL configuration
const db = createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "my_database",
    // ssl: {
    //     ca: readFileSync('/etc/ssl/certs/rds-ca-bundle.pem') // Only activate on AWS RDS
    // }
});

// Connect to the database and log the status
db.connect(err => {
    if (err) throw err;
    console.log('Connected to the database.');
});

// Check if the 'pixels' table is initially empty and initialize if necessary
db.query('SELECT COUNT(*) AS count FROM pixels', (error, results, fields) => {
    if (error) throw err;
    console.log('Number of rows:', results[0].count);
    if (results[0].count == 0) {
        console.log('Database empty. Initializing the database with default values');
        initDatabase();
    } else {
        console.log('Database already has data, no initialization needed.');
    }
});

// Endpoint to log user with a POST request, uses parameterized queries to prevent SQL injection
app.post('/log-user', (req, res) => {
    const { email, loginType } = req.body;
    const token = 'SECURE_TOKEN_' + new Date().getTime(); // Simplified token generation for demo purposes
    
    const sql = `
      INSERT INTO users (email, login_type, token) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
        login_type = VALUES(login_type), 
        token = VALUES(token), 
        last_login = CURRENT_TIMESTAMP`; // SQL statement to insert or update user
    
    db.query(sql, [email, loginType, token], (error, results) => {
        if (error) {
            return res.status(500).send('Error logging user to database');
        }
        res.json({ token }); // Return the generated token to the client
    });
});

io.on('connection', (socket) => {
    const userToken = socket.handshake.query.userToken; // Extract userToken from the socket handshake query

    userTokenValid(userToken).then(async (valid) => {
        if (!valid) {
            console.error('Invalid user token');
            socket.disconnect(); // Disconnect socket if token is invalid
            return;
        }

        const userEmail = await getUserEmail(userToken); // Retrieve user email based on token
        console.log('A user connected', socket.id);
        
        // Insert the connected client's info into the database
        const query = "INSERT INTO connected_clients (socket_id, username) VALUES (?,?)";
        db.query(query, [socket.id, userEmail], (err, result) => {
            if (err) throw err;
            console.log(`Client ${socket.id} added to the database.`);
        });
    });

    // Handler for when a client submits pixel data
    socket.on('submit_pixels', async (data) => {
        const userToken = data.userToken;
        userTokenValid(userToken).then((valid) => {
            if (!valid) {
                console.error('Invalid user token');
                return;
            }
            updateClientLastInteraction(socket.id); // Update the client's last interaction timestamp
            (async () => {
                try {
                    await updatePixelsData(db, data.pixels); // Update the pixels data in the database
                    broadCastPixels(io); // Broadcast updated pixels to all connected clients
                } catch (error) {
                    console.error('Failed to get pixels from database:', error);
                }
            })();
        });
    });

    // Similar structure is used for 'get_pixels' and 'get_userlist' event handlers

    // Handle client disconnection by removing their info from the database
    socket.on('disconnect', async () => {
        console.log(`User disconnected ${socket.id}`);
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

// Periodically check and remove inactive clients
setInterval(async () => {
    const thresholdMinutes = 10; // Duration after which a client is considered inactive
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

// Broadcast pixel and user list updates every second
setInterval(async () => {
    broadCastPixels(io);
}, 1000)

// Update the last interaction time for a client
function updateClientLastInteraction(socketId) {
    const updateTimestampQuery = "UPDATE connected_clients SET last_interaction = NOW() WHERE socket_id = ?";
    db.query(updateTimestampQuery, [socketId], (err, result) => {
        if (err) throw err;
        // Interaction time updated, but no logging for brevity
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

    const userlist = await getUserList(db);
    io.emit('refresh_userlist', userlist);
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

async function getUserEmail(userToken){
    return new Promise((resolve, reject) => {
        const query = `SELECT email FROM users WHERE token = '${userToken}'`;
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                reject(err);
            } else if (results.length === 0) {
                console.error('User not found');
                resolve(null);
            } else {
                resolve(results[0].email);
            }
        });
    });
}

// This function is called before any interaction with the database
async function userTokenValid(userToken){
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM users WHERE token = '${userToken}'`;
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        reject(err);
      } else if (results.length === 0) {
        console.error('User not found');
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}
