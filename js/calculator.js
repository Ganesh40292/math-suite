/* ==========================================================================
   Module B — Calculator Engine (Input, Display, History)
   ========================================================================== */

const CalculatorModule = (() => {
  'use strict';

  // State
  let expression = '';
  let displayResult = '0';
  let lastResult = null;
  let isResultDisplayed = false;
  let history = [];

  // DOM references (set in init)
  let elExpression = null;
  let elResult = null;
  let elMemory = null;
  let elAngle = null;

  /**
   * Initialize the calculator module.
   */
  function init() {
    elExpression = document.getElementById('display-expression');
    elResult = document.getElementById('display-result');
    elMemory = document.getElementById('memory-indicator');
    elAngle = document.getElementById('angle-indicator');

    // Bind buttons
    document.querySelectorAll('.calc-btn[data-value]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        MathUtils.createRipple(e, btn);
        handleInput(btn.dataset.value, btn.dataset.type);
      });
    });

    // Copy result button
    const copyBtn = document.getElementById('copy-result-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', copyResult);
    }

    // Keyboard input
    document.addEventListener('keydown', handleKeyboard);

    // Initialize display
    updateDisplay();
  }

  /**
   * Handle input from buttons.
   */
  function handleInput(value, type) {
    switch (type) {
      case 'number':
        appendNumber(value);
        break;
      case 'operator':
        appendOperator(value);
        break;
      case 'function':
        appendFunction(value);
        break;
      case 'constant':
        appendConstant(value);
        break;
      case 'paren':
        appendParen(value);
        break;
      case 'decimal':
        appendDecimal();
        break;
      case 'negate':
        negate();
        break;
      case 'percent':
        applyPercent();
        break;
      case 'equals':
        evaluate();
        break;
      case 'clear':
        clear();
        break;
      case 'backspace':
        backspace();
        break;
      case 'memory':
        ScientificModule.handleMemory(value);
        break;
      case 'toggle-angle':
        ScientificModule.toggleAngleMode();
        break;
      default:
        break;
    }
  }

  /**
   * Append a digit.
   */
  function appendNumber(num) {
    if (isResultDisplayed) {
      expression = '';
      isResultDisplayed = false;
    }
    expression += num;
    livePreview();
    updateDisplay();
  }

  /**
   * Append an operator (+, -, ×, ÷).
   */
  function appendOperator(op) {
    if (isResultDisplayed && lastResult !== null) {
      expression = MathUtils.formatResult(lastResult);
      isResultDisplayed = false;
    }

    // Prevent double operators
    const trimmed = expression.trimEnd();
    const lastChar = trimmed[trimmed.length - 1];
    if (['+', '-', '×', '÷', '*', '/'].includes(lastChar)) {
      expression = trimmed.slice(0, -1);
    }

    expression += ` ${op} `;
    updateDisplay();
  }

  /**
   * Append a mathematical function (sin, cos, log, etc.).
   */
  function appendFunction(fn) {
    if (isResultDisplayed) {
      // Wrap the last result in the function
      expression = `${fn}(${MathUtils.formatResult(lastResult)})`;
      isResultDisplayed = false;
    } else {
      expression += `${fn}(`;
    }
    livePreview();
    updateDisplay();
  }

  /**
   * Append a constant (π, e, φ).
   */
  function appendConstant(constant) {
    if (isResultDisplayed) {
      expression = '';
      isResultDisplayed = false;
    }
    expression += constant;
    livePreview();
    updateDisplay();
  }

  /**
   * Append a parenthesis.
   */
  function appendParen(paren) {
    if (isResultDisplayed && paren === '(') {
      expression = '';
      isResultDisplayed = false;
    }
    expression += paren;
    livePreview();
    updateDisplay();
  }

  /**
   * Append a decimal point.
   */
  function appendDecimal() {
    if (isResultDisplayed) {
      expression = '0';
      isResultDisplayed = false;
    }

    // Find the last number segment
    const parts = expression.split(/[\s+\-×÷*/()]/);
    const lastPart = parts[parts.length - 1] || '';

    if (!lastPart.includes('.')) {
      if (!lastPart || expression.endsWith(' ') || expression.endsWith('(')) {
        expression += '0';
      }
      expression += '.';
    }
    updateDisplay();
  }

  /**
   * Negate the current expression/value.
   */
  function negate() {
    if (isResultDisplayed && lastResult !== null) {
      expression = MathUtils.formatResult(-lastResult);
      lastResult = -lastResult;
      displayResult = expression;
      isResultDisplayed = true;
      updateDisplay();
      return;
    }

    if (expression.startsWith('-')) {
      expression = expression.substring(1);
    } else if (expression.startsWith('(-')) {
      expression = expression.substring(2);
    } else {
      expression = '(-' + expression;
    }
    livePreview();
    updateDisplay();
  }

  /**
   * Convert last number to percentage.
   */
  function applyPercent() {
    if (isResultDisplayed && lastResult !== null) {
      lastResult = MathUtils.fixPrecision(lastResult / 100);
      displayResult = MathUtils.formatResult(lastResult);
      expression = displayResult;
      updateDisplay();
      return;
    }
    expression += '/100';
    livePreview();
    updateDisplay();
  }

  /**
   * Evaluate the expression.
   */
  function evaluate() {
    if (!expression.trim()) return;

    try {
      // Build scope with angle mode
      const scope = {};
      let evalExpr = prepareExpression(expression);

      const result = MathUtils.safeEvaluate(evalExpr, scope);

      if (result === null || result === undefined) {
        displayResult = 'Error';
        showError();
        return;
      }

      lastResult = result;
      displayResult = MathUtils.formatResult(result);
      isResultDisplayed = true;

      // Add to history module (localStorage-backed)
      if (typeof HistoryModule !== 'undefined') {
        HistoryModule.add(expression, displayResult);
      }

      elResult.classList.remove('preview', 'error');
      elResult.classList.add('animate-in');
      setTimeout(() => elResult.classList.remove('animate-in'), 300);
      updateDisplay();

    } catch (err) {
      displayResult = err.message.includes('Unexpected')
        ? 'Syntax Error'
        : 'Math Error';
      showError();
    }
  }

  /**
   * Prepare expression for math.js evaluation.
   * Handles symbol replacement and angle mode wrapping.
   */
  function prepareExpression(expr) {
    let prepared = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, 'pi')
      .replace(/φ/g, '((1 + sqrt(5)) / 2)');

    // Handle angle mode for trig functions
    const isDeg = ScientificModule.isDegreeMode();
    if (isDeg) {
      // Wrap trig function arguments with degree-to-radian conversion
      prepared = prepared.replace(
        /\b(sin|cos|tan)\(/g,
        '$1(pi/180 * '
      );
      // Wrap inverse trig to return degrees
      prepared = prepared.replace(
        /\b(asin|acos|atan)\(/g,
        '(180/pi) * $1('
      );
    }

    return prepared;
  }

  /**
   * Live preview: evaluate as user types.
   */
  function livePreview() {
    try {
      let evalExpr = prepareExpression(expression);
      const result = MathUtils.safeEvaluate(evalExpr);

      if (result !== null && result !== undefined && typeof result === 'number' && isFinite(result)) {
        displayResult = MathUtils.formatResult(result);
        elResult.classList.add('preview');
        elResult.classList.remove('error');
      }
    } catch {
      // Silent fail for preview — expression may be incomplete
    }
  }

  /**
   * Show error animation.
   */
  function showError() {
    elResult.classList.add('error');
    elResult.classList.remove('preview');
    updateDisplay();
  }

  /**
   * Clear everything.
   */
  function clear() {
    expression = '';
    displayResult = '0';
    lastResult = null;
    isResultDisplayed = false;
    elResult.classList.remove('preview', 'error');
    updateDisplay();
  }

  /**
   * Backspace: remove last character.
   */
  function backspace() {
    if (isResultDisplayed) {
      clear();
      return;
    }

    // Remove trailing whitespace + operator
    expression = expression.trimEnd();
    if (expression.endsWith(' ')) {
      expression = expression.slice(0, -3); // Remove " op "
    } else {
      expression = expression.slice(0, -1);
    }

    if (!expression) {
      displayResult = '0';
      elResult.classList.remove('preview');
    } else {
      livePreview();
    }
    updateDisplay();
  }

  /**
   * Update the display DOM.
   */
  function updateDisplay() {
    if (!elExpression || !elResult) return;

    // Render LaTeX in expression line
    const latex = MathUtils.expressionToLatex(expression);
    if (latex) {
      try {
        katex.render(latex, elExpression, {
          throwOnError: false,
          displayMode: false,
          macros: { '\\f': '#1f(#2)' },
        });
      } catch {
        elExpression.textContent = expression;
      }
    } else {
      elExpression.innerHTML = '<span style="opacity: 0.3">0</span>';
    }

    // Update result
    elResult.textContent = displayResult;
  }

  /**
   * Handle keyboard input.
   */
  function handleKeyboard(e) {
    // Don't intercept if user is typing in an input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key;

    if (key >= '0' && key <= '9') {
      e.preventDefault();
      handleInput(key, 'number');
    } else if (key === '+') {
      e.preventDefault();
      handleInput('+', 'operator');
    } else if (key === '-') {
      e.preventDefault();
      handleInput('−', 'operator');
    } else if (key === '*') {
      e.preventDefault();
      handleInput('×', 'operator');
    } else if (key === '/') {
      e.preventDefault();
      handleInput('÷', 'operator');
    } else if (key === '.') {
      e.preventDefault();
      handleInput('.', 'decimal');
    } else if (key === '(' || key === ')') {
      e.preventDefault();
      handleInput(key, 'paren');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      handleInput('=', 'equals');
    } else if (key === 'Backspace') {
      e.preventDefault();
      handleInput('', 'backspace');
    } else if (key === 'Escape' || key === 'Delete') {
      e.preventDefault();
      handleInput('', 'clear');
    } else if (key === '%') {
      e.preventDefault();
      handleInput('%', 'percent');
    } else if (key === '^') {
      e.preventDefault();
      appendOperator('^');
      updateDisplay();
    }
  }

  /**
   * Get the current expression (for other modules).
   */
  function getExpression() { return expression; }
  function getLastResult() { return lastResult; }

  /**
   * Copy the current result to clipboard.
   */
  function copyResult() {
    if (displayResult && displayResult !== '0') {
      copyToClipboard(displayResult);
    }
  }

  return {
    init,
    handleInput,
    getExpression,
    getLastResult,
    clear,
    copyResult,
  };
})();
