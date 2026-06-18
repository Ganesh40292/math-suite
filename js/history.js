/* ==========================================================================
   History Module — Calculation History with localStorage
   ========================================================================== */

const HistoryModule = (() => {
  'use strict';

  const STORAGE_KEY = 'mathsuite_history';
  const MAX_HISTORY = 100;

  let history = [];
  let drawerEl = null;
  let backdropEl = null;
  let listEl = null;
  let badgeEl = null;
  let isOpen = false;

  /**
   * Initialize history module.
   */
  function init() {
    drawerEl = document.getElementById('history-drawer');
    backdropEl = document.getElementById('history-backdrop');
    listEl = document.getElementById('history-list');
    badgeEl = document.querySelector('.history-toggle .badge');

    // Load from localStorage
    loadHistory();

    // Toggle button
    const toggleBtn = document.getElementById('history-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggle);
    }

    // Close button
    const closeBtn = document.getElementById('history-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', close);
    }

    // Backdrop click to close
    if (backdropEl) {
      backdropEl.addEventListener('click', close);
    }

    // Clear all button
    const clearBtn = document.getElementById('history-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearAll);
    }

    updateBadge();
  }

  /**
   * Add a calculation to history.
   */
  function add(expression, result) {
    if (!expression || !result || result === 'Error' || result === 'Syntax Error' || result === 'Math Error') return;

    const entry = {
      id: Date.now(),
      expression,
      result,
      timestamp: new Date().toISOString(),
    };

    history.unshift(entry);
    if (history.length > MAX_HISTORY) history.pop();

    saveHistory();
    updateBadge();

    if (isOpen) renderList();
  }

  /**
   * Toggle drawer open/closed.
   */
  function toggle() {
    if (isOpen) close();
    else open();
  }

  /**
   * Open the history drawer.
   */
  function open() {
    isOpen = true;
    drawerEl.classList.add('open');
    backdropEl.classList.add('visible');
    renderList();
  }

  /**
   * Close the history drawer.
   */
  function close() {
    isOpen = false;
    drawerEl.classList.remove('open');
    backdropEl.classList.remove('visible');
  }

  /**
   * Render the history list.
   */
  function renderList() {
    if (!listEl) return;

    if (history.length === 0) {
      listEl.innerHTML = `
        <div class="history-empty">
          <div class="empty-icon">📋</div>
          <p>No calculations yet.<br>Results will appear here.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = history.map(entry => {
      const time = formatTime(entry.timestamp);
      return `
        <div class="history-item" data-id="${entry.id}" data-result="${escapeHtml(entry.result)}">
          <div class="history-item-expr">${escapeHtml(entry.expression)}</div>
          <div class="history-item-result">= ${escapeHtml(entry.result)}</div>
          <div class="history-item-time">${time}</div>
          <button class="history-item-copy" title="Copy result" data-copy="${escapeHtml(entry.result)}">📋</button>
        </div>
      `;
    }).join('');

    // Bind click handlers
    listEl.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking copy button
        if (e.target.closest('.history-item-copy')) return;

        const result = item.dataset.result;
        // Insert result into calculator
        CalculatorModule.handleInput(result, 'number');
        close();
        showToast('Value inserted into calculator');
      });
    });

    listEl.querySelectorAll('.history-item-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(btn.dataset.copy);
      });
    });
  }

  /**
   * Clear all history.
   */
  function clearAll() {
    history = [];
    saveHistory();
    updateBadge();
    renderList();
    showToast('History cleared');
  }

  /**
   * Update the badge count.
   */
  function updateBadge() {
    if (!badgeEl) return;
    if (history.length > 0) {
      badgeEl.textContent = history.length > 99 ? '99+' : history.length;
      badgeEl.classList.add('visible');
    } else {
      badgeEl.classList.remove('visible');
    }
  }

  /**
   * Save history to localStorage.
   */
  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // localStorage might be full or disabled
    }
  }

  /**
   * Load history from localStorage.
   */
  function loadHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) history = JSON.parse(data);
    } catch {
      history = [];
    }
  }

  /**
   * Format timestamp for display.
   */
  function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Escape HTML for safe insertion.
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init, add, toggle, open, close };
})();

/* ==========================================================================
   Toast Notification System
   ========================================================================== */

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Remove after animation
  setTimeout(() => toast.remove(), 2500);
}

/* ==========================================================================
   Copy to Clipboard Utility
   ========================================================================== */

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!');
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast('Copied to clipboard!');
  } catch {
    showToast('Failed to copy', 'error');
  }
  document.body.removeChild(textarea);
}
