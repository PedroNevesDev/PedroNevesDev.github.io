// JavaScript for fade-in effect
document.addEventListener('DOMContentLoaded', function () {
    const sections = document.querySelectorAll('.section');

    function checkSectionInView() {
        const viewportHeight = window.innerHeight;
        sections.forEach(section => {
            const { top, bottom } = section.getBoundingClientRect();
            if (top < viewportHeight && bottom > 0) {
                section.classList.add('fade-in');
            } else {
                section.classList.remove('fade-in');
            }
        });
    }

    window.addEventListener('scroll', checkSectionInView);
    window.addEventListener('resize', checkSectionInView);
    checkSectionInView(); // Trigger on page load
});

// JavaScript for game overview
function openGameOverview(gameTitle) {
    const gameOverview = document.getElementById('game-overview');
    gameOverview.querySelector('#game-title').textContent = gameTitle;
    gameOverview.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent body scroll
}

function closeGameOverview() {
    const gameOverview = document.getElementById('game-overview');
    gameOverview.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore body scroll
}

// JavaScript for carousel controls
let currentSlide = 0;

function showSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    if (index >= slides.length) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = slides.length - 1;
    } else {
        currentSlide = index;
    }
    slides.forEach((slide, i) => {
        slide.style.transform = `translateX(${-(currentSlide * 100)}%)`;
    });
}

function nextSlide() {
    showSlide(currentSlide + 1);
}

function prevSlide() {
    showSlide(currentSlide - 1);
}

const projectsContainer = document.getElementById('projects-container');

// List of project folders (add more project folders here as needed)
const projects = [
    'SOL',
    'PerfectClue',
    'Lou',
    'Plantaforma',
    'FryMe',
    // Add more projects as needed
];

// Base path to the projects folder
const basePath = 'projects/';

projects.forEach(project => {
    const projectPath = `${basePath}${project}/`;

    // Fetch the title, description, and image
    Promise.all([
        fetch(`${projectPath}title.txt`).then(response => response.text()),
        fetch(`${projectPath}description.txt`).then(response => response.text()),
        fetch(`${projectPath}image.png`).then(response => response.blob())
    ]).then(([title, description, imageBlob]) => {
        const imageUrl = URL.createObjectURL(imageBlob);

        // Create the project card as a clickable link
        const projectCard = document.createElement('a');
        projectCard.className = 'project-card';
        projectCard.href = `gameoverview.html?project=${project}`; // Make the whole card clickable

        projectCard.innerHTML = `
            <div class="project-image">
                <img src="${imageUrl}" alt="${title}">
            </div>
            <div class="project-title">
                <h3>${title}</h3>
            </div>
            <div class="project-description">
                <p class="project-card-text">${description}</p>
            </div>
        `;

        // Append the project card to the container
        projectsContainer.appendChild(projectCard);
    }).catch(error => {
        console.error('Error loading project data:', error);
    });
});






