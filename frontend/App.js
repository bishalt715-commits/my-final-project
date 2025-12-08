// State Management
let movies = [];
let editingMovieId = null;

// API Simulation (Replace with real backend later)
const API_URL = 'http://localhost:3001/api/movies';
const API = {
    getMovies() {
        const stored = localStorage.getItem('movies');
        return stored ? JSON.parse(stored) : [
            {
                id: 1,
                title: 'The Shawshank Redemption',
                director: 'Frank Darabont',
                year: 1994,
                genre: 'Drama',
                rating: 9.3,
                image: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=300&fit=crop'
            },
            {
                id: 2,
                title: 'The Godfather',
                director: 'Francis Ford Coppola',
                year: 1972,
                genre: 'Crime',
                rating: 9.2,
                image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop'
            },
            {
                id: 3,
                title: 'The Dark Knight',
                director: 'Christopher Nolan',
                year: 2008,
                genre: 'Action',
                rating: 9,
                image: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=400&h=300&fit=crop'
            },
            {
                id: 4,
                title: 'Pulp Fiction',
                director: 'Quentin Tarantino',
                year: 1994,
                genre: 'Crime',
                rating: 8.9,
                image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=300&fit=crop'
            }
        ];
    },

    saveMovies(moviesData) {
        localStorage.setItem('movies', JSON.stringify(moviesData));
    },

    addMovie(movie) {
        const newMovie = { ...movie, id: Date.now() };
        movies.push(newMovie);
        this.saveMovies(movies);
        return newMovie;
    },

    updateMovie(id, updatedMovie) {
        const index = movies.findIndex(m => m.id === id);
        if (index !== -1) {
            movies[index] = { ...movies[index], ...updatedMovie };
            this.saveMovies(movies);
            return movies[index];
        }
        return null;
    },

    deleteMovie(id) {
        movies = movies.filter(m => m.id !== id);
        this.saveMovies(movies);
        return true;
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMovies();
    setupEventListeners();
});

// Load Movies
function loadMovies() {
    movies = API.getMovies();
    renderMovies();
}

// Render Movies
function renderMovies() {
    const movieGrid = document.getElementById('movieGrid');
    const emptyState = document.getElementById('emptyState');

    if (movies.length === 0) {
        movieGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    movieGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    movieGrid.innerHTML = movies.map(movie => `
        <div class="movie-card">
            <div class="movie-image">
                <img src="${movie.image}" alt="${movie.title}">
                <div class="rating-badge">
                    <span class="star">â˜…</span>
                    <span>${movie.rating}</span>
                </div>
            </div>
            <div class="movie-header">
                <div class="movie-title">${movie.title}</div>
                <div class="movie-director">${movie.director}</div>
            </div>
            <div class="movie-details">
                <div class="movie-info">
                    <div>
                        <div class="info-label">Year</div>
                        <div class="info-value">${movie.year}</div>
                    </div>
                    <div>
                        <div class="info-label">Genre</div>
                        <div class="info-value">${movie.genre}</div>
                    </div>
                </div>
                <div class="movie-actions">
                    <button class="btn-update" onclick="editMovie(${movie.id})">
                        <span>âœï¸</span>
                        Update
                    </button>
                    <button class="btn-remove" onclick="removeMovie(${movie.id})">
                        <span>ðŸ—‘ï¸</span>
                        Remove
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('addMovieBtn').addEventListener('click', showAddForm);
    document.getElementById('backBtn').addEventListener('click', showMainView);
    document.getElementById('submitBtn').addEventListener('click', handleSubmit);
    document.getElementById('cancelBtn').addEventListener('click', showMainView);
    document.getElementById('imageInput').addEventListener('change', handleImagePreview);
}

// Show Add Form
function showAddForm() {
    editingMovieId = null;
    document.getElementById('formTitle').textContent = 'Add New Movie';
    document.getElementById('submitBtn').textContent = 'Add Movie';
    clearForm();
    showView('formView');
}

// Show Main View
function showMainView() {
    showView('mainView');
    clearForm();
}

// Show View
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
}

// Edit Movie
function editMovie(id) {
    const movie = movies.find(m => m.id === id);
    if (!movie) return;

    editingMovieId = id;
    document.getElementById('formTitle').textContent = 'Update Movie';
    document.getElementById('submitBtn').textContent = 'Update Movie';

    // Fill form
    document.getElementById('titleInput').value = movie.title;
    document.getElementById('directorInput').value = movie.director;
    document.getElementById('yearInput').value = movie.year;
    document.getElementById('genreInput').value = movie.genre;
    document.getElementById('ratingInput').value = movie.rating;

    // Show image preview
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    previewImg.src = movie.image;
    preview.style.display = 'block';

    showView('formView');
}

// Remove Movie
function removeMovie(id) {
    if (confirm('Are you sure you want to remove this movie?')) {
        API.deleteMovie(id);
        loadMovies();
    }
}

// Handle Image Preview
function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const preview = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImg');
            previewImg.src = reader.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Handle Form Submit
function handleSubmit() {
    const title = document.getElementById('titleInput').value.trim();
    const director = document.getElementById('directorInput').value.trim();
    const year = parseInt(document.getElementById('yearInput').value);
    const genre = document.getElementById('genreInput').value;
    const rating = parseFloat(document.getElementById('ratingInput').value);
    const previewImg = document.getElementById('previewImg');
    const image = previewImg.src;

    // Validation
    if (!title || !director || !year || !genre || !rating || !image) {
        alert('Please fill in all fields and upload an image');
        return;
    }

    if (rating < 1 || rating > 10) {
        alert('Rating must be between 1 and 10');
        return;
    }

    const movieData = { title, director, year, genre, rating, image };

    if (editingMovieId) {
        API.updateMovie(editingMovieId, movieData);
    } else {
        API.addMovie(movieData);
    }

    loadMovies();
    showMainView();
}

// Clear Form
function clearForm() {
    document.getElementById('titleInput').value = '';
    document.getElementById('directorInput').value = '';
    document.getElementById('yearInput').value = '';
    document.getElementById('genreInput').value = '';
    document.getElementById('ratingInput').value = '';
    document.getElementById('imageInput').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewImg').src = '';
}