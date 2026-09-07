#!/usr/bin/env node
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bumpVersion, calculateNextVersion } from './bump-version.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const currentVersion = pkg.version || '3.0.0';

    console.log('\n======================================================');
    console.log(`🚀 Asistente de Versionado SemVer & Commit (Iglekids)`);
    console.log(`📌 Versión actual: v${currentVersion}`);
    console.log('======================================================\n');

    console.log('Selecciona el impacto de los cambios según el estándar SemVer:');
    console.log(`  [1] Parche (Patch): Corrección de errores, fallos de pantalla o parches rápidos.`);
    console.log(`      Ejemplo: v${currentVersion} → v${calculateNextVersion(currentVersion, 'patch')}`);
    console.log(`  [2] Menor (Minor): Nuevas funciones, pantallas o módulos compatibles.`);
    console.log(`      Ejemplo: v${currentVersion} → v${calculateNextVersion(currentVersion, 'minor')}`);
    console.log(`  [3] Mayor (Major): Rediseño profundo o cambios estructurales.`);
    console.log(`      Ejemplo: v${currentVersion} → v${calculateNextVersion(currentVersion, 'major')}`);
    console.log(`  [0] Cancelar\n`);

    const typeChoice = (await rl.question('Tipo de versión [1]: ')).trim() || '1';

    let type = 'patch';
    if (typeChoice === '2') type = 'minor';
    else if (typeChoice === '3') type = 'major';
    else if (typeChoice === '0') {
      console.log('Operación cancelada.');
      rl.close();
      return;
    }

    const nextVersion = calculateNextVersion(currentVersion, type);

    console.log(`\nNueva versión a generar: v${nextVersion} (${type.toUpperCase()})\n`);

    let title = '';
    while (!title) {
      title = (await rl.question('📝 Título breve y amigable para el usuario: ')).trim();
      if (!title) {
        console.log('⚠️  El título no puede estar vacío.');
      }
    }

    console.log('\n💡 Explica los cambios en lenguaje sencillo (sin tecnicismos).');
    console.log('   Ingresa cada viñeta y presiona Enter. Deja vacío para finalizar:');

    const changes = [];
    let changeIndex = 1;
    while (true) {
      const item = (await rl.question(`   • Viñeta ${changeIndex}: `)).trim();
      if (!item) {
        if (changes.length === 0) {
          console.log('   ⚠️  Debes ingresar al menos un punto explicativo para los usuarios.');
          continue;
        }
        break;
      }
      changes.push(item);
      changeIndex++;
    }

    console.log('\n------------------------------------------------------');
    console.log(`Resumen de la actualización:`);
    console.log(`• Versión: v${nextVersion} (${type.toUpperCase()})`);
    console.log(`• Título: ${title}`);
    console.log(`• Cambios:`);
    changes.forEach((c) => console.log(`   - ${c}`));
    console.log('------------------------------------------------------\n');

    const confirm = (await rl.question('¿Aplicar versión y realizar commit en Git? (S/n): ')).trim().toLowerCase();
    if (confirm && confirm !== 's' && confirm !== 'si' && confirm !== 'y' && confirm !== 'yes') {
      console.log('Operación cancelada.');
      rl.close();
      return;
    }

    // Bump version and changelog
    const { newVersion } = bumpVersion({ type, title, changes });
    console.log(`\n✅ Archivos actualizados a v${newVersion}: package.json y src/data/changelog.json`);

    // Prepare Git commit
    const commitMessage = `feat(release): v${newVersion} - ${title}`;
    console.log(`📦 Creando commit: "${commitMessage}"`);

    execSync('git add package.json src/data/changelog.json', { cwd: rootDir, stdio: 'inherit' });
    
    // Also add any other staged or unstaged modifications if desired
    const stageAll = (await rl.question('¿Deseas incluir todos los demás cambios pendientes en el commit? (S/n): ')).trim().toLowerCase();
    if (!stageAll || stageAll === 's' || stageAll === 'si' || stageAll === 'y' || stageAll === 'yes') {
      execSync('git add -A', { cwd: rootDir, stdio: 'inherit' });
    }

    execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: rootDir, stdio: 'inherit' });
    console.log(`\n🎉 Commit realizado con éxito para la versión v${newVersion}!\n`);

  } catch (err) {
    console.error('Error durante el proceso:', err.message);
  } finally {
    rl.close();
  }
}

main();
