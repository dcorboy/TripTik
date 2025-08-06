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

  // Date utility functions
  formatDateTimeForSQL(dateTime, timezone = 'UTC') {
    if (!dateTime) return null;
    
    // If it's already a string in ISO format, return as is
    if (typeof dateTime === 'string' && dateTime.includes('T')) {
      return dateTime;
    }
    
    // If it's a Date object, convert to ISO string
    if (dateTime instanceof Date) {
      return dateTime.toISOString();
    }
    
    // If it's just a date string (YYYY-MM-DD), add time
    if (typeof dateTime === 'string' && dateTime.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return `${dateTime}T00:00:00.000Z`;
    }
    
    return null;
  }

  parseDateTimeFromSQL(dateTimeString) {
    if (!dateTimeString) return null;
    return new Date(dateTimeString);
  }

  // Convert local datetime to UTC for storage
  localToUTC(localDateTime, timezone = 'America/New_York') {
    if (!localDateTime) return null;
    
    // If it's already a Date object, convert to UTC
    if (localDateTime instanceof Date) {
      return localDateTime.toISOString();
    }
    
    // If it's a string, parse it and convert to UTC
    if (typeof localDateTime === 'string') {
      const date = new Date(localDateTime);
      return date.toISOString();
    }
    
    return null;
  }

  // Convert UTC datetime to local timezone for display
  utcToLocal(utcDateTime, timezone = 'America/New_York') {
    if (!utcDateTime) return null;
    
    const date = new Date(utcDateTime);
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  }

  // Validate datetime format
  isValidDateTime(dateTimeString) {
    if (!dateTimeString) return false;
    
    const date = new Date(dateTimeString);
    return !isNaN(date.getTime());
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

  // Create legs table with datetime support
  createLegsTable() {
    return new Promise((resolve, reject) => {
      this.db.run(`CREATE TABLE IF NOT EXISTS legs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        departure_datetime TEXT,  -- ISO 8601 format with timezone
        departure_location TEXT,
        departure_timezone TEXT,  -- IANA timezone identifier
        arrival_datetime TEXT,    -- ISO 8601 format with timezone
        arrival_location TEXT,
        arrival_timezone TEXT,    -- IANA timezone identifier
        carrier TEXT,
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
          user_id: 1 
        },
        { 
          name: 'Multi-City Trip', 
          description: 'A trip with multiple destinations', 
          user_id: 1 
        }
      ];

      const stmt = this.db.prepare('INSERT INTO trips (name, description, user_id) VALUES (?, ?, ?)');
      let completed = 0;
      let hasError = false;

      sampleTrips.forEach(trip => {
        stmt.run(trip.name, trip.description, trip.user_id, (err) => {
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
          departure_datetime: '2024-06-15T06:30:00.000Z', // 6:30 AM EDT
          departure_location: 'IAD',
          departure_timezone: 'America/New_York',
          arrival_datetime: '2024-06-15T09:45:00.000Z',   // 9:45 AM EDT
          arrival_location: 'MCO',
          arrival_timezone: 'America/New_York',
          carrier: 'UA237',
          trip_id: 1
        },
        {
          name: 'Flight from Orlando',
          departure_datetime: '2024-06-20T15:30:00.000Z', // 3:30 PM EDT
          departure_location: 'MCO',
          departure_timezone: 'America/New_York',
          arrival_datetime: '2024-06-20T18:45:00.000Z',   // 6:45 PM EDT
          arrival_location: 'IAD',
          arrival_timezone: 'America/New_York',
          carrier: 'UA238',
          trip_id: 1
        },
        // Trip 2: Multi-City Trip (3 legs)
        {
          name: 'Flight to Orlando',
          departure_datetime: '2024-07-01T08:00:00.000Z', // 8:00 AM EDT
          departure_location: 'IAD',
          departure_timezone: 'America/New_York',
          arrival_datetime: '2024-07-01T11:15:00.000Z',   // 11:15 AM EDT
          arrival_location: 'MCO',
          arrival_timezone: 'America/New_York',
          carrier: 'AA1234',
          trip_id: 2
        },
        {
          name: 'Flight to New York',
          departure_datetime: '2024-07-05T14:00:00.000Z', // 2:00 PM EDT
          departure_location: 'MCO',
          departure_timezone: 'America/New_York',
          arrival_datetime: '2024-07-05T17:30:00.000Z',   // 5:30 PM EDT
          arrival_location: 'JFK',
          arrival_timezone: 'America/New_York',
          carrier: 'DL567',
          trip_id: 2
        },
        {
          name: 'Flight back to DC',
          departure_datetime: '2024-07-10T10:30:00.000Z', // 10:30 AM EDT
          departure_location: 'JFK',
          departure_timezone: 'America/New_York',
          arrival_datetime: '2024-07-10T12:00:00.000Z',   // 12:00 PM EDT
          arrival_location: 'IAD',
          arrival_timezone: 'America/New_York',
          carrier: 'UA789',
          trip_id: 2
        },
        // Additional test leg with different timezone considerations
        {
          name: 'Test Flight',
          departure_datetime: '2024-08-01T16:00:00.000Z', // 4:00 PM EDT
          departure_location: 'IAD',
          departure_timezone: 'America/New_York',
          arrival_datetime: '2024-08-01T19:30:00.000Z',   // 7:30 PM EDT
          arrival_location: 'LAX',
          arrival_timezone: 'America/New_York',
          carrier: 'UA999',
          trip_id: 1
        }
      ];

      const stmt = this.db.prepare('INSERT INTO legs (name, departure_datetime, departure_location, departure_timezone, arrival_datetime, arrival_location, arrival_timezone, carrier, trip_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      let completed = 0;
      let hasError = false;

      sampleLegs.forEach(leg => {
        stmt.run(leg.name, leg.departure_datetime, leg.departure_location, leg.departure_timezone, leg.arrival_datetime, leg.arrival_location, leg.arrival_timezone, leg.carrier, leg.trip_id, (err) => {
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

  // Get trips by user ID with calculated start and end dates
  getTripsByUserId(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          t.id, 
          t.name, 
          t.description,
          MIN(l.departure_datetime) as start_date,
          MAX(l.arrival_datetime) as end_date
        FROM trips t
        LEFT JOIN legs l ON t.id = l.trip_id
        WHERE t.user_id = ?
        GROUP BY t.id, t.name, t.description
        ORDER BY t.id
      `, [userId], (err, rows) => {
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
      const { name, description, user_id } = tripData;
      const db = this.db;
      
      this.db.run('INSERT INTO trips (name, description, user_id) VALUES (?, ?, ?)', 
        [name, description, user_id], function(err) {
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
      const { name, description } = updateData;
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
      this.db.all('SELECT * FROM legs ORDER BY departure_datetime', (err, rows) => {
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
      this.db.all('SELECT * FROM legs WHERE trip_id = ? ORDER BY departure_datetime', [tripId], (err, rows) => {
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
      const { name, departure_datetime, departure_location, departure_timezone, arrival_datetime, arrival_location, arrival_timezone, carrier, trip_id } = legData;
      const db = this.db;
      
      this.db.run('INSERT INTO legs (name, departure_datetime, departure_location, departure_timezone, arrival_datetime, arrival_location, arrival_timezone, carrier, trip_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [name, departure_datetime, departure_location, departure_timezone, arrival_datetime, arrival_location, arrival_timezone, carrier, trip_id], function(err) {
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
      const { name, departure_datetime, departure_location, departure_timezone, arrival_datetime, arrival_location, arrival_timezone, carrier } = updateData;
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
        if (departure_datetime !== undefined) {
          updateFields.push('departure_datetime = ?');
          updateValues.push(departure_datetime);
        }
        if (departure_location !== undefined) {
          updateFields.push('departure_location = ?');
          updateValues.push(departure_location);
        }
        if (departure_timezone !== undefined) {
          updateFields.push('departure_timezone = ?');
          updateValues.push(departure_timezone);
        }
        if (arrival_datetime !== undefined) {
          updateFields.push('arrival_datetime = ?');
          updateValues.push(arrival_datetime);
        }
        if (arrival_location !== undefined) {
          updateFields.push('arrival_location = ?');
          updateValues.push(arrival_location);
        }
        if (arrival_timezone !== undefined) {
          updateFields.push('arrival_timezone = ?');
          updateValues.push(arrival_timezone);
        }
        if (carrier !== undefined) {
          updateFields.push('carrier = ?');
          updateValues.push(carrier);
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