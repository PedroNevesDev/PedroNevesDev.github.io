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
    scene.fog = new THREE.FogExp2(0x080808, 0.035);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
    camera.position.set(0, 0, 14);

    const group = new THREE.Group();
    scene.add(group);

    const wireMat = new THREE.MeshBasicMaterial({
        color: 0x7a9e4a,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
    });

    const geoA = new THREE.IcosahedronGeometry(2.2, 1);
    const geoB = new THREE.TorusKnotGeometry(1.4, 0.38, 80, 12);
    const meshA = new THREE.Mesh(geoA, wireMat);
    meshA.position.set(-5, 1.5, -2);
    const meshB = new THREE.Mesh(geoB, wireMat.clone());
    meshB.material.opacity = 0.18;
    meshB.position.set(6, -1, -4);
    const meshC = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 0), wireMat.clone());
    meshC.material.opacity = 0.15;
    meshC.position.set(0, -3, 2);
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
        color: 0xa8c97a,
        size: 0.06,
        transparent: true,
        opacity: 0.45,
        sizeAttenuation: true,
        depthWrite: false,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

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
