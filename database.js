const sqlite3 = require('sqlite3').verbose();

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize database connection
  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database('./database.db', (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database.');
          resolve();
        }
      });
    });
  }

  // Initialize database with tables
  async initDatabase() {
    try {
      await this.createUsersTable();
      await this.createTripsTable();
      await this.createLegsTable();
      await this.insertSampleData();
    } catch (err) {
      console.error('Error initializing database:', err.message);
    }
  }

  // Create users table
  createUsersTable() {
    return new Promise((resolve, reject) => {
      this.db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        age INTEGER
      )`, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
          reject(err);
        } else {
          console.log('Users table created or already exists.');
          resolve();
        }
      });
    });
  }

  // Create trips table
  createTripsTable() {
    return new Promise((resolve, reject) => {
      this.db.run(`CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        start_date TEXT,
        end_date TEXT,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`, (err) => {
        if (err) {
          console.error('Error creating trips table:', err.message);
          reject(err);
        } else {
          console.log('Trips table created or already exists.');
          resolve();
        }
      });
    });
  }

  // Create legs table
  createLegsTable() {
    return new Promise((resolve, reject) => {
      this.db.run(`CREATE TABLE IF NOT EXISTS legs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        departure_date TEXT,
        departure_location TEXT,
        arrival_date TEXT,
        arrival_location TEXT,
        trip_id INTEGER,
        FOREIGN KEY (trip_id) REFERENCES trips (id)
      )`, (err) => {
        if (err) {
          console.error('Error creating legs table:', err.message);
          reject(err);
        } else {
          console.log('Legs table created or already exists.');
          resolve();
        }
      });
    });
  }

  // Insert sample data if table is empty
  async insertSampleData() {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) {
          console.error('Error checking users count:', err.message);
          reject(err);
        } else if (row.count === 0) {
          this.insertSampleUsers()
            .then(() => this.insertSampleTrips())
            .then(() => this.insertSampleLegs())
            .then(resolve)
            .catch(reject);
        } else {
          resolve();
        }
      });
    });
  }

  // Insert sample users
  insertSampleUsers() {
    return new Promise((resolve, reject) => {
      const sampleUsers = [
        { name: 'John Doe', email: 'john@example.com', age: 30 },
        { name: 'Jane Smith', email: 'jane@example.com', age: 25 },
        { name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
      ];

      const stmt = this.db.prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)');
      let completed = 0;
      let hasError = false;

      sampleUsers.forEach(user => {
        stmt.run(user.name, user.email, user.age, (err) => {
          if (err && !hasError) {
            console.error('Error inserting sample data:', err.message);
            hasError = true;
            reject(err);
          }
          completed++;
          if (completed === sampleUsers.length && !hasError) {
            stmt.finalize();
            console.log('Sample users inserted.');
            resolve();
          }
        });
      });
    });
  }

  // Insert sample trips
  insertSampleTrips() {
    return new Promise((resolve, reject) => {
      const sampleTrips = [
        { 
          name: 'Orlando Round Trip', 
          description: 'A round trip to Orlando', 
          start_date: '2024-06-15',
          end_date: '2024-06-20',
          user_id: 1 
        },
        { 
          name: 'Multi-City Trip', 
          description: 'A trip with multiple destinations', 
          start_date: '2024-07-01',
          end_date: '2024-07-10',
          user_id: 1 
        }
      ];

      const stmt = this.db.prepare('INSERT INTO trips (name, description, start_date, end_date, user_id) VALUES (?, ?, ?, ?, ?)');
      let completed = 0;
      let hasError = false;

      sampleTrips.forEach(trip => {
        stmt.run(trip.name, trip.description, trip.start_date, trip.end_date, trip.user_id, (err) => {
          if (err && !hasError) {
            console.error('Error inserting sample trips:', err.message);
            hasError = true;
            reject(err);
          }
          completed++;
          if (completed === sampleTrips.length && !hasError) {
            stmt.finalize();
            console.log('Sample trips inserted.');
            resolve();
          }
        });
      });
    });
  }

  // Insert sample legs
  insertSampleLegs() {
    return new Promise((resolve, reject) => {
      const sampleLegs = [
        // Trip 1: Orlando Round Trip (2 legs)
        {
          name: 'Flight to Orlando',
          departure_date: '2024-06-15',
          departure_location: 'IAD',
          arrival_date: '2024-06-15',
          arrival_location: 'MCO',
          trip_id: 1
        },
        {
          name: 'Flight from Orlando',
          departure_date: '2024-06-20',
          departure_location: 'MCO',
          arrival_date: '2024-06-20',
          arrival_location: 'IAD',
          trip_id: 1
        },
        // Trip 2: Multi-City Trip (3 legs)
        {
          name: 'Flight to Orlando',
          departure_date: '2024-07-01',
          departure_location: 'IAD',
          arrival_date: '2024-07-01',
          arrival_location: 'MCO',
          trip_id: 2
        },
        {
          name: 'Flight to New York',
          departure_date: '2024-07-05',
          departure_location: 'MCO',
          arrival_date: '2024-07-05',
          arrival_location: 'JFK',
          trip_id: 2
        },
        {
          name: 'Flight back to DC',
          departure_date: '2024-07-10',
          departure_location: 'JFK',
          arrival_date: '2024-07-10',
          arrival_location: 'IAD',
          trip_id: 2
        }
      ];

      const stmt = this.db.prepare('INSERT INTO legs (name, departure_date, departure_location, arrival_date, arrival_location, trip_id) VALUES (?, ?, ?, ?, ?, ?)');
      let completed = 0;
      let hasError = false;

      sampleLegs.forEach(leg => {
        stmt.run(leg.name, leg.departure_date, leg.departure_location, leg.arrival_date, leg.arrival_location, leg.trip_id, (err) => {
          if (err && !hasError) {
            console.error('Error inserting sample legs:', err.message);
            hasError = true;
            reject(err);
          }
          completed++;
          if (completed === sampleLegs.length && !hasError) {
            stmt.finalize();
            console.log('Sample legs inserted.');
            resolve();
          }
        });
      });
    });
  }

  // Get all users
  getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM users', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get user by ID
  getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Create new user
  createUser(userData) {
    return new Promise((resolve, reject) => {
      const { name, email, age } = userData;
      
      this.db.run('INSERT INTO users (name, email, age) VALUES (?, ?, ?)', 
        [name, email, age], function(err) {
          if (err) {
            reject(err);
          } else {
            // Get the inserted user
            this.db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            });
          }
        });
    });
  }

  // Update user
  updateUser(id, updateData) {
    return new Promise((resolve, reject) => {
      const { name, email, age } = updateData;
      
      // First check if user exists
      this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          reject(new Error('User not found'));
          return;
        }
        
        // Update the user
        const updateFields = [];
        const updateValues = [];
        
        if (name !== undefined) {
          updateFields.push('name = ?');
          updateValues.push(name);
        }
        if (email !== undefined) {
          updateFields.push('email = ?');
          updateValues.push(email);
        }
        if (age !== undefined) {
          updateFields.push('age = ?');
          updateValues.push(age);
        }
        
        if (updateFields.length === 0) {
          reject(new Error('No fields to update'));
          return;
        }
        
        updateValues.push(id);
        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        
        this.db.run(updateQuery, updateValues, function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          // Get the updated user
          this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        });
      });
    });
  }

  // Delete user
  deleteUser(id) {
    return new Promise((resolve, reject) => {
      // First check if user exists
      this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          reject(new Error('User not found'));
          return;
        }
        
        // Delete the user
        this.db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ message: 'User deleted successfully', user: row });
          }
        });
      });
    });
  }

  // ===== TRIPS METHODS =====

  // Get all trips
  getAllTrips() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM trips', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get trip by ID
  getTripById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM trips WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get trips by user ID
  getTripsByUserId(userId) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT id, name, description FROM trips WHERE user_id = ?', [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Create new trip
  createTrip(tripData) {
    return new Promise((resolve, reject) => {
      const { name, description, start_date, end_date, user_id } = tripData;
      const db = this.db;
      
      this.db.run('INSERT INTO trips (name, description, start_date, end_date, user_id) VALUES (?, ?, ?, ?, ?)', 
        [name, description, start_date, end_date, user_id], function(err) {
          if (err) {
            reject(err);
          } else {
            // Get the inserted trip
            db.get('SELECT * FROM trips WHERE id = ?', [this.lastID], (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            });
          }
        });
    });
  }

  // Update trip
  updateTrip(id, updateData) {
    return new Promise((resolve, reject) => {
      const { name, description, start_date, end_date } = updateData;
      const db = this.db;
      
      // First check if trip exists
      this.db.get('SELECT * FROM trips WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          reject(new Error('Trip not found'));
          return;
        }
        
        // Update the trip
        const updateFields = [];
        const updateValues = [];
        
        if (name !== undefined) {
          updateFields.push('name = ?');
          updateValues.push(name);
        }
        if (description !== undefined) {
          updateFields.push('description = ?');
          updateValues.push(description);
        }
        if (start_date !== undefined) {
          updateFields.push('start_date = ?');
          updateValues.push(start_date);
        }
        if (end_date !== undefined) {
          updateFields.push('end_date = ?');
          updateValues.push(end_date);
        }
        
        if (updateFields.length === 0) {
          reject(new Error('No fields to update'));
          return;
        }
        
        updateValues.push(id);
        const updateQuery = `UPDATE trips SET ${updateFields.join(', ')} WHERE id = ?`;
        
        this.db.run(updateQuery, updateValues, function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          // Get the updated trip
          db.get('SELECT * FROM trips WHERE id = ?', [id], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        });
      });
    });
  }

  // Delete trip
  deleteTrip(id) {
    return new Promise((resolve, reject) => {
      // First check if trip exists
      this.db.get('SELECT * FROM trips WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          reject(new Error('Trip not found'));
          return;
        }
        
        // Delete the trip
        this.db.run('DELETE FROM trips WHERE id = ?', [id], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ message: 'Trip deleted successfully', trip: row });
          }
        });
      });
    });
  }

  // ===== LEGS METHODS =====

  // Get all legs
  getAllLegs() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM legs ORDER BY departure_date', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get leg by ID
  getLegById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM legs WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get legs by trip ID
  getLegsByTripId(tripId) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM legs WHERE trip_id = ? ORDER BY departure_date', [tripId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Create new leg
  createLeg(legData) {
    return new Promise((resolve, reject) => {
      const { name, departure_date, departure_location, arrival_date, arrival_location, trip_id } = legData;
      const db = this.db;
      
      this.db.run('INSERT INTO legs (name, departure_date, departure_location, arrival_date, arrival_location, trip_id) VALUES (?, ?, ?, ?, ?, ?)', 
        [name, departure_date, departure_location, arrival_date, arrival_location, trip_id], function(err) {
          if (err) {
            reject(err);
          } else {
            // Get the inserted leg
            db.get('SELECT * FROM legs WHERE id = ?', [this.lastID], (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            });
          }
        });
    });
  }

  // Update leg
  updateLeg(id, updateData) {
    return new Promise((resolve, reject) => {
      const { name, departure_date, departure_location, arrival_date, arrival_location } = updateData;
      const db = this.db;
      
      // First check if leg exists
      this.db.get('SELECT * FROM legs WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          reject(new Error('Leg not found'));
          return;
        }
        
        // Update the leg
        const updateFields = [];
        const updateValues = [];
        
        if (name !== undefined) {
          updateFields.push('name = ?');
          updateValues.push(name);
        }
        if (departure_date !== undefined) {
          updateFields.push('departure_date = ?');
          updateValues.push(departure_date);
        }
        if (departure_location !== undefined) {
          updateFields.push('departure_location = ?');
          updateValues.push(departure_location);
        }
        if (arrival_date !== undefined) {
          updateFields.push('arrival_date = ?');
          updateValues.push(arrival_date);
        }
        if (arrival_location !== undefined) {
          updateFields.push('arrival_location = ?');
          updateValues.push(arrival_location);
        }
        
        if (updateFields.length === 0) {
          reject(new Error('No fields to update'));
          return;
        }
        
        updateValues.push(id);
        const updateQuery = `UPDATE legs SET ${updateFields.join(', ')} WHERE id = ?`;
        
        this.db.run(updateQuery, updateValues, function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          // Get the updated leg
          db.get('SELECT * FROM legs WHERE id = ?', [id], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        });
      });
    });
  }

  // Delete leg
  deleteLeg(id) {
    return new Promise((resolve, reject) => {
      // First check if leg exists
      this.db.get('SELECT * FROM legs WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          reject(new Error('Leg not found'));
          return;
        }
        
        // Delete the leg
        this.db.run('DELETE FROM legs WHERE id = ?', [id], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ message: 'Leg deleted successfully', leg: row });
          }
        });
      });
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            reject(err);
          } else {
            console.log('Database connection closed.');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database; 