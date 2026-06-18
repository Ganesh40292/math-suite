/* ==========================================================================
   Module C2 — Matrix Operations Panel
   ========================================================================== */

const MatrixModule = (() => {
  'use strict';

  let matrixSize = 2;

  /**
   * Initialize the matrix module.
   */
  function init() {
    // Size selector buttons
    document.querySelectorAll('.matrix-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        matrixSize = parseInt(btn.dataset.size);
        document.querySelectorAll('.matrix-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        buildGrids();
      });
    });

    // Operation buttons
    document.querySelectorAll('.matrix-op-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        performOperation(btn.dataset.op);
      });
    });

    // Build initial grids
    buildGrids();
  }

  /**
   * Build input grids for Matrix A and B.
   */
  function buildGrids() {
    const gridA = document.getElementById('matrix-grid-a');
    const gridB = document.getElementById('matrix-grid-b');

    if (!gridA || !gridB) return;

    [gridA, gridB].forEach(grid => {
      grid.innerHTML = '';
      grid.className = `matrix-grid size-${matrixSize}`;

      for (let i = 0; i < matrixSize; i++) {
        for (let j = 0; j < matrixSize; j++) {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'matrix-input';
          input.placeholder = '0';
          input.dataset.row = i;
          input.dataset.col = j;
          input.setAttribute('aria-label', `Row ${i + 1}, Column ${j + 1}`);
          grid.appendChild(input);
        }
      }
    });

    clearResult();
  }

  /**
   * Read matrix values from a grid.
   */
  function readMatrix(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return null;

    const inputs = grid.querySelectorAll('.matrix-input');
    const matrix = [];

    for (let i = 0; i < matrixSize; i++) {
      const row = [];
      for (let j = 0; j < matrixSize; j++) {
        const idx = i * matrixSize + j;
        const val = parseFloat(inputs[idx].value) || 0;
        row.push(val);
      }
      matrix.push(row);
    }

    return math.matrix(matrix);
  }

  /**
   * Perform a matrix operation.
   */
  function performOperation(op) {
    const resultContainer = document.getElementById('matrix-result-content');
    if (!resultContainer) return;

    try {
      const A = readMatrix('matrix-grid-a');
      let result;
      let resultLabel = '';

      switch (op) {
        case 'det': {
          const detVal = math.det(A);
          resultLabel = 'Determinant of A';
          showScalarResult(resultLabel, MathUtils.fixPrecision(detVal));
          return;
        }

        case 'inv': {
          const detVal = math.det(A);
          if (Math.abs(detVal) < MathUtils.EPSILON) {
            showErrorResult('Matrix A is singular (det = 0). Cannot compute inverse.');
            return;
          }
          result = math.inv(A);
          resultLabel = 'Inverse of A';
          break;
        }

        case 'transpose': {
          result = math.transpose(A);
          resultLabel = 'Transpose of A';
          break;
        }

        case 'multiply': {
          const B = readMatrix('matrix-grid-b');
          result = math.multiply(A, B);
          resultLabel = 'A × B';
          break;
        }

        case 'add': {
          const B = readMatrix('matrix-grid-b');
          result = math.add(A, B);
          resultLabel = 'A + B';
          break;
        }

        case 'subtract': {
          const B = readMatrix('matrix-grid-b');
          result = math.subtract(A, B);
          resultLabel = 'A − B';
          break;
        }

        case 'cross': {
          // Cross product only for 3D vectors (read first row of A and B)
          if (matrixSize !== 3) {
            showErrorResult('Cross product requires 3×3 matrices (uses first row as 3D vector).');
            return;
          }
          const gridA = document.getElementById('matrix-grid-a');
          const gridB = document.getElementById('matrix-grid-b');
          const inputsA = gridA.querySelectorAll('.matrix-input');
          const inputsB = gridB.querySelectorAll('.matrix-input');

          const vecA = [
            parseFloat(inputsA[0].value) || 0,
            parseFloat(inputsA[1].value) || 0,
            parseFloat(inputsA[2].value) || 0,
          ];
          const vecB = [
            parseFloat(inputsB[0].value) || 0,
            parseFloat(inputsB[1].value) || 0,
            parseFloat(inputsB[2].value) || 0,
          ];

          const crossResult = math.cross(vecA, vecB);
          resultLabel = 'A₁ × B₁ (Cross Product)';
          showVectorResult(resultLabel, crossResult);
          return;
        }

        default:
          return;
      }

      // Display matrix result
      showMatrixResult(resultLabel, result.toArray());

    } catch (err) {
      showErrorResult(err.message || 'Computation error');
    }
  }

  /**
   * Display a matrix result.
   */
  function showMatrixResult(label, arr) {
    const container = document.getElementById('matrix-result-content');
    container.innerHTML = '';

    const labelEl = document.createElement('div');
    labelEl.className = 'matrix-result-label';
    labelEl.textContent = label;
    container.appendChild(labelEl);

    const grid = document.createElement('div');
    grid.className = `matrix-result-grid`;
    grid.style.gridTemplateColumns = `repeat(${arr[0].length}, 1fr)`;

    arr.forEach(row => {
      row.forEach(val => {
        const cell = document.createElement('div');
        cell.className = 'matrix-result-cell';
        cell.textContent = MathUtils.fixPrecision(val);
        grid.appendChild(cell);
      });
    });

    container.appendChild(grid);
  }

  /**
   * Display a scalar result (e.g., determinant).
   */
  function showScalarResult(label, value) {
    const container = document.getElementById('matrix-result-content');
    container.innerHTML = '';

    const labelEl = document.createElement('div');
    labelEl.className = 'matrix-result-label';
    labelEl.textContent = label;
    container.appendChild(labelEl);

    const valEl = document.createElement('div');
    valEl.className = 'matrix-result-scalar';
    valEl.textContent = value;
    container.appendChild(valEl);
  }

  /**
   * Display a vector result (cross product).
   */
  function showVectorResult(label, vec) {
    const container = document.getElementById('matrix-result-content');
    container.innerHTML = '';

    const labelEl = document.createElement('div');
    labelEl.className = 'matrix-result-label';
    labelEl.textContent = label;
    container.appendChild(labelEl);

    const grid = document.createElement('div');
    grid.className = 'matrix-result-grid';
    grid.style.gridTemplateColumns = `repeat(${vec.length}, 1fr)`;

    vec.forEach(val => {
      const cell = document.createElement('div');
      cell.className = 'matrix-result-cell';
      cell.textContent = MathUtils.fixPrecision(val);
      grid.appendChild(cell);
    });

    container.appendChild(grid);
  }

  /**
   * Display an error result.
   */
  function showErrorResult(msg) {
    const container = document.getElementById('matrix-result-content');
    container.innerHTML = '';

    const errEl = document.createElement('div');
    errEl.className = 'matrix-error';
    errEl.textContent = msg;
    container.appendChild(errEl);
  }

  /**
   * Clear the result area.
   */
  function clearResult() {
    const container = document.getElementById('matrix-result-content');
    if (container) {
      container.innerHTML = '<div class="matrix-result-label">Result will appear here</div>';
    }
  }

  return { init };
})();
