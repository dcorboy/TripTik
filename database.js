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

  // Insert sample data if table is empty
  async insertSampleData() {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) {
          console.error('Error checking users count:', err.message);
          reject(err);
        } else if (row.count === 0) {
          this.insertSampleUsers().then(resolve).catch(reject);
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
            console.log('Sample data inserted.');
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