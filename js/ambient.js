/**
 * Fullscreen ambient 3D layer — floating wire meshes + soft particles.
 * Respects prefers-reduced-motion (no init).
 */
(function () {
    if (typeof THREE === 'undefined') return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
    });

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf5f0eb, 0.028);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
    /* Closer camera = larger silhouettes on screen */
    camera.position.set(0, 0, 10.5);

    const group = new THREE.Group();
    scene.add(group);

    const wireMat = new THREE.MeshBasicMaterial({
        color: 0xff6633,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
    });

    const geoA = new THREE.IcosahedronGeometry(3.4, 1);
    const geoB = new THREE.TorusKnotGeometry(2.15, 0.58, 80, 12);
    const meshA = new THREE.Mesh(geoA, wireMat);
    meshA.position.set(-5.5, 1.8, -2);
    const meshB = new THREE.Mesh(geoB, wireMat.clone());
    meshB.material.opacity = 0.18;
    meshB.position.set(6.5, -1.2, -4);
    const meshC = new THREE.Mesh(new THREE.OctahedronGeometry(2.5, 0), wireMat.clone());
    meshC.material.opacity = 0.15;
    meshC.position.set(0, -3.2, 2);
    group.add(meshA, meshB, meshC);

    const particleCount = 420;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 45;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 25 - 5;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
        color: 0xff8866,
        size: 0.085,
        transparent: true,
        opacity: 0.38,
        sizeAttenuation: true,
        depthWrite: false,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    function isDarkTheme() {
        return document.body && document.body.classList.contains('theme-dark');
    }

    function applyAmbientTheme() {
        const dark = isDarkTheme();
        scene.fog.color.setHex(dark ? 0x0d1814 : 0xf5f0eb);
        wireMat.color.setHex(dark ? 0x5ecf9a : 0xff6633);
        meshB.material.color.copy(wireMat.color);
        meshC.material.color.copy(wireMat.color);
        pMat.color.setHex(dark ? 0x8ef0c4 : 0xff8866);
    }

    let width = window.innerWidth;
    let height = window.innerHeight;
    const maxDpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        renderer.setPixelRatio(maxDpr);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('portfolio-themechange', applyAmbientTheme);
    applyAmbientTheme();

    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    window.addEventListener(
        'mousemove',
        function (e) {
            mouseX = (e.clientX / width) * 2 - 1;
            mouseY = (e.clientY / height) * 2 - 1;
        },
        { passive: true }
    );

    const clock = new THREE.Clock();

    function tick() {
        const t = clock.getElapsedTime();
        targetRotY = mouseX * 0.35;
        targetRotX = mouseY * 0.2;

        group.rotation.y += 0.12 * (targetRotY * 0.4 + Math.sin(t * 0.15) * 0.08 - group.rotation.y);
        group.rotation.x += 0.1 * (targetRotX * 0.25 + Math.cos(t * 0.12) * 0.05 - group.rotation.x);

        meshA.rotation.x = t * 0.31;
        meshA.rotation.y = t * 0.22;
        meshB.rotation.z = t * 0.18;
        meshC.rotation.y = -t * 0.25;

        particles.rotation.y = t * 0.02;

        camera.position.x += 0.04 * (mouseX * 1.2 - camera.position.x);
        camera.position.y += 0.04 * (-mouseY * 0.9 - camera.position.y);
        camera.lookAt(0, 0, -2);

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
})();
