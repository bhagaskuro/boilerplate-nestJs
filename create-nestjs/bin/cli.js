#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectName = process.argv[2];

if (!projectName) {
  console.error('\n❌ Tolong masukkan nama project!');
  console.error('Contoh: npm create @kuldi/nestjs my-app');
  console.error('Atau gunakan "." untuk install di folder saat ini: npm create @kuldi/nestjs .\n');
  process.exit(1);
}

// Menangani jika user menggunakan titik (.) untuk current directory
const currentPath = process.cwd();
const projectPath = projectName === '.' ? currentPath : path.join(currentPath, projectName);
const gitRepo = 'https://github.com/bhagaskuro/boilerplate-nestJs.git';

try {
  // Mengecek apakah target directory kosong (jika menggunakan .)
  if (projectName === '.') {
    const files = fs.readdirSync(currentPath);
    if (files.length > 0) {
      console.error('\n❌ Folder saat ini tidak kosong! Harap jalankan di folder kosong agar tidak menimpa file yang ada.\n');
      process.exit(1);
    }
  }

  console.log(`\n🚀 Mengunduh Kuli Digital NestJS Boilerplate ke ${projectPath}...`);
  
  // 1. Clone repository
  // Gunakan git clone ke folder sementara jika current dir agar tidak tabrakan, 
  // tapi berhubung git clone butuh folder kosong, aman.
  execSync(`git clone --depth 1 ${gitRepo} "${projectPath}"`, { stdio: 'inherit' });

  // 2. Masuk ke folder project
  process.chdir(projectPath);

  // 3. Hapus folder .git bawaan boilerplate
  fs.rmSync(path.join(projectPath, '.git'), { recursive: true, force: true });
  
  // Hapus juga folder create-nestjs agar tidak mengotori project user akhir
  const cliFolder = path.join(projectPath, 'create-nestjs');
  if (fs.existsSync(cliFolder)) {
    fs.rmSync(cliFolder, { recursive: true, force: true });
  }
  
  // Inisialisasi ulang git baru
  execSync('git init', { stdio: 'ignore' });

  // 4. Install dependencies
  console.log('\n📦 Meng-install dependencies (ini butuh waktu beberapa menit)...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('\n✅ Project berhasil dibuat!');
  
  if (projectName !== '.') {
    console.log(`\nLangkah selanjutnya:`);
    console.log(`  cd ${projectName}`);
    console.log(`  npm run start:dev\n`);
  } else {
    console.log(`\nLangkah selanjutnya:`);
    console.log(`  npm run start:dev\n`);
  }
  
} catch (error) {
  console.error('\n❌ Gagal membuat project:', error.message);
  process.exit(1);
}
