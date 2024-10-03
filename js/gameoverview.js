document.addEventListener('DOMContentLoaded', function () {
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

        // Load carousel images and videos
        loadCarousel(projectPath);

        // Check if the unitybuild folder exists and setup the Unity build button
        checkUnityBuild(projectPath);
    })
    .catch(error => {
        console.error('Failed to load game overview details:', error);
        displayError('Failed to load game overview details.');
    });
}

function loadCarousel(projectPath) {
    const carousel = document.getElementById('carousel');
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    const videoExtensions = ['mp4', 'webm', 'ogg'];
    let mediaIndex = 1;
    let mediaFound = false;

    const loadImageOrVideo = (index) => {
        const imageUrls = imageExtensions.map(ext => `${projectPath}carousel/image${index}.${ext}`);
        const videoUrls = videoExtensions.map(ext => `${projectPath}carousel/video${index}.${ext}`);

        // Try loading an image
        Promise.any(imageUrls.map(url => fetch(url).then(res => res.ok ? url : Promise.reject())))
            .then(imageUrl => {
                mediaFound = true;
                addMediaToCarousel(imageUrl, 'image', index);
                loadImageOrVideo(index + 1); // Load the next media
            })
            .catch(() => {
                // Try loading a video if no image is found
                Promise.any(videoUrls.map(url => fetch(url).then(res => res.ok ? url : Promise.reject())))
                    .then(videoUrl => {
                        mediaFound = true;
                        addMediaToCarousel(videoUrl, 'video', index);
                        loadImageOrVideo(index + 1); // Load the next media
                    })
                    .catch(() => {
                        // When all images and videos are checked, hide the carousel if no media is found
                        if (index === 1 && !mediaFound) {
                            hideCarousel();
                        } else {
                            loadImageOrVideo(index + 1); // Attempt to load the next index even if previous ones failed
                        }
                    });
            });
    };

    loadImageOrVideo(mediaIndex);
    setupCarouselNavigation();
}

function addMediaToCarousel(mediaUrl, type, index) {
    const carousel = document.getElementById('carousel');
    const mediaElement = document.createElement('img');
    mediaElement.className = 'carousel-slide';
    mediaElement.src = mediaUrl;
    mediaElement.alt = `${type} ${index}`;
    mediaElement.dataset.type = type;
    mediaElement.dataset.url = mediaUrl;
    carousel.appendChild(mediaElement);

    // Display the first media in the selection area by default
    if (index === 1) {
        setSelectedContent(mediaUrl, type);
    }

    mediaElement.addEventListener('click', () => {
        setSelectedContent(mediaUrl, type);
    });
}

function setSelectedContent(url, type) {
    const selectedImage = document.getElementById('selected-image');
    const selectedVideo = document.getElementById('selected-video');

    if (type === 'image') {
        selectedImage.style.display = 'block';
        selectedImage.src = url;
        selectedVideo.style.display = 'none';
    } else if (type === 'video') {
        selectedVideo.style.display = 'block';
        selectedVideo.src = url;
        selectedImage.style.display = 'none';
    }
}

function hideCarousel() {
    const carouselContainer = document.getElementById('carousel-container');
    carouselContainer.style.display = 'none';
    const selectedContentContainer = document.getElementById('selected-content-container');
    selectedContentContainer.style.display = 'none';
}

function setupCarouselNavigation() {
    const carousel = document.getElementById('carousel');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    let currentIndex = 0;

    const updateCarousel = () => {
        const slideWidth = carousel.clientWidth / 6; // Adjust to show 6 slides at a time
        carousel.style.transform = `translateX(${-currentIndex * slideWidth}px)`;
    };

    nextButton.addEventListener('click', () => {
        const totalSlides = carousel.children.length;
        if (currentIndex < totalSlides - 6) { // Allow next if there are more than 6 slides
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

function checkUnityBuild(projectPath) {
    // Check if the Unity build folder exists
    fetch(`${projectPath}unitybuild/index.html`)
        .then(response => {
            if (response.ok) {
                setupUnityBuild(projectPath);
            } else {
                // Hide the Play button if the unitybuild folder does not exist
                document.getElementById('play-button').style.display = 'none';
            }
        })
        .catch(() => {
            // Hide the Play button if there was an error fetching the Unity build
            document.getElementById('play-button').style.display = 'none';
        });
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














