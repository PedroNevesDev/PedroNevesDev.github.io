(function () {
    const projects = window.PORTFOLIO_PROJECT_ORDER || [];
    const STORAGE_THEME = 'pn_portfolio_theme';

    function setPortfolioTheme(dark) {
        try {
            if (dark) {
                document.body.classList.add('theme-dark');
                localStorage.setItem(STORAGE_THEME, 'dark');
            } else {
                document.body.classList.remove('theme-dark');
                localStorage.setItem(STORAGE_THEME, 'light');
            }
        } catch (err) {
            document.body.classList.toggle('theme-dark', !!dark);
        }
        window.dispatchEvent(new CustomEvent('portfolio-themechange'));
    }

    function initLightsToggle() {
        const btn = document.getElementById('lights-toggle');
        if (!btn) return;

        const label = btn.querySelector('.lights-toggle__text');
        function syncButton() {
            const dark = document.body.classList.contains('theme-dark');
            btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
            const t = dark ? 'Turn on the lights' : 'Turn off the lights';
            btn.setAttribute('aria-label', t);
            if (label) {
                label.textContent = t;
            }
        }

        btn.addEventListener('click', function () {
            setPortfolioTheme(!document.body.classList.contains('theme-dark'));
        });
        window.addEventListener('portfolio-themechange', syncButton);
        syncButton();
    }

    let currentSlide = 0;

    function getProjectIndex(slug) {
        const i = projects.indexOf(slug);
        return i === -1 ? null : i + 1;
    }

    function layoutCarousel() {
        const carousel = document.getElementById('carousel');
        const vp = document.querySelector('.go-carousel-viewport');
        const wrap = document.getElementById('carousel-container');
        if (!carousel || !vp || !wrap) return;

        const slides = carousel.querySelectorAll('.go-carousel-slide');
        const w = vp.clientWidth;
        slides.forEach(function (slide) {
            slide.style.width = w + 'px';
        });
        carousel.style.width = slides.length * w + 'px';
        updateCarouselTransform();
        wrap.classList.toggle('is-single', slides.length <= 1);
    }

    function updateCarouselTransform() {
        const carousel = document.getElementById('carousel');
        const vp = document.querySelector('.go-carousel-viewport');
        if (!carousel || !vp) return;
        const slides = carousel.querySelectorAll('.go-carousel-slide');
        if (!slides.length) return;
        const w = vp.clientWidth;
        currentSlide = Math.max(0, Math.min(currentSlide, slides.length - 1));
        carousel.style.transform = 'translateX(-' + currentSlide * w + 'px)';
    }

    function goPrev() {
        const slides = document.querySelectorAll('.go-carousel-slide');
        if (slides.length <= 1) return;
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateCarouselTransform();
    }

    function goNext() {
        const slides = document.querySelectorAll('.go-carousel-slide');
        if (slides.length <= 1) return;
        currentSlide = (currentSlide + 1) % slides.length;
        updateCarouselTransform();
    }

    let resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(layoutCarousel, 100);
    });

    function displayError(message) {
        var titleEl = document.getElementById('game-title');
        var descEl = document.getElementById('game-description');
        if (titleEl) titleEl.textContent = 'Error';
        if (descEl) descEl.textContent = message;
    }

    document.addEventListener('DOMContentLoaded', function () {
        initLightsToggle();

        var params = new URLSearchParams(window.location.search);
        var project = params.get('project');

        if (!project) {
            displayError('No project specified.');
            return;
        }

        var idx = getProjectIndex(project);
        var indexEl = document.getElementById('overview-index');
        if (indexEl) {
            if (idx !== null) {
                indexEl.textContent = String(idx).padStart(2, '0') + ' · Project';
            } else {
                indexEl.textContent = 'Project';
            }
        }

        var projectPath = 'projects/' + project + '/gameoverview/';

        var prevBtn = document.getElementById('prev-button');
        var nextBtn = document.getElementById('next-button');
        if (prevBtn) prevBtn.addEventListener('click', goPrev);
        if (nextBtn) nextBtn.addEventListener('click', goNext);

        loadGameOverview(projectPath);
        loadDevLogs(projectPath);
    });

    function loadGameOverview(projectPath) {
        Promise.all([
            fetch(projectPath + 'title.txt').then(function (r) {
                return r.ok ? r.text() : 'Unknown title';
            }),
            fetch(projectPath + 'description.txt').then(function (r) {
                return r.ok ? r.text() : 'No description available.';
            }),
        ])
            .then(function (results) {
                var t = results[0].trim();
                document.getElementById('game-title').textContent = t;
                document.getElementById('game-description').textContent = results[1].trim();
                document.title = t + ' — Pedro Neves';

                loadCarousel(projectPath);
                checkUnityBuild(projectPath);
            })
            .catch(function (err) {
                console.error('Failed to load game overview details:', err);
                displayError('Failed to load overview.');
            });
    }

    function loadCarousel(projectPath) {
        var mediaExtensions = ['jpg', 'jpeg', 'png', 'mp4', 'webm', 'ogg'];

        fetch(projectPath + 'carousel/files.json')
            .then(function (r) {
                return r.json();
            })
            .then(function (files) {
                var validFiles = files.filter(function (file) {
                    var ext = file.split('.').pop().toLowerCase();
                    return mediaExtensions.indexOf(ext) !== -1;
                });

                validFiles.forEach(function (file) {
                    var mediaType =
                        file.endsWith('mp4') || file.endsWith('webm') || file.endsWith('ogg') ? 'video' : 'image';
                    addMediaToCarousel(projectPath + 'carousel/' + file, mediaType);
                });

                currentSlide = 0;
                requestAnimationFrame(function () {
                    layoutCarousel();
                });
            })
            .catch(function (err) {
                console.error('Failed to load carousel media files:', err);
                var desc = document.getElementById('game-description');
                if (desc) {
                    desc.textContent =
                        (desc.textContent || '') +
                        '\n\n(Carousel media could not be loaded.)';
                }
            });
    }

    function addMediaToCarousel(mediaUrl, type) {
        var carousel = document.getElementById('carousel');
        if (!carousel) return;

        var slide = document.createElement('div');
        slide.className = 'go-carousel-slide';

        var mediaEl =
            type === 'video' ? document.createElement('video') : document.createElement('img');

        if (type === 'video') {
            mediaEl.src = mediaUrl;
            mediaEl.controls = true;
            mediaEl.playsInline = true;
        } else {
            mediaEl.src = mediaUrl;
            mediaEl.alt = '';
        }

        slide.appendChild(mediaEl);
        carousel.appendChild(slide);
    }

    function checkUnityBuild(projectPath) {
        var playBtn = document.getElementById('play-button');
        if (!playBtn) return;

        fetch(projectPath + 'unitybuild/index.html')
            .then(function (response) {
                if (response.ok) {
                    playBtn.removeAttribute('hidden');
                    setupUnityBuild(projectPath);
                }
            })
            .catch(function () {});
    }

    function setupUnityBuild(projectPath) {
        var playButton = document.getElementById('play-button');
        var unityIframe = document.getElementById('unity-iframe');
        if (!playButton || !unityIframe) return;

        playButton.addEventListener('click', function () {
            unityIframe.src = projectPath + 'unitybuild/index.html';
            unityIframe.removeAttribute('hidden');
            playButton.setAttribute('hidden', '');
        });
    }

    function loadDevLogs(projectPath) {
        var devlogsSection = document.getElementById('devlogs-section');
        var devlogsContainer = document.getElementById('devlogs-container');
        if (!devlogsSection || !devlogsContainer) return;

        fetch(projectPath + 'devlogs.json')
            .then(function (response) {
                if (!response.ok) throw new Error('No devlogs');
                return response.json();
            })
            .then(function (data) {
                var devlogs = data.devlogs || [];
                if (devlogs.length === 0) {
                    devlogsContainer.textContent = 'No devlogs available.';
                } else {
                    devlogs.forEach(function (filename) {
                        createCollapsibleDevlog(filename, projectPath);
                    });
                }
                devlogsSection.removeAttribute('hidden');
            })
            .catch(function () {
                devlogsSection.setAttribute('hidden', '');
            });
    }

    function createCollapsibleDevlog(filename, projectPath) {
        var devlogsContainer = document.getElementById('devlogs-container');

        var collapsibleDiv = document.createElement('div');
        collapsibleDiv.className = 'collapsible';

        var title = document.createElement('button');
        title.type = 'button';
        title.className = 'collapsible-title';
        title.textContent = filename.replace('.txt', '');

        var content = document.createElement('div');
        content.className = 'collapsible-content';
        content.hidden = true;

        fetch(projectPath + 'devlogs/' + filename)
            .then(function (response) {
                if (!response.ok) throw new Error('fetch failed');
                return response.text();
            })
            .then(function (text) {
                content.textContent = text;
            })
            .catch(function () {
                content.textContent = 'Failed to load content.';
            });

        title.addEventListener('click', function () {
            title.classList.toggle('active');
            content.hidden = !content.hidden;
        });

        collapsibleDiv.appendChild(title);
        collapsibleDiv.appendChild(content);
        devlogsContainer.appendChild(collapsibleDiv);
    }
})();
