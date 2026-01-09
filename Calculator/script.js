(() => {
  const displayEl = document.getElementById('display');
  const buttons = document.querySelectorAll('.btn');

  let expr = '';

  function updateDisplay() {
    displayEl.textContent = expr === '' ? '0' : expr;
  }

  function appendValue(v) {
    // Prevent multiple leading zeros like "00"
    if (expr === '0' && v === '0') return;
    // Replace leading zero when typing a number (but keep "0." cases)
    if (expr === '0' && /\d/.test(v)) expr = v;
    else expr += v;
    updateDisplay();
  }

  function clearAll() {
    expr = '';
    updateDisplay();
  }

  function backspace() {
    expr = expr.slice(0, -1);
    updateDisplay();
  }

  function safeEvaluate(s) {
    // Allow only digits, operators, parentheses, decimal point and spaces
    if (!/^[0-9+\-*/().\s]+$/.test(s)) {
      throw new Error('Invalid characters');
    }
    // Disallow consecutive operators like ++ or ** except - for unary (simple check)
    if (/[+\-*/]{2,}/.test(s.replace(/\s+/g, ''))) {
      // allow negative numbers: handle a leading - or (-
      // simple sanitization: replace leading - with 0- for safe eval
      // but block other consecutive operators
      const cleaned = s.replace(/^\s*-/, '0-');
      if (/[+\-*/]{2,}/.test(cleaned.replace(/\s+/g, ''))) {
        throw new Error('Malformed expression');
      }
      s = cleaned;
    }

    // Use Function for evaluation rather than eval; still only for local purposes after validation
    // Convert unicode multiplication/division to JS operators if present
    s = s.replace(/×/g, '*').replace(/÷/g, '/');

    // Evaluate
    const fn = new Function('return ' + s);
    const result = fn();
    if (!isFinite(result)) throw new Error('Math error');
    return result;
  }

  function calculate() {
    if (expr.trim() === '') return;
    try {
      const result = safeEvaluate(expr);
      expr = String(result);
      updateDisplay();
    } catch (err) {
      displayEl.textContent = 'Error';
      setTimeout(updateDisplay, 800);
    }
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-value');
      const action = btn.getAttribute('data-action');

      if (action === 'clear') { clearAll(); return; }
      if (action === 'back') { backspace(); return; }
      if (action === 'equals') { calculate(); return; }

      if (val) {
        // If operator, prevent starting with an operator except minus and open paren
        if (/^[+\-*/]$/.test(val)) {
          if (expr === '' && val !== '-') return;
          // prevent two operators in a row
          if (/[+\-*/]$/.test(expr)) {
            // replace last operator with new one
            expr = expr.slice(0, -1) + val;
            updateDisplay();
            return;
          }
        }
        // prevent multiple decimals in the same number chunk
        if (val === '.') {
          const parts = expr.split(/[\+\-\*\/\s\(\)]/);
          const last = parts[parts.length - 1];
          if (last.includes('.')) return;
          if (last === '') expr += '0';
        }
        appendValue(val);
      }
    });
  });

  // Keyboard support
  window.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') appendValue(e.key);
    else if (e.key === '.') appendValue('.');
    else if (e.key === 'Backspace') backspace();
    else if (e.key === 'Escape') clearAll();
    else if (e.key === '=' || e.key === 'Enter') { e.preventDefault(); calculate(); }
    else if (['+','-','*','/','(',')'].includes(e.key)) appendValue(e.key);
  });

  // initialize
  updateDisplay();
})();