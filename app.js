const CSV_URLS = {
    showcase: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQSuzhY51aldmUgKsL_lTPlv2LeG1ALUMEKkqBhT6uAiDQBNjgWqhgwtMmBtmM7U5NWrGbb0xZEqD75/pub?gid=0&single=true&output=csv',
    upcoming_tournaments: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS-TBbZalXXTgH9x0pQHsWDnGiNXi4bxfI0EYG0BhUs3HzWv02JYJFVL6-kHrG3KQbZaMzYTk4wqkAp/pub?gid=0&single=true&output=csv',
    previous_tournaments: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQkPaPW5mt4WgJXyha0XbAeK47vYBAamI4JKZb1gARcq5xOwEEz0FheIIwAFQkAg-_vkVrzrVNNHDPP/pub?gid=0&single=true&output=csv',
    cubes: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgdkSaMjxPZeNnckvjq_GIXrsJCX1T8m26n2a1KPXHO9Tdm58uYEQXc_D-f2QcksRmU3ghqtrSda68/pub?gid=0&single=true&output=csv'
};

// Global data storage
let appData = {
    showcase: [],
    upcoming_tournaments: [],
    previous_tournaments: [],
    cubes: []
};

// Page Navigation
document.addEventListener('DOMContentLoaded', function () {
    // Set home page as active by default
    showPage('home');

    // Add event listeners to navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);

            // Update active state in navigation
            document.querySelectorAll('.nav-link').forEach(nav => {
                nav.classList.remove('active');
            });
            this.classList.add('active');
            
            // Close mobile menu if open
            document.querySelector('.nav-links').classList.remove('active');
        });
    });

    // Mobile menu toggle
    document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
        document.querySelector('.nav-links').classList.toggle('active');
    });

    // Tab functionality for tournaments page
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');

            // Update active tab button
            document.querySelectorAll('.tab-btn').forEach(tab => {
                tab.classList.remove('active');
            });
            this.classList.add('active');

            // Show corresponding tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}-tab`).classList.add('active');

            // Render tournaments for this tab
            renderTournaments(tabId);
        });
    });

    // Handle browser back button
    window.addEventListener('popstate', function (event) {
        if (event.state && event.state.page) {
            showPage(event.state.page);
        } else {
            showPage('home');
        }
    });

    // Initialize search functionality
    initSearch();

    // Initialize gallery modal
    initGalleryModal();

    // Load all data
    loadAllData();
});

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });

    // Show the selected page
    document.getElementById(pageId).classList.add('active');

    // Scroll to top
    window.scrollTo(0, 0);

    // Update browser history
    history.pushState({ page: pageId }, '', `#${pageId}`);

    // Render content for the page if needed
    if (pageId === 'tournaments') {
        renderTournaments('upcoming');
    } else if (pageId === 'showcase') {
        renderShowcase();
    } else if (pageId === 'cubes') {
        renderCubes();
    } else if (pageId === 'home') {
        renderHomePage();
    }
}

// Load all CSV data
async function loadAllData() {
    try {
        // Show loading indicators
        document.getElementById('showcase-grid').innerHTML = '<div class="loading"></div>';
        document.getElementById('upcoming-tournaments').innerHTML = '<div class="loading"></div>';
        document.getElementById('cubes-grid').innerHTML = '<div class="loading"></div>';
        document.getElementById('home-cubes-grid').innerHTML = '<div class="loading"></div>';

        // Load data for each category
        await Promise.all([
            loadCSVData('showcase'),
            loadCSVData('upcoming_tournaments'),
            loadCSVData('previous_tournaments'),
            loadCSVData('cubes')
        ]);

        // Render home page with the loaded data
        renderHomePage();

    } catch (error) {
        console.error('Error loading data:', error);
        // Show error messages
        document.getElementById('showcase-grid').innerHTML = '<p>Error loading showcase data</p>';
        document.getElementById('upcoming-tournaments').innerHTML = '<p>Error loading tournament data</p>';
        document.getElementById('cubes-grid').innerHTML = '<p>Error loading cube data</p>';
        document.getElementById('home-cubes-grid').innerHTML = '<p>Error loading cube data</p>';
    }
}

// Load CSV data for a specific category
async function loadCSVData(category) {
    try {
        const response = await fetch(CSV_URLS[category]);
        const csvText = await response.text();
        appData[category] = parseCSV(csvText);
    } catch (error) {
        console.error(`Error loading ${category} data:`, error);
        appData[category] = [];
    }
}

