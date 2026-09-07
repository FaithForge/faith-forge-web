#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const packageJsonPath = path.join(rootDir, 'package.json');
const changelogJsonPath = path.join(rootDir, 'src', 'data', 'changelog.json');

/**
 * Calculates the next SemVer version.
 *
 * @param {string} currentVersion - Current version string (e.g. "3.0.0").
 * @param {'major' | 'minor' | 'patch'} type - SemVer change type.
 * @returns {string} The incremented version string.
 */
export function calculateNextVersion(currentVersion, type) {
  const parts = currentVersion.split('.').map((p) => parseInt(p, 10));
  let [major = 3, minor = 0, patch = 0] = parts;

  switch (type) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
    default:
      patch += 1;
      break;
  }

  return `${major}.${minor}.${patch}`;
}

/**
 * Formats a Date object into a readable Spanish format "DD/MM/YYYY hh:mm A".
 *
 * @param {Date} date - Date to format.
 * @returns {string} Formatted date string.
 */
export function formatFriendlyDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const formattedHours = pad(hours);

  return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Bumps the version in package.json and prepends the new entry to changelog.json.
 *
 * @param {Object} options - Bump options.
 * @param {'major' | 'minor' | 'patch'} options.type - Change type.
 * @param {string} options.title - Short user-friendly title.
 * @param {string[]} options.changes - User-friendly changes list.
 * @param {string} [options.description] - Optional description.
 * @returns {{ previousVersion: string, newVersion: string }}
 */
export function bumpVersion({ type = 'patch', title, changes = [], description = '' }) {
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`);
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const currentVersion = pkg.version || '3.0.0';
  const newVersion = calculateNextVersion(currentVersion, type);

  // Read current changelog
  let changelog = [];
  if (fs.existsSync(changelogJsonPath)) {
    try {
      changelog = JSON.parse(fs.readFileSync(changelogJsonPath, 'utf-8'));
    } catch {
      changelog = [];
    }
  }

  const now = new Date();
  const newEntry = {
    version: newVersion,
    type,
    timestamp: now.toISOString(),
    dateFormatted: formatFriendlyDate(now),
    title: title.trim(),
    ...(description ? { description: description.trim() } : {}),
    changes: changes.map((c) => c.trim()).filter(Boolean),
  };

  changelog.unshift(newEntry);

  // Update package.json
  pkg.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');

  // Update changelog.json
  fs.writeFileSync(changelogJsonPath, JSON.stringify(changelog, null, 2) + '\n');

  return { previousVersion: currentVersion, newVersion };
}

// CLI execution if run directly
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const args = process.argv.slice(2);
  let type = 'patch';
  let title = '';
  const changes = [];

  for (const arg of args) {
    if (arg.startsWith('--type=')) {
      type = arg.replace('--type=', '').toLowerCase();
    } else if (arg.startsWith('--title=')) {
      title = arg.replace('--title=', '');
    } else if (arg.startsWith('--change=')) {
      changes.push(arg.replace('--change=', ''));
    }
  }

  if (!title) {
    console.error('Uso: node scripts/bump-version.mjs --type=[patch|minor|major] --title="Título" --change="Cambio 1" [--change="Cambio 2"]');
    process.exit(1);
  }

  const { previousVersion, newVersion } = bumpVersion({ type, title, changes });
  console.log(`✅ Versión actualizada: v${previousVersion} → v${newVersion} (${type.toUpperCase()})`);
}
