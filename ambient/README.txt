Drop your own 3D model here as a .glb file, then point to it in js/site-config.js:

    window.AMBIENT_GLTF = 'ambient/yourfile.glb';

The model will be auto-scaled, converted to wireframe, and animated with
the same scroll/mouse-look system as the built-in templates.

If no file is set (or the path returns a 404), the scene falls back to
the wireframe template selected by window.AMBIENT_TEMPLATE (0-5).