// Parse CSV text into an array of objects
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(header => header.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const obj = {};

        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });

        result.push(obj);
    }

    return result;
}

// Parse a single CSV line, handling commas within fields
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

// Render home page content
function renderHomePage() {
    // Render upcoming tournament on home page
    if (appData.upcoming_tournaments.length > 0) {
        renderTournamentCard(appData.upcoming_tournaments[0], 'upcoming-tournament-home');
    } else {
        document.getElementById('upcoming-tournament-home').innerHTML = '<p>No upcoming tournaments found.</p>';
    }

    // Render previous tournament on home page
    if (appData.previous_tournaments.length > 0) {
        renderTournamentCard(appData.previous_tournaments[0], 'previous-tournament-home');
    } else {
        document.getElementById('previous-tournament-home').innerHTML = '<p>No previous tournaments found.</p>';
    }

    // Render cubes on home page
    renderHomeCubes();
}

// Render tournament card
function renderTournamentCard(tournament, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
                <div class="tournament-img-home">
                    <img src="${tournament.image_url}" alt="${tournament.title}">
                </div>
                <div class="tournament-content-home">
                    <h3>${tournament.title}</h3>
                    <div class="tournament-meta-home">
                        <div><i class="fas fa-calendar-alt"></i> ${tournament.date}</div>
                        <div><i class="fas fa-map-marker-alt"></i> ${tournament.location}</div>
                        ${tournament.time ? `<div><i class="fas fa-clock"></i> ${tournament.time}</div>` : ''}
                    </div>
                    <p>${tournament.description}</p>
                </div>
            `;
}

// Render cubes on home page
function renderHomeCubes() {
    const container = document.getElementById('home-cubes-grid');

    if (!container) return;

    if (appData.cubes.length === 0) {
        container.innerHTML = '<p>No cubes found.</p>';
        return;
    }

    // Show only first 3 cubes on home page
    const cubesToShow = appData.cubes.slice(0, 3);

    container.innerHTML = cubesToShow.map(cube => `
                <div class="home-cube-item">
                    <div class="home-cube-img">
                        <img src="${cube.image_url}" alt="${cube.name}">
                    </div>
                    <div class="home-cube-caption">
                        <h4>${cube.name}</h4>
                        <p>${cube.description ? cube.description.substring(0, 100) + '...' : ''}</p>
                    </div>
                </div>
            `).join('');

    // Re-initialize image lightbox for new images
    initImageLightbox();
}

// Render tournaments for a specific tab
function renderTournaments(type) {
    const containerId = type === 'upcoming' ? 'upcoming-tournaments' : 'previous-tournaments';
    const container = document.getElementById(containerId);

    if (!container) return;

    const tournaments = type === 'upcoming' ? appData.upcoming_tournaments : appData.previous_tournaments;

    if (tournaments.length === 0) {
        container.innerHTML = '<p>No tournaments found.</p>';
        return;
    }

    container.innerHTML = tournaments.map((tournament, index) => {
        // For previous tournaments, check if we have gallery images
        let galleryHtml = '';
        if (type === 'previous' && tournament.gallery_images) {
            const galleryImages = tournament.gallery_images.split(';').map(img => img.trim()).filter(img => img);

            // Show first 4 images in gallery
            const galleryPreview = galleryImages.slice(0, 4);
            galleryHtml = `
                        <div class="tournament-gallery" id="gallery-${index}">
                            <h4 class="gallery-title">Event Gallery</h4>
                            <div class="gallery-grid">
                                ${galleryPreview.map(img => `
                                    <div class="gallery-item">
                                        <img src="${img}" alt="${tournament.title}">
                                    </div>
                                `).join('')}
                            </div>
                            ${galleryImages.length > 4 ? `<button class="expand-btn view-all-gallery" data-index="${index}" data-title="${tournament.title}">View All ${galleryImages.length} Photos</button>` : ''}
                        </div>
                    `;
        }

        // Add gallery toggle button for previous tournaments
        const galleryToggle = type === 'previous' && tournament.gallery_images ?
            `<button class="expand-btn toggle-gallery-btn" data-index="${index}">View Event Gallery</button>` : '';

        return `
                    <div class="tournament-card">
                        <div class="tournament-header">
                            <div class="tournament-img">
                                <img src="${tournament.image_url}" alt="${tournament.title}">
                            </div>
                            <div class="tournament-title">
                                <h3>${tournament.title}</h3>
                            </div>
                        </div>
                        <div class="tournament-content">
                            <div class="tournament-meta">
                                <div><i class="fas fa-calendar-alt"></i> ${tournament.date}</div>
                                <div><i class="fas fa-map-marker-alt"></i> ${tournament.location}</div>
                            </div>
                            <p>${tournament.description}</p>
                            ${galleryToggle}
                            ${galleryHtml}
                        </div>
                    </div>
                `;
    }).join('');

    // Add event listeners for gallery toggle buttons
    document.querySelectorAll('.toggle-gallery-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = this.getAttribute('data-index');
            const gallery = document.getElementById(`gallery-${index}`);
            gallery.classList.toggle('active');
            this.textContent = gallery.classList.contains('active') ? 'Hide Event Gallery' : 'View Event Gallery';
        });
    });

    // Add event listeners for "View All Photos" buttons
    document.querySelectorAll('.view-all-gallery').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = this.getAttribute('data-index');
            const title = this.getAttribute('data-title');
            const tournament = tournaments[index];
            const galleryImages = tournament.gallery_images.split(';').map(img => img.trim()).filter(img => img);
            openGalleryModal(galleryImages, title);
        });
    });

    // Re-initialize image lightbox for new images
    initImageLightbox();
}

// Render showcase items
function renderShowcase() {
    const container = document.getElementById('showcase-grid');

    if (!container) return;

    if (appData.showcase.length === 0) {
        container.innerHTML = '<p>No showcase items found.</p>';
        return;
    }

    container.innerHTML = appData.showcase.map(item => `
                <div class="showcase-item">
                    <div class="showcase-img">
                        <img src="${item.image_url}" alt="${item.title}">
                    </div>
                    <div class="showcase-caption">
                        <p>${item.title}</p>
                    </div>
                </div>
            `).join('');

    // Re-initialize image lightbox for new images
    initImageLightbox();
}

// Render cubes
function renderCubes() {
    const container = document.getElementById('cubes-grid');

    if (!container) return;

    if (appData.cubes.length === 0) {
        container.innerHTML = '<p>No cubes found.</p>';
        return;
    }

    container.innerHTML = appData.cubes.map(cube => {
        // Parse features (assuming they're separated by semicolons)
        const features = cube.features ? cube.features.split(';').map(feature => feature.trim()) : [];
        const featuresHtml = features.map(feature => `
                    <li><i class="fas fa-check"></i> ${feature}</li>
                `).join('');

        return `
                    <div class="cube-card">
                        <div class="cube-img">
                            <img src="${cube.image_url}" alt="${cube.name}">
                        </div>
                        <div class="cube-content">
                            <h3>${cube.name}</h3>
                            <p>${cube.description}</p>
                            
                            ${features.length > 0 ? `
                            <ul class="cube-features">
                                ${featuresHtml}
                            </ul>
                            ` : ''}
                        </div>
                    </div>
                `;
    }).join('');

    // Re-initialize image lightbox for new images
    initImageLightbox();
}

// Search functionality
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase().trim();
        searchResults.innerHTML = '';

        if (searchTerm.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        // Search through all data
        const results = [];

        // Search upcoming tournaments
        appData.upcoming_tournaments.forEach(item => {
            if ((item.title && item.title.toLowerCase().includes(searchTerm)) ||
                (item.description && item.description.toLowerCase().includes(searchTerm))) {
                results.push({ title: item.title, category: 'Upcoming Tournaments', page: 'tournaments' });
            }
        });

        // Search previous tournaments
        appData.previous_tournaments.forEach(item => {
            if ((item.title && item.title.toLowerCase().includes(searchTerm)) ||
                (item.description && item.description.toLowerCase().includes(searchTerm))) {
                results.push({ title: item.title, category: 'Previous Tournaments', page: 'tournaments' });
            }
        });

        // Search showcase
        appData.showcase.forEach(item => {
            if ((item.title && item.title.toLowerCase().includes(searchTerm)) ||
                (item.description && item.description.toLowerCase().includes(searchTerm))) {
                results.push({ title: item.title, category: 'Showcase', page: 'showcase' });
            }
        });

        // Search cubes
        appData.cubes.forEach(item => {
            if ((item.name && item.name.toLowerCase().includes(searchTerm)) ||
                (item.description && item.description.toLowerCase().includes(searchTerm))) {
                results.push({ title: item.name, category: 'Cubes', page: 'cubes' });
            }
        });

        if (results.length > 0) {
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                            <strong>${result.title}</strong>
                            <br><small>Category: ${result.category}</small>
                        `;
                resultItem.addEventListener('click', function () {
                    showPage(result.page);
                    searchInput.value = '';
                    searchResults.style.display = 'none';
                });
                searchResults.appendChild(resultItem);
            });
            searchResults.style.display = 'block';
        } else {
            const noResults = document.createElement('div');
            noResults.className = 'search-result-item';
            noResults.textContent = 'No results found';
            searchResults.appendChild(noResults);
            searchResults.style.display = 'block';
        }
    });

    // Hide search results when clicking outside
    document.addEventListener('click', function (e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    // Handle Enter key in search
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const firstResult = searchResults.querySelector('.search-result-item');
            if (firstResult) {
                firstResult.click();
            }
        }
    });
}

