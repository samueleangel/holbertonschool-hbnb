/* 
  This is a SAMPLE FILE to get you started.
  Please, follow the project instructions to complete the tasks.
*/

document.addEventListener('DOMContentLoaded', () => {
    // Task 2: Index functionality
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        checkAuthentication();
        setupPriceFilter();
    }

    // Task 3: Place Details functionality
    if (window.location.pathname.endsWith('place.html')) {
        const placeId = getPlaceIdFromURL();
        if (placeId) {
            checkAuthenticationForPlace(placeId);
        } else {
            // If no place ID, redirect to index
            window.location.href = 'index.html';
        }
    }

    // Task 4: Add Review Form functionality
    if (window.location.pathname.endsWith('add_review.html')) {
        const reviewForm = document.getElementById('review-form');
        const token = checkAuthenticationForAddReview();
        const placeId = getPlaceIdFromURL();

        if (!placeId) {
            // If no place ID, redirect to index
            window.location.href = 'index.html';
            return;
        }

        // Load place information for context
        loadPlaceInfoForReview(token, placeId);

        if (reviewForm) {
            reviewForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                
                // Get review text and rating from form
                const reviewText = document.getElementById('review').value;
                const rating = document.getElementById('rating').value;
                
                if (!reviewText.trim()) {
                    showMessage('Please write a review', 'error');
                    return;
                }
                
                if (!rating) {
                    showMessage('Please select a rating', 'error');
                    return;
                }
                
                // Make AJAX request to submit review
                await submitReviewFromForm(token, placeId, reviewText, rating);
            });
        }
    }

    // Task 1: Login functionality
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            // Get form data
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Basic validation
            if (!email || !password) {
                displayErrorMessage('Please fill in all fields');
                return;
            }
            
            // Show loading state
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Logging in...';
            submitButton.disabled = true;
            
            try {
                await loginUser(email, password);
            } catch (error) {
                console.error('Login error:', error);
                displayErrorMessage('Login failed. Please try again.');
            } finally {
                // Reset button state
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }

    // Basic functionality for other pages (from previous design task)
    
    // Basic form handling for reviews in place.html
    const reviewForm = document.getElementById('review-form');
    if (reviewForm && window.location.pathname.endsWith('place.html')) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const reviewText = document.getElementById('review-text').value;
            if (!reviewText.trim()) {
                alert('Please write a review');
                return;
            }
            
            // Get place ID for review submission
            const placeId = getPlaceIdFromURL();
            if (placeId) {
                submitReview(placeId, reviewText);
            }
        });
    }
    
    // Populate rating select if it exists
    const ratingSelect = document.getElementById('rating');
    if (ratingSelect) {
        for (let i = 1; i <= 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i} Star${i > 1 ? 's' : ''}`;
            ratingSelect.appendChild(option);
        }
    }
});

// Task 4: Check user authentication for add review page
function checkAuthenticationForAddReview() {
    const token = getCookie('token');
    if (!token) {
        window.location.href = 'index.html';
        return null;
    }
    return token;
}

// Task 4: Load place information for review context
async function loadPlaceInfoForReview(token, placeId) {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`https://your-api-url/places/${placeId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const place = await response.json();
            displayPlaceInfoForReview(place);
        } else {
            // Use example place if API fails
            const examplePlace = getExamplePlace(placeId);
            displayPlaceInfoForReview(examplePlace);
        }
    } catch (error) {
        console.error('Error loading place info:', error);
        const examplePlace = getExamplePlace(placeId);
        displayPlaceInfoForReview(examplePlace);
    }
}

// Task 4: Display place information in add review page
function displayPlaceInfoForReview(place) {
    const placeInfoDiv = document.getElementById('place-info');
    placeInfoDiv.innerHTML = `
        <div class="place-info-header">
            <h3>Review for: ${place.name}</h3>
            <p>${place.location} - $${place.price} per night</p>
        </div>
    `;
}

