/* ==========================================================================
   Module C1 — Scientific Calculator (Deg/Rad, Trig, Memory)
   ========================================================================== */

const ScientificModule = (() => {
  'use strict';

  // State
  let angleMode = 'DEG'; // 'DEG' or 'RAD'
  let memory = 0;
  let hasMemory = false;

  let elAngleIndicator = null;
  let elMemoryIndicator = null;

  /**
   * Initialize the scientific module.
   */
  function init() {
    elAngleIndicator = document.getElementById('angle-indicator');
    elMemoryIndicator = document.getElementById('memory-indicator');

    // Set initial display
    updateAngleDisplay();
    updateMemoryDisplay();

    // Angle toggle click handler
    if (elAngleIndicator) {
      elAngleIndicator.addEventListener('click', toggleAngleMode);
    }
  }

  /**
   * Toggle between DEG and RAD.
   */
  function toggleAngleMode() {
    angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG';
    updateAngleDisplay();
  }

  /**
   * Check if we're in degree mode.
   */
  function isDegreeMode() {
    return angleMode === 'DEG';
  }

  /**
   * Update the angle mode indicator.
   */
  function updateAngleDisplay() {
    if (elAngleIndicator) {
      elAngleIndicator.textContent = angleMode;
      elAngleIndicator.style.background = angleMode === 'DEG'
        ? 'var(--accent-primary-dim)'
        : 'var(--accent-secondary-dim)';
      elAngleIndicator.style.color = angleMode === 'DEG'
        ? 'var(--accent-primary)'
        : 'var(--accent-secondary)';
    }
  }

  /**
   * Handle memory operations.
   */
  function handleMemory(op) {
    const currentResult = CalculatorModule.getLastResult();

    switch (op) {
      case 'MC':
        memory = 0;
        hasMemory = false;
        break;
      case 'MR':
        if (hasMemory) {
          CalculatorModule.handleInput(String(memory), 'number');
        }
        break;
      case 'M+':
        if (currentResult !== null && typeof currentResult === 'number') {
          memory = MathUtils.fixPrecision(memory + currentResult);
          hasMemory = true;
        }
        break;
      case 'M-':
        if (currentResult !== null && typeof currentResult === 'number') {
          memory = MathUtils.fixPrecision(memory - currentResult);
          hasMemory = true;
        }
        break;
    }
    updateMemoryDisplay();
  }

  /**
   * Update memory indicator.
   */
  function updateMemoryDisplay() {
    if (elMemoryIndicator) {
      elMemoryIndicator.textContent = hasMemory ? `M: ${memory}` : '';
      elMemoryIndicator.classList.toggle('visible', hasMemory);
    }
  }

  return {
    init,
    toggleAngleMode,
    isDegreeMode,
    handleMemory,
  };
})();
