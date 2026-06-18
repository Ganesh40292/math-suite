/* ==========================================================================
   Module C3 — Live 2D Graphing (function-plot)
   ========================================================================== */

const GraphingModule = (() => {
  'use strict';

  const GRAPH_COLORS = ['#a855f7', '#22d3ee', '#f43f5e', '#34d399']; // violet, cyan, pink, green
  const MAX_EQUATIONS = 4;

  let plotInstance = null;
  let graphContainer = null;
  let errorEl = null;

  /**
   * Initialize the graphing module.
   */
  function init() {
    graphContainer = document.getElementById('graph-plot');
    errorEl = document.getElementById('graph-error');

    // Bind equation input handlers
    for (let i = 1; i <= MAX_EQUATIONS; i++) {
      const input = document.getElementById(`graph-eq-${i}`);
      if (input) {
        input.addEventListener('input', MathUtils.debounce(() => renderGraph(), 350));
      }
    }

    // Initial render with empty graph
    renderGraph();

    // Export button
    const exportBtn = document.getElementById('graph-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportGraph);
    }
  }

  /**
   * Collect equations from inputs and render.
   */
  function renderGraph() {
    if (!graphContainer) return;

    const equations = [];

    for (let i = 1; i <= MAX_EQUATIONS; i++) {
      const input = document.getElementById(`graph-eq-${i}`);
      if (input && input.value.trim()) {
        let eq = input.value.trim();

        // Strip "y =" or "y=" prefix
        eq = eq.replace(/^y\s*=\s*/i, '');

        // Replace common math notation for function-plot compatibility
        eq = eq
          .replace(/π/g, 'PI')
          .replace(/\^/g, '^');

        equations.push({
          fn: eq,
          color: GRAPH_COLORS[(i - 1) % GRAPH_COLORS.length],
        });
      }
    }

    drawPlot(equations);
  }

  /**
   * Draw the plot using function-plot.
   */
  function drawPlot(equations) {
    hideError();

    // Clear container
    graphContainer.innerHTML = '';

    if (equations.length === 0) {
      // Draw empty grid
      try {
        plotInstance = functionPlot({
          target: graphContainer,
          width: graphContainer.clientWidth || 400,
          height: graphContainer.clientHeight || 300,
          grid: true,
          data: [],
          xAxis: { domain: [-10, 10] },
          yAxis: { domain: [-10, 10] },
        });
        styleGraph();
      } catch (e) {
        // Silently fail if container isn't ready
      }
      return;
    }

    try {
      const data = equations.map(eq => ({
        fn: eq.fn,
        color: eq.color,
        graphType: 'polyline',
        sampler: 'builtIn',
      }));

      plotInstance = functionPlot({
        target: graphContainer,
        width: graphContainer.clientWidth || 400,
        height: graphContainer.clientHeight || 300,
        grid: true,
        data: data,
        xAxis: { domain: [-10, 10] },
        yAxis: { domain: [-10, 10] },
      });

      styleGraph();

    } catch (err) {
      showError(err.message || 'Invalid equation');
    }
  }

  /**
   * Apply dark theme styles to the SVG graph.
   */
  function styleGraph() {
    if (!graphContainer) return;

    const svg = graphContainer.querySelector('svg');
    if (!svg) return;

    svg.style.background = 'transparent';

    // Style axis lines
    svg.querySelectorAll('.axis path, .axis line').forEach(el => {
      el.setAttribute('stroke', 'hsla(0, 0%, 100%, 0.12)');
    });

    // Style axis text
    svg.querySelectorAll('.axis text').forEach(el => {
      el.setAttribute('fill', 'hsla(230, 15%, 55%, 1)');
      el.style.fontFamily = "'JetBrains Mono', monospace";
      el.style.fontSize = '10px';
    });

    // Style grid lines
    svg.querySelectorAll('.grid line').forEach(el => {
      el.setAttribute('stroke', 'hsla(0, 0%, 100%, 0.05)');
    });
  }

  /**
   * Show error message.
   */
  function showError(msg) {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.add('visible');
    }
  }

  /**
   * Hide error message.
   */
  function hideError() {
    if (errorEl) {
      errorEl.classList.remove('visible');
    }
  }

  /**
   * Export the SVG graph as a PNG image.
   */
  function exportGraph() {
    if (!graphContainer) return;
    
    const svg = graphContainer.querySelector('svg');
    if (!svg) {
      showToast('No graph to export', 'error');
      return;
    }

    // Create a clone of the SVG to manipulate without affecting the UI
    const clone = svg.cloneNode(true);
    
    // Convert current CSS styles to inline styles for the clone
    // so they are preserved in the export
    const isLight = document.body.getAttribute('data-theme') === 'light';
    const axisColor = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.12)';
    const textColor = isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)';
    const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    const bgColor = isLight ? '#f2f4f8' : '#0e1017';

    // Set background rectangle explicitly instead of css transparent
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', bgColor);
    clone.insertBefore(rect, clone.firstChild);

    clone.querySelectorAll('.axis path, .axis line').forEach(el => el.setAttribute('stroke', axisColor));
    clone.querySelectorAll('.axis text').forEach(el => {
      el.setAttribute('fill', textColor);
      el.style.fontFamily = 'monospace';
    });
    clone.querySelectorAll('.grid line').forEach(el => el.setAttribute('stroke', gridColor));

    // Serialize SVG
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(clone);

    // Add name spaces.
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    // Add xml declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    // Convert to URI
    const url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
    
    // Create an image, draw to canvas, export to png
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = svg.clientWidth * 2; // High res
      canvas.height = svg.clientHeight * 2;
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement('a');
      a.download = `math-suite-graph-${new Date().getTime()}.png`;
      a.href = pngUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Graph exported!');
    };
    img.src = url;
  }

  return { init };
})();
