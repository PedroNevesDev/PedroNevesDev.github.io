document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    const project = params.get('project');

    if (!project) {
        displayError('Project not found');
        return;
    }

    const projectPath = `projects/${project}/gameoverview/`;

    loadGameOverview(projectPath);
    loadDevLogs(projectPath);  // Load devlogs after the game overview
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
            displayError('Failed to load carousel media.');
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
    const devlogsContainer = document.getElementById('devlogs-section');
    devlogsContainer.style.display = 'block'; // Make sure to show the section

    fetch(`${projectPath}devlogs/`)
        .then(response => {
            if (response.ok) {
                return response.text();
            } else {
                throw new Error('No devlogs folder found');
            }
        })
        .then(text => {
            const files = text.match(/<a href="([^"]+\.txt)">/g);
            if (files) {
                files.forEach(file => {
                    const filename = file.match(/<a href="([^"]+)">/)[1];
                    createCollapsibleDevlog(filename, projectPath);
                });
            } else {
                devlogsContainer.style.display = 'none'; // Hide if no files found
            }
        })
        .catch(error => {
            console.error('Failed to load devlogs:', error);
            devlogsContainer.style.display = 'none'; // Hide if folder doesn't exist
        });
}



function createCollapsibleDevlog(filename, projectPath) {
    const devlogsContainer = document.getElementById('devlogs-container'); // Change here
    const collapsible = document.createElement('button');
    collapsible.textContent = filename.replace(/_/g, ' '); // Replace underscores with spaces
    collapsible.classList.add('collapsible');
    devlogsContainer.appendChild(collapsible); // Append to devlogs-container

    const content = document.createElement('div');
    content.classList.add('content');

    fetch(`${projectPath}devlogs/${filename}`)
        .then(response => response.text())
        .then(text => {
            content.innerHTML = text.replace(/\n/g, '<br>'); // Convert newlines to <br>
        });

    collapsible.addEventListener('click', function () {
        this.classList.toggle('active');
        content.style.display = content.style.display === 'block' ? 'none' : 'block';
    });

    devlogsContainer.appendChild(content); // Append to devlogs-container
}


