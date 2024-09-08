document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const project = params.get('project');

    if (!project) {
        displayError('Project not found');
        return;
    }

    const projectPath = `projects/${project}/gameoverview/`;
    loadGameOverview(projectPath);
});

function displayError(message) {
    document.getElementById('game-title').textContent = 'Error';
    document.getElementById('game-description').textContent = message;
}

function loadGameOverview(projectPath) {
    // Load title and description
    Promise.all([
        fetch(`${projectPath}title.txt`).then(response => response.ok ? response.text() : 'Unknown Title'),
        fetch(`${projectPath}description.txt`).then(response => response.ok ? response.text() : 'No description available.')
    ])
    .then(([title, description]) => {
        document.getElementById('game-title').textContent = title;
        document.getElementById('game-description').textContent = description;

        // Load carousel images
        loadCarousel(projectPath);

        // Setup the Unity build button
        setupUnityBuild(projectPath);
    })
    .catch(error => {
        console.error('Failed to load game overview details:', error);
        displayError('Failed to load game overview details.');
    });
}

function loadCarousel(projectPath) {
    const carousel = document.getElementById('carousel');
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    let imageIndex = 1;

    const loadImage = (index) => {
        const tryExtensions = imageExtensions.map(ext => `${projectPath}carousel/image${index}.${ext}`);
        Promise.any(tryExtensions.map(url => fetch(url).then(res => res.ok ? url : Promise.reject(url))))
            .then(validUrl => {
                const img = document.createElement('img');
                img.className = 'carousel-slide';
                img.src = validUrl;
                img.alt = `Screenshot ${index}`;
                carousel.appendChild(img);

                loadImage(index + 1); // Load the next image
            })
            .catch(() => {
                if (index === 1) { // If no images were loaded, add a placeholder
                    const placeholder = document.createElement('img');
                    placeholder.className = 'carousel-slide';
                    placeholder.src = 'https://via.placeholder.com/800x600?text=Placeholder+Image'; // Placeholder image URL
                    placeholder.alt = 'Placeholder image';
                    carousel.appendChild(placeholder);
                }
            });
    };

    loadImage(imageIndex);

    setupCarouselNavigation();
}

function setupCarouselNavigation() {
    const carousel = document.getElementById('carousel');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    let currentIndex = 0;

    const updateCarousel = () => {
        const slideWidth = carousel.clientWidth / 3;
        carousel.style.transform = `translateX(${-currentIndex * slideWidth}px)`;
    };

    nextButton.addEventListener('click', () => {
        const totalSlides = carousel.children.length;
        if (currentIndex < totalSlides - 3) {
            currentIndex++;
            updateCarousel();
        }
    });

    prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });

    window.addEventListener('resize', updateCarousel);
}

function setupUnityBuild(projectPath) {
    const playButton = document.getElementById('play-button');
    const unityIframe = document.getElementById('unity-iframe');

    playButton.addEventListener('click', () => {
        unityIframe.src = `${projectPath}unitybuild/index.html`;
        unityIframe.style.display = 'block';
        playButton.style.display = 'none';
    });
}