// Initialize gallery modal
function initGalleryModal() {
    const galleryModal = document.getElementById('galleryModal');
    const closeGallery = document.getElementById('closeGallery');

    closeGallery.addEventListener('click', function () {
        galleryModal.style.display = 'none';
    });

    galleryModal.addEventListener('click', function (e) {
        if (e.target === galleryModal) {
            galleryModal.style.display = 'none';
        }
    });
}

// Open gallery modal with all images
function openGalleryModal(images, title) {
    const galleryModal = document.getElementById('galleryModal');
    const galleryModalTitle = document.getElementById('galleryModalTitle');
    const galleryModalGrid = document.getElementById('galleryModalGrid');

    galleryModalTitle.textContent = title;
    galleryModalGrid.innerHTML = images.map(img => `
                <div class="gallery-modal-item">
                    <img src="${img}" alt="${title}">
                </div>
            `).join('');

    // Add click event to gallery images to open in lightbox
    galleryModalGrid.querySelectorAll('img').forEach((img, index) => {
        img.addEventListener('click', function () {
            openLightbox(images, index);
        });
    });

    galleryModal.style.display = 'block';
}

// Image Lightbox functionality
function initImageLightbox() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const captionText = document.getElementById('modalCaption');
    const closeBtn = document.querySelector('.close');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');

    // Get all images that should be clickable
    const clickableImages = document.querySelectorAll(`
                .tournament-img-home img,
                .tournament-img img,
                .gallery-item img,
                .gallery-modal-item img,
                .showcase-img img,
                .cube-img img,
                .home-cube-img img
            `);

    let currentImageIndex = 0;
    let currentImages = [];

    function openLightbox(images, index) {
        currentImages = images;
        currentImageIndex = index;
        modal.style.display = 'block';
        modalImg.src = currentImages[currentImageIndex];
        captionText.innerHTML = '';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    function showNextImage() {
        currentImageIndex = (currentImageIndex + 1) % currentImages.length;
        modalImg.src = currentImages[currentImageIndex];
    }

    function showPrevImage() {
        currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
        modalImg.src = currentImages[currentImageIndex];
    }

    // Event listeners for modal controls
    closeBtn.addEventListener('click', closeModal);
    prevBtn.addEventListener('click', showPrevImage);
    nextBtn.addEventListener('click', showNextImage);

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
        if (modal.style.display === 'block') {
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowRight') showNextImage();
            if (e.key === 'ArrowLeft') showPrevImage();
        }
    });

    // Close modal when clicking outside the image
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Set up click events for images
    clickableImages.forEach((img, index) => {
        img.addEventListener('click', function () {
            // Collect all images in the current context
            const contextImages = [];
            const parent = this.closest('.tournament-card, .showcase-item, .cube-card, .home-cube-item, .gallery-modal-item, .gallery-item');

            if (parent) {
                if (parent.classList.contains('gallery-modal-item') || parent.classList.contains('gallery-item')) {
                    // For gallery images, use all images in the gallery
                    const gallery = this.closest('.tournament-gallery, .gallery-modal-grid');
                    if (gallery) {
                        gallery.querySelectorAll('img').forEach(galleryImg => {
                            contextImages.push(galleryImg.src);
                        });
                    }
                } else {
                    // For other images, use all images in the same container
                    const container = parent.closest('.tournament-list, .showcase-grid, .cubes-grid, .home-cubes-grid, .tournament-card-home');
                    if (container) {
                        container.querySelectorAll('img').forEach(containerImg => {
                            contextImages.push(containerImg.src);
                        });
                    }
                }
            }

            // If we couldn't find context images, use all images on the page
            if (contextImages.length === 0) {
                clickableImages.forEach(clickableImg => {
                    contextImages.push(clickableImg.src);
                });
            }

            // Find the index of the clicked image
            const clickedIndex = contextImages.indexOf(this.src);
            openLightbox(contextImages, clickedIndex);
        });
    });
}
