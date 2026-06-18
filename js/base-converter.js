/* ==========================================================================
   Module C4 — Base Converter (Binary, Octal, Decimal, Hexadecimal)
   ========================================================================== */

const BaseConverterModule = (() => {
  'use strict';

  const MAX_SAFE = Number.MAX_SAFE_INTEGER; // 2^53 - 1

  const BASES = {
    binary:      { id: 'conv-binary',  base: 2,  regex: /^[01]*$/,         placeholder: 'e.g. 11111111' },
    octal:       { id: 'conv-octal',   base: 8,  regex: /^[0-7]*$/,        placeholder: 'e.g. 377' },
    decimal:     { id: 'conv-decimal', base: 10, regex: /^[0-9]*$/,        placeholder: 'e.g. 255' },
    hexadecimal: { id: 'conv-hex',     base: 16, regex: /^[0-9a-fA-F]*$/,  placeholder: 'e.g. FF' },
  };

  let inputs = {};
  let isUpdating = false;

  /**
   * Initialize the base converter module.
   */
  function init() {
    Object.entries(BASES).forEach(([name, config]) => {
      const el = document.getElementById(config.id);
      if (el) {
        inputs[name] = el;
        el.placeholder = config.placeholder;

        el.addEventListener('input', (e) => {
          if (isUpdating) return;
          handleInput(name, e.target.value);
        });

        // Prevent invalid characters
        el.addEventListener('keydown', (e) => {
          // Allow control keys
          if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key)) return;
          if (e.ctrlKey || e.metaKey) return;

          // Validate against base
          const testValue = el.value + e.key;
          if (!config.regex.test(e.key) && e.key.length === 1) {
            e.preventDefault();
            el.classList.add('invalid');
            setTimeout(() => el.classList.remove('invalid'), 300);
          }
        });
      }
    });
  }

  /**
   * Handle input change on any field.
   */
  function handleInput(sourceName, rawValue) {
    isUpdating = true;

    const value = rawValue.trim();
    const sourceConfig = BASES[sourceName];

    // Clear all if empty
    if (!value) {
      Object.keys(inputs).forEach(name => {
        if (name !== sourceName) inputs[name].value = '';
      });
      isUpdating = false;
      return;
    }

    // Validate input
    if (!sourceConfig.regex.test(value)) {
      inputs[sourceName].classList.add('invalid');
      setTimeout(() => inputs[sourceName].classList.remove('invalid'), 300);
      isUpdating = false;
      return;
    }

    inputs[sourceName].classList.remove('invalid');

    // Parse the decimal value
    const decimalValue = parseInt(value, sourceConfig.base);

    if (isNaN(decimalValue) || decimalValue > MAX_SAFE || decimalValue < 0) {
      // Out of range
      Object.keys(inputs).forEach(name => {
        if (name !== sourceName) {
          inputs[name].value = 'OVERFLOW';
        }
      });
      isUpdating = false;
      return;
    }

    // Update all other fields
    Object.entries(BASES).forEach(([name, config]) => {
      if (name !== sourceName && inputs[name]) {
        let converted = decimalValue.toString(config.base);
        if (name === 'hexadecimal') {
          converted = converted.toUpperCase();
        }
        inputs[name].value = converted;
      }
    });

    isUpdating = false;
  }

  return { init };
})();
