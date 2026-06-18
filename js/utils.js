/* ==========================================================================
   Utilities — Precision, Sanitization, Helpers
   ========================================================================== */

const MathUtils = (() => {
  'use strict';

  const EPSILON = 1e-12;
  const PRECISION_DIGITS = 14;

  /**
   * Fix floating-point precision artifacts.
   * e.g., 0.1 + 0.2 → 0.30000000000000004 → 0.3
   */
  function fixPrecision(num) {
    if (typeof num !== 'number' || !isFinite(num)) return num;
    // Round to PRECISION_DIGITS significant digits
    const fixed = parseFloat(num.toPrecision(PRECISION_DIGITS));
    // Also check for near-zero artifacts
    if (Math.abs(fixed) < EPSILON) return 0;
    return fixed;
  }

  /**
   * Format a number for display using math.js formatting.
   * Handles very large/small numbers with exponential notation.
   */
  function formatResult(value) {
    if (value === undefined || value === null) return '';

    // Check if it's a math.js result type (matrix, etc.)
    if (typeof value === 'object' && value.type === 'ResultSet') {
      const entries = value.entries || [];
      return entries.length > 0 ? formatResult(entries[entries.length - 1]) : '';
    }

    if (typeof value === 'object' && typeof value.toArray === 'function') {
      // It's a matrix
      return matrixToString(value.toArray());
    }

    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'string') return value;

    if (typeof value === 'number') {
      if (!isFinite(value)) {
        if (value === Infinity) return '∞';
        if (value === -Infinity) return '-∞';
        return 'NaN';
      }

      const fixed = fixPrecision(value);

      // Use exponential for very large or very small numbers
      if (Math.abs(fixed) >= 1e15 || (Math.abs(fixed) < 1e-10 && fixed !== 0)) {
        return fixed.toExponential(6);
      }

      // Format with math.js for nice output
      try {
        return math.format(fixed, { precision: PRECISION_DIGITS });
      } catch {
        return fixed.toString();
      }
    }

    // Complex number support
    if (typeof value === 'object' && value.im !== undefined) {
      try {
        return math.format(value, { precision: PRECISION_DIGITS });
      } catch {
        return value.toString();
      }
    }

    return String(value);
  }

  /**
   * Convert a matrix array to a display string.
   */
  function matrixToString(arr) {
    if (!Array.isArray(arr)) return String(arr);
    if (!Array.isArray(arr[0])) {
      // 1D array (vector)
      return '[' + arr.map(v => fixPrecision(v)).join(', ') + ']';
    }
    // 2D array
    return arr.map(row =>
      '[' + row.map(v => fixPrecision(v)).join(', ') + ']'
    ).join('\n');
  }

  /**
   * Convert a math expression string to LaTeX-friendly format.
   * Uses math.js parse → toTex() for proper conversion.
   */
  function expressionToLatex(expr) {
    if (!expr || expr.trim() === '') return '';

    try {
      // Replace display-friendly symbols with math.js compatible ones
      let cleaned = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/π/g, 'pi')
        .replace(/√\(/g, 'sqrt(')
        .replace(/\^/g, '^');

      const node = math.parse(cleaned);
      return node.toTex({ parenthesis: 'auto' });
    } catch {
      // Fallback: basic string-level LaTeX conversion
      return expr
        .replace(/\*/g, '\\times ')
        .replace(/\//g, '\\div ')
        .replace(/sqrt\(/g, '\\sqrt{')
        .replace(/pi/g, '\\pi')
        .replace(/\^(\d)/g, '^{$1}')
        .replace(/\^{(\d+)}/g, '^{$1}');
    }
  }

  /**
   * Sanitize user expression input.
   * Strips anything that isn't a valid math token.
   */
  function sanitizeExpression(str) {
    if (typeof str !== 'string') return '';
    // Allow: digits, operators, parentheses, decimal points, common function names, whitespace
    return str.replace(/[^\d+\-*/().^%!,\s\w]/g, '');
  }

  /**
   * Debounce utility for input handlers.
   */
  function debounce(fn, delay = 300) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Create ripple effect on a button.
   */
  function createRipple(event, element) {
    const btn = element || event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;

    const rect = btn.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');

    // Remove existing ripple
    const existingRipple = btn.querySelector('.ripple');
    if (existingRipple) existingRipple.remove();

    btn.appendChild(circle);

    // Clean up after animation
    setTimeout(() => circle.remove(), 500);
  }

  /**
   * Safe evaluation using math.js (never eval).
   */
  function safeEvaluate(expression, scope = {}) {
    if (!expression || expression.trim() === '') return null;

    try {
      // Normalize symbols
      let normalized = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/π/g, 'pi');

      const result = math.evaluate(normalized, scope);
      if (typeof result === 'number') {
        return fixPrecision(result);
      }
      return result;
    } catch (err) {
      throw err;
    }
  }

  return {
    EPSILON,
    PRECISION_DIGITS,
    fixPrecision,
    formatResult,
    matrixToString,
    expressionToLatex,
    sanitizeExpression,
    debounce,
    createRipple,
    safeEvaluate,
  };
})();
