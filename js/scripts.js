(function () {
    const STORAGE_INTRO = 'pn_portfolio_intro_done_v1';

    const projects = window.PORTFOLIO_PROJECT_ORDER || [
        'Heisties',
        'PerfectClue',
        'Lou',
        'Plantaforma',
        'FryMe',
    ];
    const basePath = 'projects/';

    const PANEL_COUNT = 6;
    const PANEL_NAMES = ['Home', 'About', 'Projects', 'Showreel', '3D / VFX', 'Contact'];
    const INDEX_TO_HASH = ['#home', '#about', '#projects', '#reel', '#vfx', '#contact'];
    const HASH_TO_INDEX = {
        '': 0,
        '#home': 0,
        '#about': 1,
        '#projects': 2,
        '#reel': 3,
        '#vfx': 4,
        '#contact': 5,
    };

    const introSteps = [
        { speaker: 'Pedro', text: 'Welcome to my portfolio.' },
        { speaker: 'Pedro', text: "I'm Pedro Neves — I build games, tools, and visual experiments." },
        { speaker: 'Pedro', text: 'Choose a room — each one is its own space.', showChoices: true },
    ];

    const dialogueLine = document.getElementById('dialogue-line');
    const dialogueChoices = document.getElementById('dialogue-choices');
    const introOverlay = document.getElementById('intro-overlay');
    const introTitle = document.getElementById('intro-title');
    const skipBtn = document.getElementById('dialogue-skip');
    const replayIntro = document.getElementById('replay-intro');
    const hubRail = document.getElementById('hub-rail');
    const hubDock = document.getElementById('hub-dock');
    const hubPrev = document.getElementById('hub-prev');
    const hubNext = document.getElementById('hub-next');

    let introStep = 0;
    let typeTimer = null;
    let hubScrollEndTimer = null;
    let refreshProjectCatalogFocus = null;

    const WHEEL_CAROUSEL_THRESHOLD = 28;
    const WHEEL_CAROUSEL_IDLE_MS = 140;
    const verticalCarouselSteps = {};

    function carouselSmooth() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    }

    function scrollCarouselStep(catalog, slides, dir) {
        if (!slides || !slides.length) return;

        const cr = catalog.getBoundingClientRect();
        const mid = cr.top + cr.height / 2;
        let cur = 0;
        let bestD = Infinity;
        for (let i = 0; i < slides.length; i++) {
            const r = slides[i].getBoundingClientRect();
            const c = r.top + r.height / 2;
            const d = Math.abs(c - mid);
            if (d < bestD) {
                bestD = d;
                cur = i;
            }
        }

        const next = Math.max(0, Math.min(slides.length - 1, cur + dir));
        const slide = slides[next];
        const br = slide.getBoundingClientRect();
        const topEdge = br.top - cr.top + catalog.scrollTop;
        const target = topEdge + br.height / 2 - catalog.clientHeight / 2;
        const maxScroll = Math.max(0, catalog.scrollHeight - catalog.clientHeight);
        catalog.scrollTo({
            top: Math.max(0, Math.min(target, maxScroll)),
            behavior: carouselSmooth(),
        });
    }

    function attachVerticalCarousel(panel, hubIndex, catalog, container, slideSelector) {
        if (!panel || !catalog || !container || panel.dataset.verticalCarouselAttached) return;
        panel.dataset.verticalCarouselAttached = '1';

        function getSlides() {
            return container.querySelectorAll(slideSelector);
        }

        function scrollStep(dir) {
            scrollCarouselStep(catalog, getSlides(), dir);
        }

        verticalCarouselSteps[hubIndex] = scrollStep;

        let wheelAccum = 0;
        let wheelAccumTimer = null;

        function resetWheelAccum() {
            wheelAccum = 0;
            wheelAccumTimer = null;
        }

        panel.addEventListener(
            'wheel',
            function (e) {
                if (currentPanelFromScroll() !== hubIndex) return;
                if (e.target.closest('input, textarea, select, [contenteditable]')) return;
                if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.15) return;

                const slides = getSlides();
                if (!slides.length) return;

                wheelAccum += e.deltaY;
                if (wheelAccumTimer) clearTimeout(wheelAccumTimer);
                wheelAccumTimer = setTimeout(resetWheelAccum, WHEEL_CAROUSEL_IDLE_MS);

                if (Math.abs(wheelAccum) < WHEEL_CAROUSEL_THRESHOLD) {
                    e.preventDefault();
                    return;
                }

                const dir = wheelAccum > 0 ? 1 : -1;
                wheelAccum = 0;
                if (wheelAccumTimer) clearTimeout(wheelAccumTimer);
                wheelAccumTimer = null;
                e.preventDefault();
                scrollStep(dir);
            },
            { passive: false, capture: true }
        );
    }

    function initVerticalCarouselKeyboard() {
        window.addEventListener(
            'keydown',
            function (e) {
                if (e.target.closest('input, textarea, select, [contenteditable]')) return;
                if (introOverlay && !introOverlay.hasAttribute('hidden')) return;
                if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                const idx = currentPanelFromScroll();
                const step = verticalCarouselSteps[idx];
                if (!step) return;
                e.preventDefault();
                step(e.key === 'ArrowDown' ? 1 : -1);
            },
            true
        );
    }

    function initReelCarousel() {
        const panel = document.getElementById('panel-reel');
        const catalog = document.getElementById('reel-catalog');
        const slides = document.getElementById('reel-slides');
        if (!panel || !catalog || !slides) return;
        attachVerticalCarousel(panel, 3, catalog, slides, '.hub-carousel-slide');
    }

    function initVfxCarousel() {
        const panel = document.getElementById('panel-vfx');
        const catalog = document.getElementById('vfx-catalog');
        const slidesRoot = document.getElementById('vfx-slides');
        if (!panel || !catalog || !slidesRoot) return;
        if (!slidesRoot.querySelector('.hub-carousel-slide')) return;
        attachVerticalCarousel(panel, 4, catalog, slidesRoot, '.hub-carousel-slide');
    }

    function getHashIndex() {
        const h = (window.location.hash || '').toLowerCase();
        return HASH_TO_INDEX[h] !== undefined ? HASH_TO_INDEX[h] : 0;
    }

    function setHashForIndex(index) {
        const hash = INDEX_TO_HASH[index] || '#home';
        if (history.replaceState) {
            history.replaceState(null, '', hash);
        } else {
            window.location.hash = hash;
        }
    }

    function updateArrowHintsForIndex(i) {
        const prevHint = document.getElementById('hub-prev-hint');
        const nextHint = document.getElementById('hub-next-hint');
        const prevBtn = document.getElementById('hub-prev');
        const nextBtn = document.getElementById('hub-next');
        if (!prevHint || !nextHint || !prevBtn || !nextBtn) return;

        const prevName = i > 0 ? PANEL_NAMES[i - 1] : '';
        const nextName = i < PANEL_COUNT - 1 ? PANEL_NAMES[i + 1] : '';

        prevHint.textContent = prevName;
        nextHint.textContent = nextName;

        const atStart = i === 0;
        const atEnd = i === PANEL_COUNT - 1;

        prevBtn.disabled = atStart;
        nextBtn.disabled = atEnd;
        prevBtn.classList.toggle('is-disabled', atStart);
        nextBtn.classList.toggle('is-disabled', atEnd);

        prevBtn.setAttribute('aria-label', atStart ? 'No previous area' : 'Previous: ' + prevName);
        nextBtn.setAttribute('aria-label', atEnd ? 'No next area' : 'Next: ' + nextName);
    }

    function updateArrowHints() {
        updateArrowHintsForIndex(currentPanelFromScroll());
    }

    function goToPanel(index, smooth) {
        if (!hubRail || index < 0 || index >= PANEL_COUNT) return;
        const w = hubRail.clientWidth;
        if (w === 0) return;
        hubRail.scrollTo({
            left: index * w,
            behavior: smooth ? 'smooth' : 'auto',
        });
        updateDock(index);
        setHashForIndex(index);
        updateArrowHintsForIndex(index);
    }

    function currentPanelFromScroll() {
        if (!hubRail) return 0;
        const w = hubRail.clientWidth;
        if (w === 0) return 0;
        return Math.min(PANEL_COUNT - 1, Math.max(0, Math.round(hubRail.scrollLeft / w)));
    }

    function updateDock(activeIndex) {
        if (!hubDock) return;
        hubDock.querySelectorAll('.hub-dock__btn').forEach(function (btn, i) {
            const on = i === activeIndex;
            btn.classList.toggle('is-active', on);
            if (on) btn.setAttribute('aria-current', 'page');
            else btn.removeAttribute('aria-current');
        });
    }

    function initHubNavigation() {
        if (!hubRail) return;

        function onRailScroll() {
            clearTimeout(hubScrollEndTimer);
            hubScrollEndTimer = setTimeout(function () {
                const idx = currentPanelFromScroll();
                updateDock(idx);
                setHashForIndex(idx);
                updateArrowHintsForIndex(idx);
                if (idx === 2 && typeof refreshProjectCatalogFocus === 'function') {
                    refreshProjectCatalogFocus();
                }
            }, 100);
        }

        hubRail.addEventListener('scroll', onRailScroll, { passive: true });

        if (hubDock) {
            hubDock.querySelectorAll('[data-panel]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    const idx = parseInt(btn.getAttribute('data-panel'), 10);
                    goToPanel(idx, true);
                });
            });
        }

        if (hubPrev) {
            hubPrev.addEventListener('click', function () {
                const i = currentPanelFromScroll();
                if (i <= 0) return;
                goToPanel(i - 1, true);
            });
        }
        if (hubNext) {
            hubNext.addEventListener('click', function () {
                const i = currentPanelFromScroll();
                if (i >= PANEL_COUNT - 1) return;
                goToPanel(i + 1, true);
            });
        }

        updateArrowHintsForIndex(0);

        window.addEventListener('keydown', function (e) {
            if (e.target.closest('input, textarea, select, [contenteditable]')) return;
            if (introOverlay && !introOverlay.hasAttribute('hidden')) return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goToPanel(currentPanelFromScroll() - 1, true);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                goToPanel(currentPanelFromScroll() + 1, true);
            }
        });

        window.addEventListener('resize', function () {
            const idx = currentPanelFromScroll();
            goToPanel(idx, false);
        });

        window.addEventListener('hashchange', function () {
            const idx = getHashIndex();
            goToPanel(idx, true);
        });
    }

    function applyInitialPanelFromHash() {
        if (!hubRail) return;
        const idx = getHashIndex();
        requestAnimationFrame(function () {
            goToPanel(idx, false);
        });
    }

    function closeIntro(opts) {
        if (typeTimer) {
            clearTimeout(typeTimer);
            typeTimer = null;
        }
        introOverlay.setAttribute('hidden', '');
        document.body.classList.remove('intro-open');
        sessionStorage.setItem(STORAGE_INTRO, '1');
        if (!opts || !opts.skipApply) {
            applyInitialPanelFromHash();
        }
    }

    function openIntro() {
        introOverlay.removeAttribute('hidden');
        document.body.classList.add('intro-open');
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
            { label: 'Home', panel: 0 },
            { label: 'About', panel: 1 },
            { label: 'Projects', panel: 2 },
            { label: 'Showreel', panel: 3 },
            { label: '3D / VFX', panel: 4 },
            { label: 'Contact', panel: 5 },
        ];
        targets.forEach(function (t) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'choice-btn';
            btn.textContent = t.label;
            btn.addEventListener('click', function () {
                closeIntro({ skipApply: true });
                setTimeout(function () {
                    goToPanel(t.panel, true);
                }, 80);
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
            applyInitialPanelFromHash();
            return;
        }
        document.body.classList.add('intro-open');
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
            openIntro();
        });
    }

    function parallaxScenes() {
        const els = document.querySelectorAll('[data-parallax]');
        if (!els.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        function update() {
            els.forEach(function (el) {
                const panel = el.closest('.hub-panel');
                if (!panel) return;
                const pr = panel.getBoundingClientRect();
                if (pr.left >= window.innerWidth - 2 || pr.right <= 2) return;
                const r = el.getBoundingClientRect();
                const vh = window.innerHeight;
                const mid = r.top + r.height / 2;
                const center = vh / 2;
                const delta = (mid - center) / vh;
                const strength = parseFloat(el.getAttribute('data-parallax')) || 0.1;
                const y = delta * strength * -36;
                el.style.transform = 'translateY(' + y.toFixed(2) + 'px)';
            });
        }

        document.querySelectorAll('.hub-panel').forEach(function (p) {
            p.addEventListener('scroll', update, { passive: true });
        });
        if (hubRail) hubRail.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update, { passive: true });
        update();
    }

    function fadeScenes() {
        const roots = document.querySelectorAll('.hub-panel');
        if (!roots.length) return;

        roots.forEach(function (panel) {
            const targets = panel.querySelectorAll('.scene, .panel-header');
            const obs = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) entry.target.classList.add('is-visible');
                    });
                },
                { root: panel, threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
            );
            targets.forEach(function (el) {
                obs.observe(el);
            });
        });
    }

    function loadProjects() {
        const container = document.getElementById('projects-container');
        if (!container) return Promise.resolve();

        const slots = projects.map(function (project, index) {
            const article = document.createElement('article');
            article.className = 'project-book project-book--loading';
            container.appendChild(article);
            return { project: project, index: index, article: article };
        });

        const promises = slots.map(function (slot) {
            const projectPath = basePath + slot.project + '/';

            return Promise.all([
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
                    const num = String(slot.index + 1).padStart(2, '0');

                    slot.article.classList.remove('project-book--loading');
                    slot.article.innerHTML =
                        '<a class="project-book__visual" href="gameoverview.html?project=' +
                        encodeURIComponent(slot.project) +
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
                        encodeURIComponent(slot.project) +
                        '">Open overview</a>' +
                        '</div>';
                })
                .catch(function (err) {
                    console.error('Error loading project:', slot.project, err);
                    slot.article.remove();
                });
        });

        return Promise.allSettled(promises);
    }

    function initProjectCatalogFocus() {
        const catalog = document.getElementById('projects-catalog');
        const container = document.getElementById('projects-container');
        const panelProjects = document.getElementById('panel-projects');
        if (!catalog || !container || !panelProjects) return;

        attachVerticalCarousel(panelProjects, 2, catalog, container, '.project-book:not(.project-book--loading)');

        function updateFocus() {
            const books = container.querySelectorAll('.project-book:not(.project-book--loading)');
            if (!books.length) return;

            const cRect = catalog.getBoundingClientRect();
            const mid = cRect.top + cRect.height / 2;
            let best = null;
            let bestDist = Infinity;

            books.forEach(function (book) {
                const br = book.getBoundingClientRect();
                const bookMid = br.top + br.height / 2;
                const d = Math.abs(bookMid - mid);
                if (d < bestDist) {
                    bestDist = d;
                    best = book;
                }
            });

            books.forEach(function (book) {
                book.classList.toggle('is-focused', book === best);
            });
        }

        refreshProjectCatalogFocus = updateFocus;

        let ticking = false;
        function onScrollOrResize() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                ticking = false;
                updateFocus();
            });
        }

        catalog.addEventListener('scroll', onScrollOrResize, { passive: true });
        window.addEventListener('resize', onScrollOrResize, { passive: true });

        const mo = new MutationObserver(onScrollOrResize);
        mo.observe(container, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'],
        });

        updateFocus();
    }

    function loadVfxGallery() {
        const root = document.getElementById('vfx-slides');
        if (!root) return;

        fetch('vfx/gallery.json')
            .then(function (r) {
                return r.json();
            })
            .then(function (data) {
                const items = (data && data.items) || [];
                if (!items.length) {
                    root.innerHTML =
                        '<p class="vfx-empty">Nothing here yet — add entries to <code class="inline-code">vfx/gallery.json</code> and media under <code class="inline-code">vfx/</code>.</p>';
                    return;
                }

                root.innerHTML = '';

                items.forEach(function (item) {
                    if (!item || !item.src) return;

                    const fig = document.createElement('figure');
                    fig.className = 'vfx-gallery__item';

                    const src = 'vfx/' + String(item.src).replace(/^\//, '');
                    const isVid = /\.(mp4|webm|ogg)$/i.test(item.src);

                    let el;
                    if (isVid) {
                        el = document.createElement('video');
                        el.src = src;
                        el.controls = true;
                        el.muted = true;
                        el.loop = true;
                        el.playsInline = true;
                    } else {
                        el = document.createElement('img');
                        el.src = src;
                        el.alt = item.alt || '';
                        el.loading = 'lazy';
                    }

                    fig.appendChild(el);

                    if (item.caption) {
                        const cap = document.createElement('figcaption');
                        cap.textContent = item.caption;
                        fig.appendChild(cap);
                    }

                    const slide = document.createElement('article');
                    slide.className = 'hub-carousel-slide vfx-slide';
                    slide.appendChild(fig);
                    root.appendChild(slide);
                });

                initVfxCarousel();
            })
            .catch(function () {
                root.innerHTML =
                    '<p class="vfx-empty">Could not load <code class="inline-code">vfx/gallery.json</code>. Add the file to enable the gallery.</p>';
            });
    }

    const CONTACT_TO = 'pestacioneves.info@gmail.com';
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

    function setupContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;

        const siteKey = window.RECAPTCHA_SITE_KEY;
        const recapErr = document.getElementById('contact-recaptcha-error');
        const recapWrap = document.getElementById('contact-recaptcha-wrap');

        let recaptchaWidgetId = null;

        function hideRecapError() {
            if (recapErr) {
                recapErr.hidden = true;
                recapErr.textContent = '';
            }
        }

        function loadRecaptchaOnce() {
            if (!siteKey || recaptchaWidgetId !== null) return;
            if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
                try {
                    recaptchaWidgetId = grecaptcha.render('contact-recaptcha', {
                        sitekey: siteKey,
                    });
                } catch (err) {
                    console.error('reCAPTCHA render failed:', err);
                }
                return;
            }
            if (document.querySelector('script[data-recaptcha-loader]')) return;
            const script = document.createElement('script');
            script.src = 'https://www.google.com/recaptcha/api.js';
            script.async = true;
            script.defer = true;
            script.setAttribute('data-recaptcha-loader', '1');
            script.onload = function () {
                if (recaptchaWidgetId !== null) return;
                if (typeof grecaptcha === 'undefined' || !grecaptcha.render) return;
                try {
                    recaptchaWidgetId = grecaptcha.render('contact-recaptcha', {
                        sitekey: siteKey,
                    });
                } catch (err2) {
                    console.error('reCAPTCHA render failed:', err2);
                }
            };
            document.head.appendChild(script);
        }

        if (siteKey && document.getElementById('contact-recaptcha')) {
            loadRecaptchaOnce();
        } else if (recapWrap) {
            recapWrap.hidden = true;
        }

        ['contact-email', 'contact-subject', 'contact-message'].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', hideRecapError);
            }
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            hideRecapError();

            const email = document.getElementById('contact-email');
            const subject = document.getElementById('contact-subject');
            const message = document.getElementById('contact-message');
            if (!email || !subject || !message) return;

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            if (siteKey) {
                if (typeof grecaptcha === 'undefined') {
                    if (recapErr) {
                        recapErr.hidden = false;
                        recapErr.textContent =
                            'reCAPTCHA is still loading. Please wait a moment and try again.';
                    }
                    return;
                }
                const token =
                    recaptchaWidgetId !== null
                        ? grecaptcha.getResponse(recaptchaWidgetId)
                        : grecaptcha.getResponse();
                if (!token) {
                    if (recapErr) {
                        recapErr.hidden = false;
                        recapErr.textContent = 'Please complete the reCAPTCHA before sending.';
                    }
                    return;
                }
            }

            const subj = subject.value.trim();
            const body =
                'From: ' + email.value.trim() + '\n\n' + message.value.trim();
            const url =
                'mailto:' +
                CONTACT_TO +
                '?subject=' +
                encodeURIComponent(subj) +
                '&body=' +
                encodeURIComponent(body);
            if (recaptchaWidgetId !== null && typeof grecaptcha !== 'undefined') {
                grecaptcha.reset(recaptchaWidgetId);
            }
            window.location.href = url;
        });
    }

    function initHubRailPanelFade() {
        if (!hubRail) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const panels = hubRail.querySelectorAll('.hub-panel');
        if (!panels.length) return;

        const INACTIVE_OPACITY = 0.36;

        let rafId = null;
        function update() {
            const rect = hubRail.getBoundingClientRect();
            const mid = rect.left + rect.width / 2;
            let activeIdx = 0;
            let best = Infinity;
            panels.forEach(function (panel, i) {
                const pr = panel.getBoundingClientRect();
                const center = pr.left + pr.width / 2;
                const d = Math.abs(center - mid);
                if (d < best) {
                    best = d;
                    activeIdx = i;
                }
            });
            panels.forEach(function (panel, i) {
                panel.style.opacity = i === activeIdx ? '1' : String(INACTIVE_OPACITY);
                panel.classList.toggle('hub-panel--active', i === activeIdx);
            });
        }

        function onScrollOrResize() {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(function () {
                rafId = null;
                update();
            });
        }

        hubRail.addEventListener('scroll', onScrollOrResize, { passive: true });
        window.addEventListener('resize', onScrollOrResize, { passive: true });
        update();
    }

    document.addEventListener('DOMContentLoaded', function () {
        initHubNavigation();
        initHubRailPanelFade();
        initVerticalCarouselKeyboard();
        initLightsToggle();
        initIntro();
        setupContactForm();
        parallaxScenes();
        fadeScenes();
        loadProjects().then(function () {
            initProjectCatalogFocus();
        });
        initReelCarousel();
        loadVfxGallery();
    });
})();