// Task 4: Submit review from add review form
async function submitReviewFromForm(token, placeId, reviewText, rating) {
    const submitButton = document.querySelector('#review-form button[type="submit"]');
    const originalText = submitButton.textContent;
    
    try {
        // Show loading state
        submitButton.textContent = 'Submitting...';
        submitButton.disabled = true;
        
        const response = await fetch(`https://your-api-url/places/${placeId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                comment: reviewText,
                rating: parseInt(rating)
            })
        });
        
        if (response.ok) {
            showMessage('Review submitted successfully!', 'success');
            // Clear the form
            document.getElementById('review').value = '';
            document.getElementById('rating').value = '';
            
            // Optionally redirect back to place details after a delay
            setTimeout(() => {
                window.location.href = `place.html?id=${placeId}`;
            }, 2000);
        } else if (response.status === 401) {
            // Token expired, redirect to login
            window.location.href = 'login.html';
        } else {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.message || 'Failed to submit review';
            showMessage(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showMessage('Failed to submit review. Please try again.', 'error');
    } finally {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Task 4: Show message to user
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Task 3: Get place ID from URL
function getPlaceIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Task 3: Check user authentication for place details
function checkAuthenticationForPlace(placeId) {
    const token = getCookie('token');
    const addReviewSection = document.getElementById('add-review');

    if (!token) {
        addReviewSection.style.display = 'none';
        // Still fetch place details even if not authenticated
        fetchPlaceDetails(null, placeId);
    } else {
        addReviewSection.style.display = 'block';
        // Store the token for later use
        fetchPlaceDetails(token, placeId);
    }
}

// Task 3: Fetch place details
async function fetchPlaceDetails(token, placeId) {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Include token in Authorization header if available
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`https://your-api-url/places/${placeId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const place = await response.json();
            displayPlaceDetails(place);
            // Also fetch reviews for this place
            fetchPlaceReviews(token, placeId);
        } else if (response.status === 401 && token) {
            // Token is invalid, logout the user
            logout();
        } else {
            console.error('Failed to fetch place details:', response.statusText);
            // Show example place details if API fails
            displayPlaceDetails(getExamplePlace(placeId));
            displayExampleReviews();
        }
    } catch (error) {
        console.error('Error fetching place details:', error);
        // Show example place details if API fails
        displayPlaceDetails(getExamplePlace(placeId));
        displayExampleReviews();
    }
}

// Task 3: Fetch place reviews
async function fetchPlaceReviews(token, placeId) {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`https://your-api-url/places/${placeId}/reviews`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const reviews = await response.json();
            displayReviews(reviews);
        } else {
            // Show example reviews if API fails
            displayExampleReviews();
        }
    } catch (error) {
        console.error('Error fetching reviews:', error);
        displayExampleReviews();
    }
}

// Task 3: Get example place for demonstration
function getExamplePlace(placeId) {
    const places = {
        1: {
            id: 1,
            name: 'Modern Downtown House',
            description: 'Beautiful modern house located in the heart of the city, perfect for a comfortable stay. This stunning property offers all the amenities you need for an unforgettable experience.',
            location: 'Madrid, Spain',
            price: 120,
            host: 'Maria Garcia',
            amenities: ['WiFi', 'Private bathroom', 'Kitchen', 'Air conditioning', 'Parking', 'TV']
        },
        2: {
            id: 2,
            name: 'Ocean View Apartment',
            description: 'Stunning apartment with breathtaking ocean views. Wake up to the sound of waves and enjoy spectacular sunsets from your private balcony.',
            location: 'Valencia, Spain',
            price: 85,
            host: 'Carlos Rodriguez',
            amenities: ['WiFi', 'Ocean view', 'Balcony', 'Kitchen', 'Air conditioning']
        }
    };
    
    return places[placeId] || places[1]; // Default to first place if ID not found
}

