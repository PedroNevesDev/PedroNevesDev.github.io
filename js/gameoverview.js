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

        // Load related links
        loadRelatedLinks(projectPath);

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
            files.forEach(file => {
                const fileExtension = file.split('.').pop().toLowerCase();
                if (mediaExtensions.includes(fileExtension)) {
                    const mediaType = fileExtension.startsWith('mp') ? 'video' : 'image';
                    addMediaToCarousel(`${projectPath}carousel/${file}`, mediaType);
                }
            });
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

// Load related links
function loadRelatedLinks(projectPath) {
    const linksSection = document.getElementById('links-section');
    const linksList = document.getElementById('links-list');

    // Try to fetch links.json or links.txt
    fetch(`${projectPath}links.json`)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                // Try fetching links.txt if links.json doesn't exist
                return fetch(`${projectPath}links.txt`).then(response => response.text());
            }
        })
        .then(data => {
            if (typeof data === 'string') {
                // Parse links.txt if loaded as text
                const links = parseLinksFromText(data);
                if (links.length > 0) {
                    displayLinks(links, linksList, linksSection);
                } else {
                    hideLinksSection(linksSection);
                }
            } else if (Array.isArray(data)) {
                // If data is a JSON array, display links directly
                if (data.length > 0) {
                    displayLinks(data, linksList, linksSection);
                } else {
                    hideLinksSection(linksSection);
                }
            }
        })
        .catch(error => {
            console.error('Failed to load links:', error);
            hideLinksSection(linksSection); // Hide links section if fetching fails
        });
}

function parseLinksFromText(text) {
    const lines = text.split('\n');
    const links = [];
    lines.forEach(line => {
        const [textToDisplay, url] = line.split(',');
        if (textToDisplay && url) {
            links.push({ textToDisplay: textToDisplay.trim(), url: url.trim() });
        }
    });
    return links;
}

function displayLinks(links, linksList, linksSection) {
    linksSection.style.display = 'block'; // Show the section
    linksList.innerHTML = ''; // Clear any previous links

    links.forEach(link => {
        const listItem = document.createElement('li');
        const linkElement = document.createElement('a');
        linkElement.href = link.url;
        linkElement.textContent = link.textToDisplay;
        listItem.appendChild(linkElement);
        linksList.appendChild(listItem);
    });
}

function hideLinksSection(linksSection) {
    linksSection.style.display = 'none';
}



