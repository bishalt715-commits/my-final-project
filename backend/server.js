// Import required packages
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = 3001;

// Create uploads folder if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middleware - tells Express how to handle different types of data
app.use(cors()); // Allow requests from frontend
app.use(express.json()); // Parse JSON data from requests
app.use('/uploads', express.static('uploads')); // Serve uploaded images
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve frontend files from parent folder

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save images to uploads folder
    },
    filename: (req, file, cb) => {
        // Create unique filename: timestamp + original name
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Only accept image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// MySQL Database Connection Configuration
const db = mysql.createConnection({
    host: 'localhost',      // XAMPP MySQL runs on localhost
    user: 'root',          // Default XAMPP MySQL user
    password: '',          // Default XAMPP MySQL password (empty)
    database: 'movie_collection' // Database name
});

// Connect to MySQL Database
db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL database:', err.message);
        console.log('\n⚠️  Make sure XAMPP MySQL is running!');
        console.log('   1. Open XAMPP Control Panel');
        console.log('   2. Start "MySQL" module\n');
        process.exit(1);
    } else {
        console.log('✓ Connected to MySQL database');
        createDatabase();
    }
});

// Create database if it doesn't exist, then create table
function createDatabase() {
    // First, create database
    db.query('CREATE DATABASE IF NOT EXISTS movie_collection', (err) => {
        if (err) {
            console.error('Error creating database:', err);
            return;
        }
        
        // Use the database
        db.query('USE movie_collection', (err) => {
            if (err) {
                console.error('Error selecting database:', err);
                return;
            }
            console.log('✓ Database "movie_collection" ready');
            createTable();
        });
    });
}

// Create movies table if it doesn't exist
function createTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS movies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            director VARCHAR(255) NOT NULL,
            year INT NOT NULL,
            genre VARCHAR(100) NOT NULL,
            rating DECIMAL(3,1) NOT NULL,
            image TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.query(sql, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('✓ Movies table ready');
            insertSampleData();
        }
    });
}

// Insert sample data if table is empty
function insertSampleData() {
    db.query('SELECT COUNT(*) as count FROM movies', (err, results) => {
        if (err) {
            console.error('Error checking table:', err);
            return;
        }

        if (results[0].count === 0) {
            const sampleMovies = [
                ['The Shawshank Redemption', 'Frank Darabont', 1994, 'Drama', 9.3, 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=300&fit=crop'],
                ['The Godfather', 'Francis Ford Coppola', 1972, 'Crime', 9.2, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop'],
                ['The Dark Knight', 'Christopher Nolan', 2008, 'Action', 9.0, 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=400&h=300&fit=crop'],
                ['Pulp Fiction', 'Quentin Tarantino', 1994, 'Crime', 8.9, 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=300&fit=crop']
            ];

            const insertSql = 'INSERT INTO movies (title, director, year, genre, rating, image) VALUES ?';
            
            db.query(insertSql, [sampleMovies], (err) => {
                if (err) {
                    console.error('Error inserting sample data:', err);
                } else {
                    console.log('✓ Sample movies added to database');
                }
            });
        }
    });
}

// ==================== API ROUTES ====================

// 1. GET all movies
app.get('/api/movies', (req, res) => {
    const sql = 'SELECT * FROM movies ORDER BY id DESC';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching movies:', err);
            res.status(500).json({ error: 'Failed to fetch movies' });
        } else {
            res.json(results);
        }
    });
});

// 2. GET single movie by ID
app.get('/api/movies/:id', (req, res) => {
    const sql = 'SELECT * FROM movies WHERE id = ?';
    
    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            console.error('Error fetching movie:', err);
            res.status(500).json({ error: 'Failed to fetch movie' });
        } else if (results.length === 0) {
            res.status(404).json({ error: 'Movie not found' });
        } else {
            res.json(results[0]);
        }
    });
});

// 3. POST new movie (with image upload)
app.post('/api/movies', upload.single('image'), (req, res) => {
    const { title, director, year, genre, rating } = req.body;
    
    // Validation
    if (!title || !director || !year || !genre || !rating) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Get image path (uploaded file or URL from body)
    const image = req.file 
        ? `/uploads/${req.file.filename}` 
        : req.body.image;
    
    if (!image) {
        return res.status(400).json({ error: 'Image is required' });
    }
    
    const sql = 'INSERT INTO movies (title, director, year, genre, rating, image) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.query(sql, [title, director, year, genre, rating, image], (err, result) => {
        if (err) {
            console.error('Error adding movie:', err);
            res.status(500).json({ error: 'Failed to add movie' });
        } else {
            // Return the newly created movie
            res.status(201).json({
                id: result.insertId,
                title,
                director,
                year: parseInt(year),
                genre,
                rating: parseFloat(rating),
                image
            });
        }
    });
});



// 4. PUT update movie
app.put('/api/movies/:id', upload.single('image'), (req, res) => {
    const { title, director, year, genre, rating } = req.body;
    const movieId = req.params.id;
    
    // Get image (new upload or existing URL)
    const image = req.file 
        ? `/uploads/${req.file.filename}` 
        : req.body.image;
    
    const sql = 'UPDATE movies SET title = ?, director = ?, year = ?, genre = ?, rating = ?, image = ? WHERE id = ?';
    
    db.query(sql, [title, director, year, genre, rating, image, movieId], (err, result) => {
        if (err) {
            console.error('Error updating movie:', err);
            res.status(500).json({ error: 'Failed to update movie' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Movie not found' });
        } else {
            res.json({
                id: parseInt(movieId),
                title,
                director,
                year: parseInt(year),
                genre,
                rating: parseFloat(rating),
                image
            });
        }
    });
});

// 5. DELETE movie
app.delete('/api/movies/:id', (req, res) => {
    const sql = 'DELETE FROM movies WHERE id = ?';
    
    db.query(sql, [req.params.id], (err, result) => {
        if (err) {
            console.error('Error deleting movie:', err);
            res.status(500).json({ error: 'Failed to delete movie' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Movie not found' });
        } else {
            res.json({ message: 'Movie deleted successfully' });
        }
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ========================================
    🎬 Movie Collection Server Running!
    ========================================
    Server: http://localhost:${PORT}
    API: http://localhost:${PORT}/api/movies
    Database: MySQL (XAMPP)
    ========================================
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.end((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('\n✓ Database connection closed');
        }
        process.exit(0);
    });
});

