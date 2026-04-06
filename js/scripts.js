(function () {
    const STORAGE_INTRO = 'pn_portfolio_intro_done_v1';

    const projects = ['Heisties', 'PerfectClue', 'Lou', 'Plantaforma', 'FryMe'];
    const basePath = 'projects/';

    const introSteps = [
        { speaker: 'Pedro', text: 'Welcome to my portfolio.' },
        { speaker: 'Pedro', text: "I'm Pedro Neves — I build games, tools, and visual experiments." },
        { speaker: 'Pedro', text: 'What would you like to see?', showChoices: true },
    ];

    const dialogueLine = document.getElementById('dialogue-line');
    const dialogueChoices = document.getElementById('dialogue-choices');
    const introOverlay = document.getElementById('intro-overlay');
    const introTitle = document.getElementById('intro-title');
    const skipBtn = document.getElementById('dialogue-skip');
    const menuToggle = document.getElementById('menu-toggle');
    const menuOverlay = document.getElementById('menu-overlay');
    const replayIntro = document.getElementById('replay-intro');

    let introStep = 0;
    let typeTimer = null;

    function scrollToId(id) {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function closeIntro() {
        if (typeTimer) {
            clearTimeout(typeTimer);
            typeTimer = null;
        }
        introOverlay.setAttribute('hidden', '');
        document.body.style.overflow = '';
        sessionStorage.setItem(STORAGE_INTRO, '1');
    }

    function openIntro() {
        introOverlay.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        introStep = 0;
        dialogueChoices.hidden = true;
        dialogueChoices.innerHTML = '';
        runIntroStep();
    }

    function typeText(full, done) {
        if (typeTimer) clearTimeout(typeTimer);
        dialogueLine.textContent = '';
        let i = 0;
        const speed = 22;

        function tick() {
            if (i <= full.length) {
                dialogueLine.textContent = full.slice(0, i);
                i++;
                typeTimer = setTimeout(tick, speed);
            } else {
                typeTimer = null;
                if (done) done();
            }
        }
        tick();
    }

    function showChoiceButtons() {
        dialogueChoices.hidden = false;
        dialogueChoices.innerHTML = '';
        const targets = [
            { label: 'More about me', id: 'scene-about' },
            { label: 'Unity projects', id: 'scene-unity' },
            { label: '3D, VFX & more', id: 'scene-others' },
        ];
        targets.forEach(function (t) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'choice-btn';
            btn.textContent = t.label;
            btn.addEventListener('click', function () {
                closeIntro();
                setTimeout(function () {
                    scrollToId(t.id);
                }, 120);
            });
            dialogueChoices.appendChild(btn);
        });
    }

    function runIntroStep() {
        const step = introSteps[introStep];
        if (!step) {
            showChoiceButtons();
            return;
        }

        introTitle.textContent = step.speaker;

        if (step.showChoices) {
            typeText(step.text, function () {
                showChoiceButtons();
            });
            return;
        }

        typeText(step.text, function () {
            introStep++;
            setTimeout(runIntroStep, 450);
        });
    }

    function initIntro() {
        if (!introOverlay) return;
        if (sessionStorage.getItem(STORAGE_INTRO)) {
            introOverlay.setAttribute('hidden', '');
            return;
        }
        document.body.style.overflow = 'hidden';
        introStep = 0;
        runIntroStep();
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', function () {
            closeIntro();
        });
    }

    if (replayIntro) {
        replayIntro.addEventListener('click', function () {
            sessionStorage.removeItem(STORAGE_INTRO);
            menuOverlay.setAttribute('hidden', '');
            if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
            openIntro();
        });
    }

    function setupMenu() {
        if (!menuToggle || !menuOverlay) return;

        menuToggle.addEventListener('click', function () {
            const open = menuOverlay.hasAttribute('hidden');
            if (open) {
                menuOverlay.removeAttribute('hidden');
                menuToggle.setAttribute('aria-expanded', 'true');
            } else {
                menuOverlay.setAttribute('hidden', '');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });

        menuOverlay.querySelectorAll('[data-target]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const id = btn.getAttribute('data-target');
                menuOverlay.setAttribute('hidden', '');
                menuToggle.setAttribute('aria-expanded', 'false');
                scrollToId(id);
            });
        });

        menuOverlay.addEventListener('click', function (e) {
            if (e.target === menuOverlay) {
                menuOverlay.setAttribute('hidden', '');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menuOverlay && !menuOverlay.hasAttribute('hidden')) {
                menuOverlay.setAttribute('hidden', '');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function parallaxScenes() {
        const scenes = document.querySelectorAll('[data-parallax]');
        if (!scenes.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        function onScroll() {
            const vh = window.innerHeight;
            scenes.forEach(function (el) {
                const r = el.getBoundingClientRect();
                const mid = r.top + r.height / 2;
                const center = vh / 2;
                const delta = (mid - center) / vh;
                const strength = parseFloat(el.getAttribute('data-parallax')) || 0.1;
                const y = delta * strength * -40;
                el.style.transform = 'translateY(' + y.toFixed(2) + 'px)';
            });
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    function fadeScenes() {
        const scenes = document.querySelectorAll('.scene');
        if (!scenes.length) return;

        function check() {
            const vh = window.innerHeight;
            scenes.forEach(function (section) {
                const { top, bottom } = section.getBoundingClientRect();
                if (top < vh * 0.88 && bottom > vh * 0.12) {
                    section.classList.add('is-visible');
                }
            });
        }

        window.addEventListener('scroll', check, { passive: true });
        window.addEventListener('resize', check, { passive: true });
        check();
    }

    function loadProjects() {
        const container = document.getElementById('projects-container');
        if (!container) return;

        projects.forEach(function (project, index) {
            const projectPath = basePath + project + '/';

            Promise.all([
                fetch(projectPath + 'title.txt').then(function (r) {
                    return r.text();
                }),
                fetch(projectPath + 'description.txt').then(function (r) {
                    return r.text();
                }),
                fetch(projectPath + 'image.png').then(function (r) {
                    return r.blob();
                }),
            ])
                .then(function (results) {
                    const title = results[0];
                    const description = results[1];
                    const imageUrl = URL.createObjectURL(results[2]);
                    const num = String(index + 1).padStart(2, '0');

                    const article = document.createElement('article');
                    article.className = 'project-book';

                    article.innerHTML =
                        '<a class="project-book__visual" href="gameoverview.html?project=' +
                        encodeURIComponent(project) +
                        '">' +
                        '<img src="' +
                        imageUrl +
                        '" alt="' +
                        title.trim().replace(/"/g, '&quot;') +
                        '">' +
                        '</a>' +
                        '<div class="project-book__meta">' +
                        '<span class="project-book__index" aria-hidden="true">' +
                        num +
                        '</span>' +
                        '<h3 class="project-book__title">' +
                        title.trim() +
                        '</h3>' +
                        '<p class="project-book__excerpt">' +
                        description.trim() +
                        '</p>' +
                        '<a class="project-book__link" href="gameoverview.html?project=' +
                        encodeURIComponent(project) +
                        '">Open overview</a>' +
                        '</div>';

                    container.appendChild(article);
                })
                .catch(function (err) {
                    console.error('Error loading project:', project, err);
                });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initIntro();
        setupMenu();
        parallaxScenes();
        fadeScenes();
        loadProjects();
    });
})();
