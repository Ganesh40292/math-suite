/* ==========================================================================
   App Orchestrator — Module Initialization & Tab Switching
   ========================================================================== */

const App = (() => {
  'use strict';

  /**
   * Initialize everything once DOM is ready.
   */
  function init() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Skip intro entirely
      IntroModule.skip();
      initModules();
    } else {
      // Start 3D intro
      IntroModule.init();

      // Init modules after intro dissolves (2.5s + 200ms buffer)
      setTimeout(() => initModules(), 2700);
    }

    // Setup tab switching
    setupTabs();

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const isLight = document.body.getAttribute('data-theme') === 'light';
        document.body.setAttribute('data-theme', isLight ? 'dark' : 'light');
        themeBtn.innerHTML = isLight ? '☀️' : '🌙';
        
        // Re-render graphs for new theme
        if (typeof GraphingModule !== 'undefined') GraphingModule.init();
      });
    }

    // Shortcuts modal
    const helpBtn = document.getElementById('help-toggle');
    const shortcutsModal = document.getElementById('shortcuts-modal');
    const closeShortcuts = document.getElementById('shortcuts-close');
    
    if (helpBtn && shortcutsModal) {
      helpBtn.addEventListener('click', () => shortcutsModal.classList.add('visible'));
      closeShortcuts.addEventListener('click', () => shortcutsModal.classList.remove('visible'));
      shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) shortcutsModal.classList.remove('visible');
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
          shortcutsModal.classList.add('visible');
        } else if (e.key === 'Escape') {
          shortcutsModal.classList.remove('visible');
        }
      });
    }

    // Resize handler
    window.addEventListener('resize', () => {
      if (typeof Surface3DModule !== 'undefined') Surface3DModule.resize();
    });

    // Global error boundary
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.message);
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
    });
  }

  /**
   * Initialize all feature modules.
   */
  function initModules() {
    ScientificModule.init();
    CalculatorModule.init();
    MatrixModule.init();
    GraphingModule.init();
    BaseConverterModule.init();
    
    if (typeof HistoryModule !== 'undefined') HistoryModule.init();
    if (typeof Surface3DModule !== 'undefined') Surface3DModule.init();
  }

  /**
   * Setup tab navigation.
   */
  function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;

        // Update active states
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPanel = document.getElementById(`panel-${targetTab}`);
        if (targetPanel) targetPanel.classList.add('active');

        // Re-render graphs when switching tabs
        if (targetTab === 'graph') {
          setTimeout(() => GraphingModule.init(), 100);
        } else if (targetTab === 'surface') {
          setTimeout(() => {
            if (typeof Surface3DModule !== 'undefined') {
              Surface3DModule.resize();
              Surface3DModule.renderSurface();
            }
          }, 100);
        }
      });
    });
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init };
})();
