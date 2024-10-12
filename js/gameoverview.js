document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    const project = params.get('project');

    if (!project) {
        displayError('Project not found');
        return;
    }

    const projectPath = `projects/${project}/gameoverview/`;

    loadGameOverview(projectPath);
    loadDevLogs(projectPath); // Load devlogs after the game overview
});

function displayError(message) {
    document.getElementById('game-title').textContent = 'Error';
    document.getElementById('game-description').textContent = message;
}

function loadGameOverview(projectPath) {
    Promise.all([
        fetch(`${projectPath}title.txt`).then(response => response.ok ? response.text() : 'Unknown Title'),
        fetch(`${projectPath}description.txt`).then(response => response.ok ? response.text() : 'No description available.')
    ])
    .then(([title, description]) => {
        document.getElementById('game-title').textContent = title;
        document.getElementById('game-description').textContent = description;

        loadCarousel(projectPath);
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

    fetch(`${projectPath}carousel/files.json`)
        .then(response => response.json())
        .then(files => {
            const validFiles = files.filter(file => {
                const fileExtension = file.split('.').pop().toLowerCase();
                return mediaExtensions.includes(fileExtension);
            });

            validFiles.forEach(file => {
                const mediaType = file.endsWith('mp4') || file.endsWith('webm') ? 'video' : 'image';
                addMediaToCarousel(`${projectPath}carousel/${file}`, mediaType);
            });

            if (validFiles.length <= 1) {
                document.getElementById('prev-button').style.display = 'none';
                document.getElementById('next-button').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Failed to load carousel media files:', error);
            displayError('Failed to load carousel.');
        });
}

function addMediaToCarousel(mediaUrl, type) {
    const carousel = document.getElementById('carousel');
    const mediaElement = document.createElement(type === 'video' ? 'video' : 'img');

    if (type === 'video') {
        mediaElement.src = mediaUrl;
        mediaElement.controls = true;
    } else {
        mediaElement.src = mediaUrl;
        mediaElement.alt = 'Image slide';
    }

    mediaElement.className = 'carousel-slide';
    carousel.appendChild(mediaElement);
}

function checkUnityBuild(projectPath) {
    fetch(`${projectPath}unitybuild/index.html`)
        .then(response => {
            if (response.ok) {
                setupUnityBuild(projectPath);
            } else {
                document.getElementById('play-button').style.display = 'none';
            }
        })
        .catch(() => {
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

function loadDevLogs(projectPath) {
    const devlogsSection = document.getElementById('devlogs-section');
    const devlogsContainer = document.getElementById('devlogs-container');

    fetch(`${projectPath}devlogs.json`) // Change this to your correct path
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json(); // Parse the JSON response
        })
        .then(data => {
            console.log('Devlogs data:', data); // Log the received data
            const devlogs = data.devlogs; // Access the array of devlog filenames

            if (devlogs.length === 0) {
                devlogsContainer.innerHTML = 'No devlogs available.';
                devlogsSection.style.display = 'block'; // Show section even if empty
            } else {
                devlogs.forEach(filename => {
                    createCollapsibleDevlog(filename, projectPath);
                });
                devlogsSection.style.display = 'block'; // Show the section if there are devlogs
            }
        })
        .catch(error => {
            console.error('Failed to load devlogs:', error);
            const devlogsContainer = document.getElementById('devlogs-container');
            devlogsContainer.innerHTML = 'Failed to load devlogs.';
            devlogsSection.style.display = 'block'; // Show section even if error occurred
        });
}

function createCollapsibleDevlog(filename, projectPath) {
    const devlogsContainer = document.getElementById('devlogs-container');
    
    // Create the collapsible section
    const collapsibleDiv = document.createElement('div');
    collapsibleDiv.className = 'collapsible';
    
    // Create the title for the collapsible
    const title = document.createElement('button');
    title.className = 'collapsible-title';
    title.innerText = filename.replace('.txt', ''); // Display without .txt

    // Create the content area for the devlog
    const content = document.createElement('div');
    content.className = 'collapsible-content'; // Ensure this matches the style
    content.style.display = 'none'; // Hidden by default

    console.log(`Fetching content for: ${filename}`); // Debug log

    // Fetch the content of the devlog file
    fetch(`${projectPath}devlogs/${filename}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching ${filename}: ${response.status}`);
            }
            return response.text(); // Get the text content
        })
        .then(text => {
            content.innerText = text; // Insert text content into collapsible
            collapsibleDiv.appendChild(title);
            collapsibleDiv.appendChild(content);
            devlogsContainer.appendChild(collapsibleDiv); // Append to the container
        })
        .catch(error => {
            console.error('Failed to load devlog content:', error);
            content.innerText = 'Failed to load content.';
            collapsibleDiv.appendChild(title);
            collapsibleDiv.appendChild(content);
            devlogsContainer.appendChild(collapsibleDiv); // Append to the container even on error
        });

    // Toggle the collapsible content
    title.addEventListener('click', function () {
        this.classList.toggle('active');
        if (content.style.display === 'block') {
            content.style.display = 'none';
        } else {
            content.style.display = 'block';
        }
    });
}

