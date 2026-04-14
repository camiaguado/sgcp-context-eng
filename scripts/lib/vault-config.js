/**
 * vault-config.js — Lectura y escritura de vault.config.json
 * Gestiona el registro global de vaults en ~/.pkm-vaults.json
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';

const REGISTRY_PATH = join(homedir(), '.pkm-vaults.json');

/**
 * Lee el registro global de vaults.
 * @returns {Object} { vaults: [{ path, name, created_at }] }
 */
export function readRegistry() {
  if (!existsSync(REGISTRY_PATH)) return { vaults: [] };
  try {
    return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
  } catch {
    return { vaults: [] };
  }
}

/**
 * Registra un vault nuevo en el registro global.
 * @param {string} vaultPath - Path absoluto del vault
 * @param {string} name - Nombre del vault (del config.owner)
 */
export function registerVault(vaultPath, name = 'Mi vault') {
  const registry = readRegistry();
  const existing = registry.vaults.findIndex(v => v.path === vaultPath);
  const entry = { path: vaultPath, name, created_at: new Date().toISOString() };

  if (existing >= 0) {
    registry.vaults[existing] = entry;
  } else {
    registry.vaults.push(entry);
  }

  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

/**
 * Encuentra y retorna el config del vault activo.
 * Busca en orden: CWD hacia arriba → registro global (primero de la lista).
 * @param {string} [overridePath] - Path explícito del vault
 * @returns {Object} vault config completo
 * @throws {Error} si no encuentra ningún vault configurado
 */
export function readConfig(overridePath) {
  // 1. Override explícito
  if (overridePath) {
    const configPath = join(overridePath, 'vault.config.json');
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf8'));
    }
    throw new Error(`No se encontró vault.config.json en: ${overridePath}`);
  }

  // 2. Buscar en el directorio actual hacia arriba
  let dir = resolve(process.cwd());
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, 'vault.config.json');
    if (existsSync(candidate)) {
      return JSON.parse(readFileSync(candidate, 'utf8'));
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }

  // 3. Buscar en el registro global
  const registry = readRegistry();
  if (registry.vaults.length === 0) {
    throw new Error(
      'No hay vault configurado. Usá /setup para crear uno.'
    );
  }

  // Usar el vault más recientemente modificado del registro
  for (const vault of registry.vaults) {
    const configPath = join(vault.path, 'vault.config.json');
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf8'));
    }
  }

  throw new Error(
    'Los vaults registrados no existen en los paths guardados. Usá /setup para reconfigurar.'
  );
}

/**
 * Escribe el config del vault atómicamente.
 * @param {Object} config - El config completo a guardar
 */
export function writeConfig(config) {
  const configPath = join(config.vault_path, 'vault.config.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Resuelve el path absoluto de una carpeta del vault.
 * @param {Object} config
 * @param {string} folderKey - Key en config.folders (ej: 'inbox', 'projects')
 * @returns {string} path absoluto
 */
export function vaultFolder(config, folderKey) {
  const folderName = config.folders[folderKey];
  if (!folderName) throw new Error(`Carpeta '${folderKey}' no encontrada en config.folders`);
  return join(config.vault_path, folderName);
}

/**
 * Retorna todos los paths .md del vault, excluyendo _sistema y .git
 * @param {Object} config
 * @returns {string[]} array de paths absolutos
 */
export function allNotePaths(config) {
  const results = [];

  function walk(dir) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== '_sistema') {
          walk(fullPath);
        }
      } else if (entry.name.endsWith('.md') && !entry.name.startsWith('.')) {
        results.push(fullPath);
      }
    }
  }

  walk(config.vault_path);
  return results;
}
