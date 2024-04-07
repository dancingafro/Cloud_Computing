import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createConnection, escape} from 'mysql';
import cors from 'cors';


class Pixel {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }
}

// Setup Express and HTTP server
const app = express();
app.use(cors());
app.use(express.json());
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

// Setup MySQL connection
// ssl : {
//   ca : readFileSync('/etc/ssl/certs/rds-ca-bundle.pem')
//  }

const db = createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "my_database"
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
  

  app.post('/log-user', (req, res) => {
    console.log("log-user")
    const { email, loginType } = req.body;
    
    // Generate a secure token here (for simplicity, we'll use a placeholder)
    const token = 'SECURE_TOKEN_' + new Date().getTime();
    
    // SQL to insert or update the user's record
    const sql = `
      INSERT INTO users (email, login_type, token) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
        login_type = VALUES(login_type), 
        token = VALUES(token), 
        last_login = CURRENT_TIMESTAMP`;
    
    // Execute the SQL query
    db.query(sql, [email, loginType, token], (error, results) => {
      if (error) {
        return res.status(500).send('Error logging user to database');
      }
      // Send the token back to the client
      res.json({ token });
    });
  });

io.on('connection', (socket) => {

  const userToken = socket.handshake.query.userToken;

  userTokenValid(userToken).then(async (valid) => {
    if(!valid){
      console.error('Invalid user token');
      socket.disconnect();
      return;
    }

    const userEmail = await getUserEmail(userToken);
    console.log('A user connected', socket.id);
    //get the username from the database
    // Store client info in the database
    const query = "INSERT INTO connected_clients (socket_id, username) VALUES (?,?)";
    db.query(query, [socket.id, userEmail], (err, result) => {
      if (err) throw err; 
      console.log(`Client ${socket.id} added to the database.`);
    });
  });



  // Listen for data update requests from clients
  socket.on('submit_pixels', async (data) => {
    const userToken = data.userToken;
    //console.log('submit tokens:', userToken);
    userTokenValid(userToken).then((valid) => {
      if(!valid){
        console.error('Invalid user token');
        return;
      }
      const pixels = data.pixels;
      updateClientLastInteraction(socket.id);
      //console.log('Data received:', data);
      (async () => {
          try {
            await updatePixelsData(db, data.pixels);
            broadCastPixels(io);
            
          } catch (error) {
            console.error('Failed to get pixels from database:', error);
          }
        })();
    });
  });

  socket.on('get_pixels', async (userToken) => {
    userTokenValid(userToken).then((valid) => {
      if(!valid){
        console.error('Invalid user token');
        return;
      }
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
  });

  socket.on('get_userlist', async (userToken) => {
    userTokenValid(userToken).then((valid) => {
      if(!valid){
        console.error('Invalid user token');
        return;
      }

    updateClientLastInteraction(socket.id);
    (async () => {
        try {
          const userlist = await getUserList(db);
          socket.emit('refresh_userlist', userlist);
        } catch (error) {
          console.error('Failed to get userlist from database:', error);
        }
      })();
  });

  // Handle client disconnection
  socket.on('disconnect', async () => {
    console.log(`User disconnected ${socket.id}`);
    // Remove client info from the database
    const deleteQuery = "DELETE FROM connected_clients WHERE socket_id = ?";
    db.query(deleteQuery, [socket.id], (err, result) => {
      if (err) throw err;
      console.log(`Client ${socket.id} removed from the database.`);
    });
  });
});
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});

setInterval(async () => {
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

setInterval(async () => {
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