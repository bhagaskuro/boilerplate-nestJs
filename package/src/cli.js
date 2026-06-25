#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const currentPath = process.cwd();

// Fallback untuk support Node versi di bawah 20.11 yang belum punya import.meta.dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log(chalk.cyan.bold('\n🚀 Kuli Digital NestJS Boilerplate Generator\n'));

  const argProjectName = process.argv[2];

  // 1. Tanya-tanya
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Nama Project (atau . untuk folder saat ini):',
      default: argProjectName || 'my-nestjs-app',
      when: !argProjectName,
    },
    {
      type: 'input',
      name: 'database',
      message: 'Nama Database PostgreSQL:',
      default: 'kulidigital_db',
    },
    {
      type: 'confirm',
      name: 'skipInstall',
      message: 'Lewati instalasi package (npm install)?',
      default: false,
    },
  ]);

  const projectName = argProjectName || answers.projectName;
  const projectPath = projectName === '.' ? currentPath : path.join(currentPath, projectName);

  // Mengecek apakah target directory kosong
  if (projectName === '.') {
    const files = fs.readdirSync(currentPath).filter(f => !f.startsWith('.git'));
    if (files.length > 0) {
      console.log(chalk.red('\n❌ Folder saat ini tidak kosong! Harap jalankan di folder kosong.\n'));
      process.exit(1);
    }
  }

  // 2. Salin Template
  const copySpinner = ora('Membuat struktur project...').start();
  try {
    const templateDir = path.join(__dirname, '../template');
    
    // Copy seluruh isi folder template ke project tujuan
    fs.cpSync(templateDir, projectPath, { recursive: true });
    
    // Rename gitignore menjadi .gitignore (krn NPM mengabaikan .gitignore saat publish)
    const gitignorePath = path.join(projectPath, 'gitignore');
    if (fs.existsSync(gitignorePath)) {
      fs.renameSync(gitignorePath, path.join(projectPath, '.gitignore'));
    }

    copySpinner.succeed('Struktur project berhasil dibuat.');
  } catch (error) {
    copySpinner.fail('Gagal menyalin struktur template.');
    console.error(error.message);
    process.exit(1);
  }

  // Masuk ke folder project
  process.chdir(projectPath);

  // 3. Setup .env
  const envSpinner = ora('Menyiapkan file .env...').start();
  try {
    const envExamplePath = path.join(projectPath, '.env.example');
    const envPath = path.join(projectPath, '.env');
    
    if (fs.existsSync(envExamplePath)) {
      let envContent = fs.readFileSync(envExamplePath, 'utf-8');
      
      envContent = envContent.replace(/__DATABASE_NAME__/g, answers.database);
      envContent = envContent.replace(/APP_NAME=my-app/g, `APP_NAME=${projectName === '.' ? path.basename(currentPath) : projectName}`);
      
      fs.writeFileSync(envPath, envContent);
      envSpinner.succeed('File .env berhasil dibuat.');
    } else {
      envSpinner.warn('File .env.example tidak ditemukan, lewati setup .env.');
    }
  } catch (error) {
    envSpinner.fail('Gagal menyiapkan file .env.');
  }
  
  // 4. Inisialisasi Git
  try {
    execSync('git init', { stdio: 'ignore' });
  } catch (e) {
    // Abaikan jika user tidak punya git terinstall
  }

  // 5. Install Dependencies
  if (!answers.skipInstall) {
    const installSpinner = ora(`Menginstal dependencies menggunakan npm... (ini butuh waktu beberapa menit)`).start();
    try {
      execSync(`npm install`, { stdio: 'ignore' });
      installSpinner.succeed('Dependencies berhasil diinstal.');
    } catch (error) {
      installSpinner.fail('Gagal menginstal dependencies.');
      console.log(chalk.yellow('\nKamu bisa menginstalnya secara manual nanti.'));
    }
  }

  // 6. Success Message
  console.log(chalk.green.bold('\n✅ Project Berhasil Dibuat!\n'));
  console.log(chalk.white('Langkah selanjutnya:'));
  
  if (projectName !== '.') {
    console.log(chalk.cyan(`  cd ${projectName}`));
  }
  
  if (answers.skipInstall) {
    console.log(chalk.cyan(`  npm install`));
  }
  
  console.log(chalk.cyan(`  npx prisma migrate dev`));
  console.log(chalk.cyan(`  npx prisma db seed`));
  console.log(chalk.cyan(`  npm run start:dev\n`));
  console.log(chalk.gray(`Happy Coding! - Kuli Digital\n`));
}

run();
