// Turkey Run — entrypoint (Node 22, standard library only).
//
// Hands the game in: copies game/ and screenshots/ from this repository
// into the output directory and writes dossier.json there, using the
// kit's buildDossier from ./vendor/makefun-game.ts. The grader runs this
// file twice; both runs must write the same bytes.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(import.meta.dirname);
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

// Clear only the CONTENTS of the output directory, never the directory
// itself: the grader mounts /output with a parent the bot user cannot
// write to, so removing the directory itself fails with EACCES.
function clearOutputDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function copyTree(name: string): void {
  const src = join(repoRoot, name);
  const dst = join(outDir, name);
  if (!existsSync(src)) throw new Error(`Turkey Run: missing ${name}/ in the repository`);
  cpSync(src, dst, { recursive: true, dereference: true });
}

// Start from a clean output directory so stale files never leak in.
// (Contents only — the directory itself must stay, see clearOutputDir.)
clearOutputDir(outDir);

copyTree('game');
copyTree('screenshots');

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
