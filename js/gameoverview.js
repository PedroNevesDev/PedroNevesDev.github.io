// JavaScript for game overview page
document.addEventListener('DOMContentLoaded', function () {
    // Get the project name from the URL parameters
    const params = new URLSearchParams(window.location.search);
    const project = params.get('project');

    if (!project) {
        displayError('Project not found');
        return;
    }

    // Base path for the project folder
    const projectPath = `projects/${project}/gameoverview/`;

    // Load game overview data
    loadGameOverview(projectPath);
});

function displayError(message) {
    document.getElementById('game-title').textContent = 'Error';
    document.getElementById('game-description').textContent = message;
}

function loadGameOverview(projectPath) {
    // Fetch title and description from the project folder
    Promise.all([
        fetch(`${projectPath}title.txt`).then(response => response.ok ? response.text() : 'Unknown Title'),
        fetch(`${projectPath}description.txt`).then(response => response.ok ? response.text() : 'No description available.')
    ])
    .then(([title, description]) => {
        document.getElementById('game-title').textContent = title;
        document.getElementById('game-description').textContent = description;

        // Load carousel images and videos
        loadCarousel(projectPath);

        // Check if the Unity build exists and setup Unity build button
        checkUnityBuild(projectPath);
    })
    .catch(error => {
        console.error('Failed to load game overview details:', error);
        displayError('Failed to load game overview details.');
    });
}

function loadCarousel(projectPath) {
    const carouselContainer = document.getElementById('carousel');
    const mediaExtensions = ['jpg', 'jpeg', 'png', 'mp4', 'webm', 'ogg'];

    // Fetch the list of media files dynamically from the folder
    fetch(`${projectPath}carousel/files.json`)
        .then(response => response.json())
        .then(files => {
            // Filter out valid media files
            const validFiles = files.filter(file => {
                const fileExtension = file.split('.').pop().toLowerCase();
                return mediaExtensions.includes(fileExtension);
            });

            // Add media files to the carousel
            validFiles.forEach(file => {
                const fileExtension = file.split('.').pop().toLowerCase();
                const mediaType = fileExtension.startsWith('mp') ? 'video' : 'image';
                addMediaToCarousel(`${projectPath}carousel/${file}`, mediaType);
            });

            // Hide navigation buttons if only one file exists
            if (validFiles.length <= 1) {
                document.getElementById('prev-button').style.display = 'none';
                document.getElementById('next-button').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Failed to load carousel media files:', error);
            displayError('Failed to load carousel media.');
        });
}


function addMediaToCarousel(mediaUrl, type) {
    const carousel = document.getElementById('carousel');
    const mediaElement = document.createElement(type === 'video' ? 'video' : 'img');

    if (type === 'video') {
        mediaElement.src = mediaUrl;
        mediaElement.controls = true; // Add controls for video
        mediaElement.className = 'carousel-slide';
    } else {
        mediaElement.src = mediaUrl;
        mediaElement.className = 'carousel-slide';
        mediaElement.alt = 'Image slide';
    }
    
    carousel.appendChild(mediaElement);
}

function checkUnityBuild(projectPath) {
    fetch(`${projectPath}unitybuild/index.html`)
        .then(response => {
            if (response.ok) {
                setupUnityBuild(projectPath);
            } else {
                document.getElementById('play-button').style.display = 'none'; // Hide the play button if Unity build does not exist
            }
        })
        .catch(() => {
            document.getElementById('play-button').style.display = 'none'; // Hide the play button on error
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




