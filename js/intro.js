/* ==========================================================================
   Module A — 3D Cinematic Intro (Three.js Particle Vortex)
   ========================================================================== */

const IntroModule = (() => {
  'use strict';

  let scene, camera, renderer, clock;
  let animationId = null;
  let introObjects = null;
  let bgScene, bgCamera, bgRenderer, bgObjects = null;
  let isDissolving = false;
  const INTRO_DURATION = 2500; // ms before dissolve
  const COLORS = {
    violet: new THREE.Color('hsl(265, 90%, 65%)'),
    cyan: new THREE.Color('hsl(195, 95%, 55%)'),
    pink: new THREE.Color('hsl(340, 85%, 60%)'),
  };

  /**
   * Initialize the intro scene.
   */
  function init() {
    const canvas = document.getElementById('intro-canvas');
    const overlay = document.getElementById('intro-overlay');
    if (!canvas || !overlay) return;

    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0d0f1a, 1);

    clock = new THREE.Clock();

    // Create intro geometry
    introObjects = createMathIntroObject();
    scene.add(introObjects.group);

    // Start animation
    animate();

    // Handle resize
    window.addEventListener('resize', onResize);

    // Schedule dissolve
    setTimeout(() => dissolve(), INTRO_DURATION);
  }

  /**
   * Create a dynamic mathematical wireframe structure.
   */
  function createMathIntroObject() {
    const group = new THREE.Group();

    // Outer Torus Knot
    const tkGeo = new THREE.TorusKnotGeometry(2.2, 0.6, 128, 16);
    const tkEdges = new THREE.WireframeGeometry(tkGeo);
    const tkMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.25 });
    const tkLine = new THREE.LineSegments(tkEdges, tkMat);
    group.add(tkLine);

    // Inner Icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const icoEdges = new THREE.WireframeGeometry(icoGeo);
    const icoMat = new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.6 });
    const icoLine = new THREE.LineSegments(icoEdges, icoMat);
    group.add(icoLine);

    // Floating data points (cloud)
    const ptsGeo = new THREE.BufferGeometry();
    const ptsCount = 1000;
    const pos = new Float32Array(ptsCount * 3);
    for (let i = 0; i < ptsCount; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    ptsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const ptsMat = new THREE.PointsMaterial({ color: 0xf43f5e, size: 0.04, transparent: true, opacity: 0.8 });
    const pts = new THREE.Points(ptsGeo, ptsMat);
    group.add(pts);

    return { group, tkLine, icoLine, pts };
  }

  /**
   * Main animation loop.
   */
  function animate() {
    animationId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    if (introObjects && introObjects.group) {
      // Dynamic rotations
      introObjects.tkLine.rotation.x = elapsed * 0.2;
      introObjects.tkLine.rotation.y = elapsed * 0.3;
      
      introObjects.icoLine.rotation.x = elapsed * -0.4;
      introObjects.icoLine.rotation.y = elapsed * -0.2;

      introObjects.pts.rotation.y = elapsed * 0.1;
      introObjects.pts.rotation.x = elapsed * 0.05;
      
      // Add a slight pulsing scale to the group
      const scale = 1 + Math.sin(elapsed * 2) * 0.05;
      introObjects.group.scale.set(scale, scale, scale);
    }

    renderer.render(scene, camera);
  }

  /**
   * Dissolve the intro and reveal the calculator UI.
   */
  function dissolve() {
    if (isDissolving) return;
    isDissolving = true;

    const overlay = document.getElementById('intro-overlay');
    const appContainer = document.getElementById('app-container');

    // Start CSS dissolve
    overlay.classList.add('dissolving');

    // Reveal app
    setTimeout(() => {
      appContainer.classList.add('visible');
    }, 200);

    // After dissolve completes, set up background mode
    setTimeout(() => {
      overlay.classList.add('hidden');

      // Clean up intro renderer
      cancelAnimationFrame(animationId);
      renderer.dispose();
      
      // Dispose intro geometries and materials
      if (introObjects) {
        introObjects.tkLine.geometry.dispose();
        introObjects.tkLine.material.dispose();
        introObjects.icoLine.geometry.dispose();
        introObjects.icoLine.material.dispose();
        introObjects.pts.geometry.dispose();
        introObjects.pts.material.dispose();
      }

      // Start background particles
      initBackground();
    }, 900);
  }

  /**
   * Initialize subtle background particle layer.
   */
  function initBackground() {
    const bgCanvas = document.getElementById('bg-canvas');
    if (!bgCanvas) return;

    bgScene = new THREE.Scene();
    bgCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    bgCamera.position.z = 8;

    bgRenderer = new THREE.WebGLRenderer({
      canvas: bgCanvas,
      antialias: false,
      alpha: true,
    });
    bgRenderer.setSize(window.innerWidth, window.innerHeight);
    bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    bgRenderer.setClearColor(0x000000, 0);

    bgObjects = createMathIntroObject();
    
    // Dim the background objects
    bgObjects.tkLine.material.opacity = 0.05;
    bgObjects.icoLine.material.opacity = 0.1;
    bgObjects.pts.material.opacity = 0.2;
    
    // Scale up slightly and offset for a nice atmospheric effect
    bgObjects.group.scale.set(1.5, 1.5, 1.5);
    bgObjects.group.position.set(-2, -1, -2);

    bgScene.add(bgObjects.group);

    bgCanvas.classList.add('visible');

    const bgClock = new THREE.Clock();

    function animateBg() {
      requestAnimationFrame(animateBg);
      const t = bgClock.getElapsedTime();

      if (bgObjects && bgObjects.group) {
        bgObjects.tkLine.rotation.x = t * 0.05;
        bgObjects.tkLine.rotation.y = t * 0.08;
        bgObjects.icoLine.rotation.x = t * -0.06;
        bgObjects.icoLine.rotation.y = t * -0.04;
        bgObjects.pts.rotation.y = t * 0.02;
        bgObjects.pts.rotation.x = t * 0.01;
      }

      bgRenderer.render(bgScene, bgCamera);
    }

    animateBg();
  }

  /**
   * Handle window resize.
   */
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (camera && renderer) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    if (bgCamera && bgRenderer) {
      bgCamera.aspect = w / h;
      bgCamera.updateProjectionMatrix();
      bgRenderer.setSize(w, h);
    }
  }

  /**
   * Skip intro immediately (for reduced-motion preference).
   */
  function skip() {
    const overlay = document.getElementById('intro-overlay');
    const appContainer = document.getElementById('app-container');

    if (overlay) overlay.classList.add('hidden');
    if (appContainer) appContainer.classList.add('visible');

    if (animationId) cancelAnimationFrame(animationId);
    if (renderer) renderer.dispose();

    initBackground();
  }

  return { init, skip };
})();
