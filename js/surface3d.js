/* ==========================================================================
   3D Surface Plotter — Three.js z = f(x, y) Rendering
   ========================================================================== */

const Surface3DModule = (() => {
  'use strict';

  let scene, camera, renderer, surfaceMesh, wireframe, axesGroup;
  let container = null;
  let isRendered = false;
  let animId = null;

  // Mouse orbit state
  let isDragging = false;
  let prevMouse = { x: 0, y: 0 };
  let rotation = { x: -0.6, y: 0.5 };
  let zoom = 5;

  const GRID_SIZE = 80; // resolution
  const RANGE = 5;      // x and y range: -RANGE to +RANGE

  const PRESETS = {
    'sin·cos':      'sin(x) * cos(y)',
    'ripple':       'sin(sqrt(x^2 + y^2)) * 3',
    'saddle':       'x^2 - y^2',
    'waves':        'sin(x) + sin(y)',
    'peaks':        '3*(1-x)^2 * exp(-(x^2) - (y+1)^2) - 10*(x/5 - x^3 - y^5) * exp(-x^2-y^2) - 1/3*exp(-(x+1)^2 - y^2)',
    'egg crate':    'sin(x) * sin(y)',
    'paraboloid':   'x^2 + y^2',
    'helix':        'sin(x*2 + y*2)',
  };

  /**
   * Initialize the 3D surface plotter.
   */
  function init() {
    container = document.getElementById('surface-canvas');
    if (!container) return;

    // Preset buttons
    document.querySelectorAll('.surface-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('surface-equation');
        if (input) {
          input.value = btn.dataset.eq;
          renderSurface();
        }
      });
    });

    // Render button
    const renderBtn = document.getElementById('surface-render-btn');
    if (renderBtn) {
      renderBtn.addEventListener('click', renderSurface);
    }

    // Enter key on input
    const input = document.getElementById('surface-equation');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') renderSurface();
      });
    }

    // Mouse controls for rotation
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Touch controls
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onMouseUp);

    // Render default surface
    const eqInput = document.getElementById('surface-equation');
    if (eqInput && !eqInput.value) {
      eqInput.value = 'sin(x) * cos(y)';
    }
  }

  /**
   * Initialize or reset the Three.js scene.
   */
  function setupScene() {
    if (renderer) {
      renderer.dispose();
      if (animId) cancelAnimationFrame(animId);
    }

    container.innerHTML = '';

    const w = container.clientWidth;
    const h = container.clientHeight;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    updateCameraPosition();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0c15, 1);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambient);

    const dir1 = new THREE.DirectionalLight(0xa855f7, 0.8);
    dir1.position.set(5, 10, 5);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0x22d3ee, 0.5);
    dir2.position.set(-5, 5, -5);
    scene.add(dir2);

    // Add axes
    addAxes();
  }

  /**
   * Add XYZ axis lines.
   */
  function addAxes() {
    if (axesGroup) scene.remove(axesGroup);
    axesGroup = new THREE.Group();

    const axisLen = RANGE + 0.5;
    const makeLine = (from, to, color) => {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...from),
        new THREE.Vector3(...to),
      ]);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 });
      return new THREE.Line(geom, mat);
    };

    axesGroup.add(makeLine([-axisLen, 0, 0], [axisLen, 0, 0], 0xf43f5e)); // X = red
    axesGroup.add(makeLine([0, -axisLen, 0], [0, axisLen, 0], 0x34d399)); // Y = green
    axesGroup.add(makeLine([0, 0, -axisLen], [0, 0, axisLen], 0x22d3ee)); // Z = blue

    scene.add(axesGroup);
  }

  /**
   * Render the surface from the equation input.
   */
  function renderSurface() {
    const input = document.getElementById('surface-equation');
    const errorEl = document.getElementById('surface-error');
    if (!input) return;

    const equation = input.value.trim();
    if (!equation) return;

    // Clear previous error
    if (errorEl) { errorEl.textContent = ''; errorEl.style.display = 'none'; }

    setupScene();

    try {
      const { geometry, minZ, maxZ } = buildSurfaceGeometry(equation);

      // Material with vertex colors
      const material = new THREE.MeshPhongMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        shininess: 30,
        transparent: true,
        opacity: 0.9,
      });

      if (surfaceMesh) scene.remove(surfaceMesh);
      if (wireframe) scene.remove(wireframe);

      surfaceMesh = new THREE.Mesh(geometry, material);
      scene.add(surfaceMesh);

      // Add wireframe overlay
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.05,
      });
      wireframe = new THREE.Mesh(geometry.clone(), wireMat);
      scene.add(wireframe);

      isRendered = true;

      // Update info
      const info = container.querySelector('.surface-info') || document.getElementById('surface-info');
      if (info) {
        info.textContent = `z ∈ [${minZ.toFixed(2)}, ${maxZ.toFixed(2)}] | Drag to rotate, scroll to zoom`;
      }

      // Start render loop
      animateScene();

    } catch (err) {
      if (errorEl) {
        errorEl.textContent = `Error: ${err.message}`;
        errorEl.style.display = 'block';
      }
    }
  }

  /**
   * Build a surface geometry from the equation string.
   */
  function buildSurfaceGeometry(equation) {
    const step = (2 * RANGE) / GRID_SIZE;
    const vertices = [];
    const colors = [];
    const indices = [];

    // First pass: compute all Z values to find range
    const zValues = [];
    let minZ = Infinity, maxZ = -Infinity;

    for (let i = 0; i <= GRID_SIZE; i++) {
      for (let j = 0; j <= GRID_SIZE; j++) {
        const x = -RANGE + i * step;
        const y = -RANGE + j * step;

        let z;
        try {
          z = math.evaluate(equation, { x, y });
          if (typeof z !== 'number' || !isFinite(z)) z = 0;
          // Clamp extreme values
          z = Math.max(-10, Math.min(10, z));
        } catch {
          z = 0;
        }

        zValues.push(z);
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
    }

    if (minZ === maxZ) maxZ = minZ + 1;

    // Second pass: build geometry with colors
    const colorViolet = new THREE.Color(0xa855f7);
    const colorCyan = new THREE.Color(0x22d3ee);
    const colorPink = new THREE.Color(0xf43f5e);
    const colorGreen = new THREE.Color(0x34d399);

    for (let i = 0; i <= GRID_SIZE; i++) {
      for (let j = 0; j <= GRID_SIZE; j++) {
        const x = -RANGE + i * step;
        const y = -RANGE + j * step;
        const z = zValues[i * (GRID_SIZE + 1) + j];

        // Scale to fit nicely
        const scale = 3 / Math.max(Math.abs(maxZ), Math.abs(minZ), 1);
        vertices.push(x * 0.5, z * scale * 0.5, y * 0.5);

        // Color based on height (normalized 0-1)
        const t = (z - minZ) / (maxZ - minZ);
        const color = new THREE.Color();
        if (t < 0.33) {
          color.lerpColors(colorCyan, colorGreen, t / 0.33);
        } else if (t < 0.66) {
          color.lerpColors(colorGreen, colorViolet, (t - 0.33) / 0.33);
        } else {
          color.lerpColors(colorViolet, colorPink, (t - 0.66) / 0.34);
        }
        colors.push(color.r, color.g, color.b);
      }
    }

    // Build triangle indices
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const a = i * (GRID_SIZE + 1) + j;
        const b = a + 1;
        const c = (i + 1) * (GRID_SIZE + 1) + j;
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return { geometry, minZ, maxZ };
  }

  /**
   * Render loop.
   */
  function animateScene() {
    animId = requestAnimationFrame(animateScene);
    renderer.render(scene, camera);
  }

  /**
   * Update camera position from rotation & zoom.
   */
  function updateCameraPosition() {
    if (!camera) return;
    camera.position.x = zoom * Math.sin(rotation.y) * Math.cos(rotation.x);
    camera.position.y = zoom * Math.sin(rotation.x);
    camera.position.z = zoom * Math.cos(rotation.y) * Math.cos(rotation.x);
    camera.lookAt(0, 0, 0);
  }

  // ── Mouse Controls ──

  function onMouseDown(e) {
    isDragging = true;
    prevMouse = { x: e.clientX, y: e.clientY };
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - prevMouse.x;
    const dy = e.clientY - prevMouse.y;

    rotation.y += dx * 0.008;
    rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotation.x + dy * 0.008));

    prevMouse = { x: e.clientX, y: e.clientY };
    updateCameraPosition();
  }

  function onMouseUp() {
    isDragging = false;
  }

  function onWheel(e) {
    e.preventDefault();
    zoom = Math.max(2, Math.min(15, zoom + e.deltaY * 0.005));
    updateCameraPosition();
  }

  // ── Touch Controls ──

  let lastTouchDist = 0;

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      isDragging = true;
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      lastTouchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
    e.preventDefault();
  }

  function onTouchMove(e) {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - prevMouse.x;
      const dy = e.touches[0].clientY - prevMouse.y;
      rotation.y += dx * 0.008;
      rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotation.x + dy * 0.008));
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      updateCameraPosition();
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      zoom = Math.max(2, Math.min(15, zoom - (dist - lastTouchDist) * 0.02));
      lastTouchDist = dist;
      updateCameraPosition();
    }
    e.preventDefault();
  }

  /**
   * Handle resize.
   */
  function resize() {
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  return { init, renderSurface, resize };
})();
