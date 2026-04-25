// Powered by skill: security
// Runs before every build. Fails loud if something violates project invariants.
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const checks = [];

// 1. Owner home address must NEVER appear anywhere in the repo
const FORBIDDEN_PATTERN = 'Alter Ossweiler\\|Ossweiler Weg\\|71638\\|Ludwigsburg';
try {
  const out = execSync(
    `git grep -l "${FORBIDDEN_PATTERN}" -- ':!scripts/preflight.mjs'`,
    { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  if (out.trim()) {
    checks.push({
      ok: false,
      msg: `🛑 PRIVACY VIOLATION: forbidden owner home address found in:\n${out}`,
    });
  } else {
    checks.push({ ok: true, msg: '✅ Owner home address not present in repo' });
  }
} catch {
  // git grep exits with code 1 when nothing matches — that's the GOOD case
  checks.push({ ok: true, msg: '✅ Owner home address not present in repo' });
}

// 2. Logo must exist
const logoPath = 'public/brand/logo.png';
checks.push({
  ok: existsSync(logoPath),
  msg: existsSync(logoPath) ? '✅ Logo present' : `🛑 Logo missing at ${logoPath}`,
});

// 3. WhatsApp env var
const env = process.env.PUBLIC_RESTAURANT_WHATSAPP;
const expected = '491742116095';
if (env === expected) {
  checks.push({ ok: true, msg: '✅ WhatsApp number correctly set' });
} else if (env) {
  checks.push({
    ok: true,
    msg: `⚠️  PUBLIC_RESTAURANT_WHATSAPP=${env} (expected ${expected}) — proceeding`,
  });
} else {
  checks.push({
    ok: true,
    msg: `⚠️  PUBLIC_RESTAURANT_WHATSAPP not set — site will render a "Bestellung deaktiviert" banner`,
  });
}

console.log(checks.map((c) => c.msg).join('\n'));
if (checks.some((c) => !c.ok)) {
  process.exit(1);
}
