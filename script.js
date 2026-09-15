const pwInput = document.getElementById('pw');
const toggleBtn = document.getElementById('toggle');
const meterFill = document.getElementById('meterFill');
const meterLabel = document.getElementById('meterLabel');
const mLength = document.getElementById('mLength');
const mEntropy = document.getElementById('mEntropy');
const mCrack = document.getElementById('mCrack');
const breachBtn = document.getElementById('breachBtn');
const breachResult = document.getElementById('breachResult');

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
const STRENGTH_COLORS = ['#E5626A', '#E5626A', '#F0B429', '#4FD1A5', '#4FD1A5'];

toggleBtn.addEventListener('click', () => {
  const showing = pwInput.type === 'text';
  pwInput.type = showing ? 'password' : 'text';
  toggleBtn.textContent = showing ? 'show' : 'hide';
  toggleBtn.setAttribute('aria-pressed', String(!showing));
});

function poolSize(pw) {
  let size = 0;
  if (/[a-z]/.test(pw)) size += 26;
  if (/[A-Z]/.test(pw)) size += 26;
  if (/[0-9]/.test(pw)) size += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) size += 32;
  return size || 1;
}

function calcEntropy(pw) {
  if (!pw) return 0;
  return Math.round(pw.length * Math.log2(poolSize(pw)));
}

// Assumes a fast offline attack: ~10 billion guesses/sec against an unsalted
// or weakly-hashed leak. This is a deliberately conservative estimate.
function crackTimeLabel(entropyBits) {
  if (entropyBits === 0) return '—';
  const guesses = Math.pow(2, entropyBits);
  const seconds = guesses / 1e10;
  const units = [
    ['centuries', 60 * 60 * 24 * 365 * 100],
    ['years', 60 * 60 * 24 * 365],
    ['days', 60 * 60 * 24],
    ['hours', 60 * 60],
    ['minutes', 60],
    ['seconds', 1],
  ];
  for (const [name, secs] of units) {
    if (seconds >= secs) {
      const val = seconds / secs;
      return `~${val < 10 ? val.toFixed(1) : Math.round(val).toLocaleString()} ${name}`;
    }
  }
  return 'instant';
}

function updateChecklist(pw) {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^a-zA-Z0-9]/.test(pw),
  };
  document.querySelectorAll('.check-item').forEach((item) => {
    item.classList.toggle('met', checks[item.dataset.check]);
  });
}

function updateMeter(entropy) {
  const pct = Math.min(100, Math.round((entropy / 80) * 100));
  meterFill.style.width = pct + '%';

  let idx = 0;
  if (entropy >= 28) idx = 1;
  if (entropy >= 40) idx = 2;
  if (entropy >= 60) idx = 3;
  if (entropy >= 80) idx = 4;

  meterFill.style.background = STRENGTH_COLORS[idx];
  meterLabel.textContent = STRENGTH_LABELS[idx];
  meterLabel.style.color = STRENGTH_COLORS[idx];
}

function resetDisplay() {
  meterLabel.textContent = 'Waiting for input';
  meterLabel.style.color = '';
  meterFill.style.width = '0%';
  mLength.textContent = '0';
  mEntropy.textContent = '0';
  mCrack.textContent = '—';
}

pwInput.addEventListener('input', () => {
  const pw = pwInput.value;
  breachBtn.disabled = pw.length === 0;
  breachResult.textContent = '';
  breachResult.className = 'breach-result';

  if (!pw) {
    resetDisplay();
    updateChecklist('');
    return;
  }

  const entropy = calcEntropy(pw);
  mLength.textContent = pw.length;
  mEntropy.textContent = entropy;
  mCrack.textContent = crackTimeLabel(entropy);
  updateChecklist(pw);
  updateMeter(entropy);
});

async function sha1Hex(str) {
  const bytes = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

breachBtn.addEventListener('click', async () => {
  const pw = pwInput.value;
  if (!pw) return;

  breachBtn.disabled = true;
  const originalLabel = breachBtn.textContent;
  breachBtn.textContent = 'Checking…';
  breachResult.textContent = '';
  breachResult.className = 'breach-result';

  try {
    const hash = await sha1Hex(pw);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    // k-anonymity: only the 5-character prefix ever leaves the browser.
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) throw new Error('bad response');

    const body = await res.text();
    let count = 0;
    for (const line of body.split('\n')) {
      const [suf, cnt] = line.trim().split(':');
      if (suf === suffix) {
        count = parseInt(cnt, 10);
        break;
      }
    }

    if (count > 0) {
      breachResult.textContent = `⚠ Seen in ${count.toLocaleString()} known breaches. Don't use this password.`;
      breachResult.classList.add('breach-found');
    } else {
      breachResult.textContent = '✓ Not found in any known breach database.';
      breachResult.classList.add('breach-clear');
    }
  } catch (err) {
    breachResult.textContent = 'Could not reach the breach database. Try again in a moment.';
    breachResult.classList.add('breach-error');
  } finally {
    breachBtn.disabled = false;
    breachBtn.textContent = originalLabel;
  }
});

resetDisplay();
updateChecklist('');