// Task 3: Populate place details
function displayPlaceDetails(place) {
    const placeDetailsSection = document.getElementById('place-details');
    
    // Clear the current content of the place details section
    placeDetailsSection.innerHTML = '';
    
    // Create elements to display the place details
    const placeContent = document.createElement('div');
    placeContent.className = 'place-info';
    
    placeContent.innerHTML = `
        <h1>${place.name}</h1>
        <p class="location"><strong>Location:</strong> ${place.location}</p>
        <p class="host"><strong>Host:</strong> ${place.host}</p>
        <p class="price"><strong>Price:</strong> $${place.price} per night</p>
        <p class="description">${place.description}</p>
        
        <div class="amenities">
            <h3>Amenities:</h3>
            <ul>
                ${place.amenities.map(amenity => `<li>${amenity}</li>`).join('')}
            </ul>
        </div>
    `;
    
    // Append the created elements to the place details section
    placeDetailsSection.appendChild(placeContent);
}

// Task 3: Display reviews
function displayReviews(reviews) {
    const reviewsSection = document.getElementById('reviews');
    
    // Clear current content
    reviewsSection.innerHTML = '<h2>Reviews</h2>';
    
    if (reviews.length === 0) {
        reviewsSection.innerHTML += '<p>No reviews yet. Be the first to review this place!</p>';
        return;
    }
    
    reviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        
        reviewCard.innerHTML = `
            <div class="review-header">
                <span class="reviewer">${review.user || review.user_name}</span>
                <span class="rating">${'★'.repeat(review.rating || 5)}${'☆'.repeat(5 - (review.rating || 5))}</span>
            </div>
            <p class="review-comment">${review.comment || review.text}</p>
        `;
        
        reviewsSection.appendChild(reviewCard);
    });
}

// Task 3: Display example reviews
function displayExampleReviews() {
    const exampleReviews = [
        {
            user: 'John Doe',
            rating: 5,
            comment: 'Excellent place, very clean and comfortable. Great location and amazing host!'
        },
        {
            user: 'Jane Smith',
            rating: 4,
            comment: 'Good location, close to everything. Would recommend to friends and family.'
        },
        {
            user: 'Mike Johnson',
            rating: 5,
            comment: 'Perfect stay! Everything was exactly as described. Will definitely book again.'
        }
    ];
    
    displayReviews(exampleReviews);
}

