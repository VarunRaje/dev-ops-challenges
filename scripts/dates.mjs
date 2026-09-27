// Records first-published and last-modified dates for every guide from git history.
// The result (content-dates.json) is committed so Docker builds, which have no .git, still get real dates.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const DATES_FILE = join(ROOT, 'content-dates.json');

function gitDates(file) {
    const out = execFileSync('git', ['log', '--follow', '--format=%cI', '--', file], { cwd: ROOT, encoding: 'utf8' })
        .trim().split('\n').filter(Boolean);
    if (!out.length) return null;
    return { published: out[out.length - 1], modified: out[0] };
}

export function refreshDates() {
    if (!existsSync(join(ROOT, '.git'))) return false;
    const files = ['contact.md', ...readdirSync(join(ROOT, 'challenges')).filter(f => f.endsWith('.md')).map(f => `challenges/${f}`)];
    const dates = {};
    for (const f of files.sort()) {
        const d = gitDates(f);
        if (d) dates[f] = d;
    }
    writeFileSync(DATES_FILE, JSON.stringify(dates, null, 2) + '\n');
    return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    console.log(refreshDates() ? `Wrote ${DATES_FILE}` : 'No .git directory; dates not refreshed');
}
