/**
 * Fullscreen ambient 3D layer — floating wire meshes + soft particles.
 * Respects prefers-reduced-motion (no init).
 *
 * Config lives in js/site-config.js:
 *   window.AMBIENT_TEMPLATE = 0;          // built-in template (0–5)
 *   window.AMBIENT_GLTF     = null;       // 'ambient/mymodel.glb' or null
 */
(function () {
    if (typeof THREE === 'undefined') return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;

    /* ── Config ──────────────────────────────────────────────────────────── */
    const TEMPLATE_IDX = (typeof window.AMBIENT_TEMPLATE === 'number')
        ? Math.max(0, Math.min(5, Math.round(window.AMBIENT_TEMPLATE)))
        : 0;
    const GLTF_PATH = (typeof window.AMBIENT_GLTF === 'string' && window.AMBIENT_GLTF.trim())
        ? window.AMBIENT_GLTF.trim()
        : null;

    /* ── Templates ───────────────────────────────────────────────────────── */
    /* Each entry: three mesh descriptors { geo, pos:{x,y,z}, opacity } */
    const TEMPLATES = [
        { // 0 — default: icosahedron · torus-knot · octahedron
            a: { geo: new THREE.IcosahedronGeometry(3.4, 1),             pos: { x: -5.5, y:  1.8, z: -2 }, op: 0.20 },
            b: { geo: new THREE.TorusKnotGeometry(2.15, 0.58, 80, 12),  pos: { x:  6.5, y: -1.2, z: -4 }, op: 0.18 },
            c: { geo: new THREE.OctahedronGeometry(2.5, 0),              pos: { x:  0,   y: -3.2, z:  2 }, op: 0.15 },
        },
        { // 1 — polyhedra: dodecahedron · torus · tetrahedron
            a: { geo: new THREE.DodecahedronGeometry(3.0, 0),            pos: { x: -5.5, y:  1.8, z: -2 }, op: 0.20 },
            b: { geo: new THREE.TorusGeometry(2.2, 0.7, 8, 20),         pos: { x:  6.5, y: -1.2, z: -4 }, op: 0.18 },
            c: { geo: new THREE.TetrahedronGeometry(3.0, 0),             pos: { x:  0,   y: -3.2, z:  2 }, op: 0.15 },
        },
        { // 2 — organic: faceted sphere · compact knot · cone
            a: { geo: new THREE.SphereGeometry(3.0, 8, 6),               pos: { x: -5.5, y:  1.8, z: -2 }, op: 0.20 },
            b: { geo: new THREE.TorusKnotGeometry(1.8, 0.5, 60, 8),     pos: { x:  6.5, y: -1.2, z: -4 }, op: 0.18 },
            c: { geo: new THREE.ConeGeometry(2.2, 4.0, 6, 1),            pos: { x:  0,   y: -3.2, z:  2 }, op: 0.15 },
        },
        { // 3 — angular: box · subdivided octahedron · icosahedron
            a: { geo: new THREE.BoxGeometry(4, 4, 4, 2, 2, 2),           pos: { x: -5.5, y:  1.8, z: -2 }, op: 0.20 },
            b: { geo: new THREE.OctahedronGeometry(2.8, 1),              pos: { x:  6.5, y: -1.2, z: -4 }, op: 0.18 },
            c: { geo: new THREE.IcosahedronGeometry(2.2, 0),             pos: { x:  0,   y: -3.2, z:  2 }, op: 0.15 },
        },
        { // 4 — knots: three torus-knot variants
            a: { geo: new THREE.TorusKnotGeometry(2.5, 0.4, 100, 8, 2, 3),  pos: { x: -5.5, y:  1.8, z: -2 }, op: 0.20 },
            b: { geo: new THREE.TorusKnotGeometry(2.0, 0.55, 80, 10, 3, 5), pos: { x:  6.5, y: -1.2, z: -4 }, op: 0.18 },
            c: { geo: new THREE.TorusGeometry(2.0, 0.8, 6, 12),             pos: { x:  0,   y: -3.2, z:  2 }, op: 0.15 },
        },
        { // 5 — crystal: tetrahedron · smooth icosahedron · dodecahedron
            a: { geo: new THREE.TetrahedronGeometry(3.5, 0),             pos: { x: -5.5, y:  1.8, z: -2 }, op: 0.20 },
            b: { geo: new THREE.IcosahedronGeometry(2.6, 2),             pos: { x:  6.5, y: -1.2, z: -4 }, op: 0.18 },
            c: { geo: new THREE.DodecahedronGeometry(2.2, 0),            pos: { x:  0,   y: -3.2, z:  2 }, op: 0.15 },
        },
    ];

    /* ── Renderer / Scene / Camera ───────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
    });

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf5f0eb, 0.028);

    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
    const CAM_Z_HOME = 10.5;
    camera.position.set(0, 0, CAM_Z_HOME);
    const _look = new THREE.Vector3(0, 0, -2);

    const group = new THREE.Group();
    group.rotation.order = 'YXZ';
    scene.add(group);

    /* ── Wire material + template meshes ─────────────────────────────────── */
    const wireMat = new THREE.MeshBasicMaterial({
        color: 0xff6633,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
    });

    const tmpl = TEMPLATES[TEMPLATE_IDX];

    const meshA = new THREE.Mesh(tmpl.a.geo, wireMat);
    meshA.material.opacity = tmpl.a.op;
    const meshA0 = tmpl.a.pos;
    meshA.position.set(meshA0.x, meshA0.y, meshA0.z);

    const meshB = new THREE.Mesh(tmpl.b.geo, wireMat.clone());
    meshB.material.opacity = tmpl.b.op;
    const meshB0 = tmpl.b.pos;
    meshB.position.set(meshB0.x, meshB0.y, meshB0.z);

    const meshC = new THREE.Mesh(tmpl.c.geo, wireMat.clone());
    meshC.material.opacity = tmpl.c.op;
    const meshC0 = tmpl.c.pos;
    meshC.position.set(meshC0.x, meshC0.y, meshC0.z);

    group.add(meshA, meshB, meshC);

    /* ── GLTF loader (optional) ───────────────────────────────────────────
     * If window.AMBIENT_GLTF points to a valid .glb, it replaces the template
     * meshes. The group (and its room/scroll animation) still applies.
     * Falls back silently to the template on any error or missing file.
     * ────────────────────────────────────────────────────────────────────── */
    let gltfLoaded = false;

    if (GLTF_PATH && typeof THREE.GLTFLoader !== 'undefined') {
        const loader = new THREE.GLTFLoader();
        loader.load(
            GLTF_PATH,
            function (gltf) {
                group.remove(meshA, meshB, meshC);
                const model = gltf.scene;
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3()).length();
                if (size > 0) model.scale.setScalar(7.0 / size);
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);
                model.traverse(function (child) {
                    if (child.isMesh) {
                        child.material = new THREE.MeshBasicMaterial({
                            color: wireMat.color.getHex(),
                            wireframe: true,
                            transparent: true,
                            opacity: 0.2,
                        });
                    }
                });
                group.add(model);
                gltfLoaded = true;
            },
            undefined,
            function () { /* file missing or error — keep template meshes */ }
        );
    }

    /* ── Particles ───────────────────────────────────────────────────────── */
    const particleCount = 420;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 45;
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
    particles.rotation.order = 'YXZ';
    scene.add(particles);

    /* ── Theme ───────────────────────────────────────────────────────────── */
    function isDarkTheme() {
        return document.body && document.body.classList.contains('theme-dark');
    }

    function applyAmbientTheme() {
        const dark = isDarkTheme();
        scene.fog.color.setHex(dark ? 0x0d1117 : 0xf5f0eb);
        const accentHex = dark ? 0x5aabdf : 0xff6633;
        wireMat.color.setHex(accentHex);
        meshB.material.color.copy(wireMat.color);
        meshC.material.color.copy(wireMat.color);
        pMat.color.setHex(dark ? 0x8dccf5 : 0xff8866);
        if (gltfLoaded) {
            group.traverse(function (child) {
                if (child.isMesh && child.material && child.material.wireframe) {
                    child.material.color.setHex(accentHex);
                }
            });
        }
    }

    /* ── Resize ──────────────────────────────────────────────────────────── */
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

    /* ── Room poses ──────────────────────────────────────────────────────── */
    const PANEL_COUNT = 6;
    /* cz = distance along view axis (+ = pull back / "way behind", − = move in close). cy = height (+ up, − down).
       lax/lay/laz = look-at — big spread so framing isn't all "from below in front". */
    const ROOM_BASE = [
        { y: 0.0,   x: 0.0,   z: 0.0,   py: 0.0,   cz:  0.2,  cx:  0.0,  cy:  0.15, lax:  0.0,  lay:  0.0,  laz: -2.0 },
        { y: -1.12, x: 0.58,  z: 0.48,  py: -0.42, cz: -1.35, cx:  0.9,  cy: -1.95, lax:  0.35, lay:  1.45, laz: -2.2 },
        { y: 0.88,  x: -0.72, z: -0.68, py: 0.48,  cz:  2.45, cx: -0.35, cy:  1.85, lax: -0.25, lay: -1.15, laz: -3.1 },
        { y: 1.05,  x: 0.52,  z: -0.58, py: 0.52,  cz: -1.1,  cx: -2.15, cy:  0.65, lax:  1.1,  lay: -0.35, laz: -1.4 },
        { y: -0.95, x: -0.38, z: 0.82,  py: -0.68, cz:  2.85, cx:  0.2,  cy:  0.5,  lax:  0.0,  lay:  0.2,  laz: -4.2 },
        { y: -0.78, x: -0.62, z: 0.38,  py: -0.55, cz:  0.4,  cx:  2.05, cy: -1.55, lax: -0.95, lay:  0.9,  laz: -2.6 },
    ];

    function roomTargetForIndex(i) {
        return ROOM_BASE[Math.max(0, Math.min(PANEL_COUNT - 1, i))];
    }

    /* Multi-panel jumps (dock): blend only start→end, not every room along the rail */
    let ambientDirect = null;

    const _qa = new THREE.Quaternion();
    const _qb = new THREE.Quaternion();
    const _q  = new THREE.Quaternion();
    const _qRaw    = new THREE.Quaternion();
    const _qSmooth = new THREE.Quaternion();
    let smoothQuatReady = false;
    const _eA = new THREE.Euler(0, 0, 0, 'YXZ');
    const _eB = new THREE.Euler(0, 0, 0, 'YXZ');

    const SMOOTH_QUAT   = 0.085;
    const SMOOTH_SCALAR = 0.072;

    let smoothPy  = 0;
    let smoothCz  = 0;
    let smoothCx  = 0;
    let smoothCy  = 0;
    let smoothLax = 0;
    let smoothLay = 0;
    let smoothLaz = -2;
    let smoothScalarsReady = false;

    function lerpNum(p, q, t) { return p + (q - p) * t; }

    function blendRoomPair(a, b, f) {
        _eA.set(a.x, a.y, a.z, 'YXZ'); _qa.setFromEuler(_eA);
        _eB.set(b.x, b.y, b.z, 'YXZ'); _qb.setFromEuler(_eB);
        _q.copy(_qa).slerp(_qb, f);
        _eA.setFromQuaternion(_q, 'YXZ');
        return {
            y: _eA.y, x: _eA.x, z: _eA.z,
            py:  lerpNum(a.py,  b.py,  f),
            cz:  lerpNum(a.cz,  b.cz,  f),
            cx:  lerpNum(a.cx,  b.cx,  f),
            cy:  lerpNum(a.cy,  b.cy,  f),
            lax: lerpNum(a.lax, b.lax, f),
            lay: lerpNum(a.lay, b.lay, f),
            laz: lerpNum(a.laz, b.laz, f),
        };
    }

    window.addEventListener('hub-ambient-skip', function (ev) {
        const d = ev.detail || {};
        if (d.clear) { ambientDirect = null; return; }
        if (typeof d.from === 'number' && typeof d.to === 'number') {
            ambientDirect = { from: d.from, to: d.to };
        }
    });

    function blendedRoomFromHubScroll() {
        const rail = document.getElementById('hub-rail');
        if (!rail || rail.clientWidth <= 0) return roomTargetForIndex(0);
        const w      = rail.clientWidth;
        const scroll = rail.scrollLeft;

        if (ambientDirect) {
            const from = ambientDirect.from;
            const to   = ambientDirect.to;
            const span = (to - from) * w;
            if (Math.abs(span) > 1e-4) {
                let t = (scroll - from * w) / span;
                t = Math.max(0, Math.min(1, t));
                const out = blendRoomPair(roomTargetForIndex(from), roomTargetForIndex(to), t);
                if (Math.abs(scroll - to * w) < 3) ambientDirect = null;
                return out;
            }
            ambientDirect = null;
        }

        const u  = Math.max(0, Math.min(PANEL_COUNT - 1, scroll / w));
        const i0 = Math.floor(u);
        const i1 = Math.min(PANEL_COUNT - 1, i0 + 1);
        return blendRoomPair(roomTargetForIndex(i0), roomTargetForIndex(i1), u - i0);
    }

    /* ── Mouse look ──────────────────────────────────────────────────────── */
    let mouseX   = 0;
    let mouseY   = 0;
    let lookRotY = 0;
    let lookRotX = 0;

    window.addEventListener('mousemove', function (e) {
        mouseX = (e.clientX / width)  * 2 - 1;
        mouseY = (e.clientY / height) * 2 - 1;
    }, { passive: true });

    /* ── Render loop ─────────────────────────────────────────────────────── */
    const clock = new THREE.Clock();

    function tick() {
        const t = clock.getElapsedTime();

        const raw = blendedRoomFromHubScroll();

        _eA.set(raw.x, raw.y, raw.z, 'YXZ');
        _qRaw.setFromEuler(_eA);
        if (!smoothQuatReady) {
            _qSmooth.copy(_qRaw);
            smoothQuatReady = true;
        } else {
            _qSmooth.slerp(_qRaw, SMOOTH_QUAT);
        }
        _eA.setFromQuaternion(_qSmooth, 'YXZ');

        if (!smoothScalarsReady) {
            smoothPy  = raw.py;  smoothCz  = raw.cz;
            smoothCx  = raw.cx;  smoothCy  = raw.cy;
            smoothLax = raw.lax; smoothLay = raw.lay; smoothLaz = raw.laz;
            smoothScalarsReady = true;
        } else {
            smoothPy  += SMOOTH_SCALAR * (raw.py  - smoothPy);
            smoothCz  += SMOOTH_SCALAR * (raw.cz  - smoothCz);
            smoothCx  += SMOOTH_SCALAR * (raw.cx  - smoothCx);
            smoothCy  += SMOOTH_SCALAR * (raw.cy  - smoothCy);
            smoothLax += SMOOTH_SCALAR * (raw.lax - smoothLax);
            smoothLay += SMOOTH_SCALAR * (raw.lay - smoothLay);
            smoothLaz += SMOOTH_SCALAR * (raw.laz - smoothLaz);
        }

        const tgt = {
            y: _eA.y, x: _eA.x, z: _eA.z,
            py: smoothPy, cz: smoothCz, cx: smoothCx, cy: smoothCy,
            lax: smoothLax, lay: smoothLay, laz: smoothLaz,
        };

        const lookYaw   = mouseX * 0.35 * 0.4 + Math.sin(t * 0.15) * 0.08;
        const lookPitch = mouseY * 0.2  * 0.25 + Math.cos(t * 0.12) * 0.05;
        lookRotY += 0.1   * (lookYaw   - lookRotY);
        lookRotX += 0.085 * (lookPitch - lookRotX);

        group.rotation.y = tgt.y + lookRotY;
        group.rotation.x = tgt.x + lookRotX;
        group.rotation.z = tgt.z;

        if (!gltfLoaded) {
            meshA.position.set(meshA0.x + tgt.y * 0.55 + tgt.z * 0.35, meshA0.y + tgt.x * 0.4,  meshA0.z);
            meshB.position.set(meshB0.x + tgt.x * 0.45, meshB0.y + tgt.z * 0.5,  meshB0.z + tgt.y * 0.35);
            meshC.position.set(meshC0.x + tgt.z * 0.65, meshC0.y + tgt.y * 0.38, meshC0.z - tgt.x * 0.25);

            meshA.rotation.x = t * 0.31 + tgt.x * 0.55 + tgt.z * 0.22;
            meshA.rotation.y = t * 0.22 - tgt.y * 0.35 + Math.sin(t * 0.09) * tgt.py;
            meshA.rotation.z = t * 0.07 + tgt.y * 0.28;
            meshB.rotation.x = t * 0.11 + tgt.z * 0.42;
            meshB.rotation.y = t * 0.08 - tgt.x * 0.38;
            meshB.rotation.z = t * 0.18 + tgt.y * 0.5;
            meshC.rotation.x = t * 0.14 + tgt.x * 0.33;
            meshC.rotation.y = -t * 0.25 + tgt.z * 0.44;
            meshC.rotation.z = t * 0.19 - tgt.y * 0.3;
        }

        particles.rotation.y = t * 0.02 + tgt.py + lookRotY * 0.35;
        particles.rotation.x = tgt.x * 0.25 + Math.sin(t * 0.11) * 0.06;
        particles.rotation.z = tgt.z * 0.55 + tgt.y * 0.2;

        camera.position.x = tgt.cx + mouseX * 0.95;
        camera.position.y = tgt.cy + -mouseY * 0.75;
        camera.position.z = CAM_Z_HOME + tgt.cz;

        _look.set(tgt.lax, tgt.lay, tgt.laz);
        camera.lookAt(_look);

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
})();