// Task 3: Submit review
async function submitReview(placeId, reviewText) {
    const token = getCookie('token');
    
    if (!token) {
        alert('Please log in to submit a review');
        return;
    }
    
    try {
        const response = await fetch(`https://your-api-url/places/${placeId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                comment: reviewText,
                rating: 5 // Default rating, could be made configurable
            })
        });
        
        if (response.ok) {
            alert('Review submitted successfully!');
            document.getElementById('review-text').value = '';
            // Refresh reviews
            fetchPlaceReviews(token, placeId);
        } else if (response.status === 401) {
            logout();
        } else {
            alert('Failed to submit review. Please try again.');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Failed to submit review. Please try again.');
    }
}

// Task 2: Check user authentication
function checkAuthentication() {
    const token = getCookie('token');
    const loginLink = document.getElementById('login-link');

    if (!token) {
        loginLink.style.display = 'block';
        loginLink.textContent = 'Login';
        loginLink.href = 'login.html';
        // Don't fetch places, let the static content show
    } else {
        loginLink.style.display = 'block';
        loginLink.textContent = 'Logout';
        loginLink.href = '#';
        loginLink.onclick = function(e) {
            e.preventDefault();
            logout();
        };
        // Fetch places data if the user is authenticated
        fetchPlaces(token);
    }
}

// Task 2: Fetch places data
async function fetchPlaces(token) {
    try {
        const response = await fetch('https://your-api-url/places', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const places = await response.json();
            displayPlaces(places);
        } else if (response.status === 401) {
            // Token is invalid, logout the user
            logout();
        } else {
            console.error('Failed to fetch places:', response.statusText);
            // Keep the static content - don't replace with examples
        }
    } catch (error) {
        console.error('Error fetching places:', error);
        // Keep the static content - don't replace with examples
    }
}

// Task 2: Get example places for demonstration
function getExamplePlaces() {
    return [
        {
            id: 1,
            name: 'Modern Downtown House',
            description: 'Beautiful modern house in the city center',
            location: 'Madrid, Spain',
            price: 120
        },
        {
            id: 2,
            name: 'Ocean View Apartment',
            description: 'Stunning apartment with ocean views',
            location: 'Valencia, Spain',
            price: 85
        },
        {
            id: 3,
            name: 'Mountain Cabin',
            description: 'Cozy cabin in the mountains',
            location: 'Asturias, Spain',
            price: 95
        },
        {
            id: 4,
            name: 'Urban Modern Loft',
            description: 'Stylish loft in the urban area',
            location: 'Barcelona, Spain',
            price: 150
        },
        {
            id: 5,
            name: 'Country House with Garden',
            description: 'Peaceful house with beautiful garden',
            location: 'Sevilla, Spain',
            price: 75
        }
    ];
}

// Task 2: Populate places list
function displayPlaces(places) {
    const placesList = document.getElementById('places-list');
    
    // Clear the current content of the places list
    placesList.innerHTML = '';
    
    // Iterate over the places data
    places.forEach(place => {
        // For each place, create a div element and set its content
        const placeCard = document.createElement('div');
        placeCard.className = 'place-card';
        placeCard.setAttribute('data-price', place.price);
        
        placeCard.innerHTML = `
            <h3>${place.name}</h3>
            <p class="description">${place.description}</p>
            <p class="location">${place.location}</p>
            <p class="price">$${place.price} per night</p>
            <button class="details-button" type="button" onclick="window.location.href='place.html?id=${place.id}'">
                View Details
            </button>
        `;
        
        // Append the created element to the places list
        placesList.appendChild(placeCard);
    });
}

// Task 2: Setup price filter
function setupPriceFilter() {
    const priceFilter = document.getElementById('price-filter');
    
    if (priceFilter) {
        // Clear existing options except "All"
        priceFilter.innerHTML = '<option value="">All</option>';
        
        // Add the required price options: 10, 50, 100
        const priceOptions = [10, 50, 100];
        priceOptions.forEach(price => {
            const option = document.createElement('option');
            option.value = price;
            option.textContent = `Up to $${price}`;
            priceFilter.appendChild(option);
        });
        
        // Add event listener to the price filter dropdown
        priceFilter.addEventListener('change', (event) => {
            const selectedPrice = event.target.value;
            filterPlacesByPrice(selectedPrice);
        });
    }
}

// Task 2: Implement client-side filtering
function filterPlacesByPrice(maxPrice) {
    const placeCards = document.querySelectorAll('.place-card');
    
    placeCards.forEach(card => {
        const placePrice = parseInt(card.getAttribute('data-price'));
        
        if (maxPrice === '' || placePrice <= parseInt(maxPrice)) {
            // Show the place
            card.style.display = 'block';
        } else {
            // Hide the place
            card.style.display = 'none';
        }
    });
}

// Task 1: Login function
async function loginUser(email, password) {
    const response = await fetch('https://your-api-url/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    // Handle the response
    if (response.ok) {
        const data = await response.json();
        // Store JWT token in cookie
        document.cookie = `token=${data.access_token}; path=/`;
        // Redirect to main page
        window.location.href = 'index.html';
    } else {
        // Handle different types of errors
        let errorMessage = 'Login failed';
        
        if (response.status === 401) {
            errorMessage = 'Invalid email or password';
        } else if (response.status === 400) {
            errorMessage = 'Bad request. Please check your input.';
        } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
        } else {
            errorMessage = 'Login failed: ' + response.statusText;
        }
        
        displayErrorMessage(errorMessage);
        throw new Error(errorMessage);
    }
}

// Function to display error messages
function displayErrorMessage(message) {
    // Remove any existing error message
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create new error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Insert error message at the top of the form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.insertBefore(errorDiv, loginForm.firstChild);
    } else {
        // Fallback: show alert if form not found
        alert(message);
    }
}

// Utility function to get cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Function to check if user is logged in
function isLoggedIn() {
    return getCookie('token') !== null;
}

// Function to logout user
function logout() {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = 'index.html';
}
