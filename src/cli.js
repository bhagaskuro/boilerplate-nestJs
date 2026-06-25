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
  const isCurrentDirArg = argProjectName === '.';
  const defaultName = isCurrentDirArg ? path.basename(currentPath) : (argProjectName || 'my-nestjs-app');

  // 1. Tanya Project Name
  const { projectName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project Name:',
      default: defaultName,
    }
  ]);

  const isCurrentDir = isCurrentDirArg || projectName === '.';
  const projectPath = isCurrentDir ? currentPath : path.join(currentPath, projectName);
  const finalProjectName = projectName === '.' ? path.basename(currentPath) : projectName;

  // 2. Cek apakah folder kosong (Overwrite Check)
  if (fs.existsSync(projectPath)) {
    const files = fs.readdirSync(projectPath).filter(f => !f.startsWith('.git'));
    if (files.length > 0) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Directory is not empty. Do you want to continue? (This will overwrite existing files)',
          default: false,
        }
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('\n⚠️ Setup cancelled.\n'));
        process.exit(0);
      }
    }
  }

  // 3. Tanya Database & Setup
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'database',
      message: 'PostgreSQL Database Name:',
      default: `${finalProjectName}_db`,
    },
    {
      type: 'confirm',
      name: 'skipInstall',
      message: 'Skip package installation (npm install)?',
      default: false,
    },
  ]);

  // 2. Salin Template
  const copySpinner = ora('Generating project structure...').start();
  try {
    const templateDir = path.join(__dirname, '../template');
    
    // Copy template contents to the target project directory
    fs.cpSync(templateDir, projectPath, { recursive: true });
    
    // Rename gitignore to .gitignore (NPM ignores .gitignore during publish)
    const gitignorePath = path.join(projectPath, 'gitignore');
    if (fs.existsSync(gitignorePath)) {
      fs.renameSync(gitignorePath, path.join(projectPath, '.gitignore'));
    }

    copySpinner.succeed('Project structure generated successfully.');
  } catch (error) {
    copySpinner.fail('Failed to generate project structure.');
    console.error(error.message);
    process.exit(1);
  }

  // Navigate to project directory
  process.chdir(projectPath);

  // 3. Setup .env
  const envSpinner = ora('Configuring environment variables...').start();
  try {
    const envExamplePath = path.join(projectPath, '.env.example');
    const envPath = path.join(projectPath, '.env');
    
    if (fs.existsSync(envExamplePath)) {
      let envContent = fs.readFileSync(envExamplePath, 'utf-8');
      
      envContent = envContent.replace(/__DATABASE_NAME__/g, answers.database);
      envContent = envContent.replace(/APP_NAME=my-app/g, `APP_NAME=${projectName === '.' ? path.basename(currentPath) : projectName}`);
      
      fs.writeFileSync(envPath, envContent);
      envSpinner.succeed('.env file created successfully.');
    } else {
      envSpinner.warn('.env.example not found, skipping .env setup.');
    }
  } catch (error) {
    envSpinner.fail('Failed to configure .env file.');
  }
  
  // 4. Update package.json & README.md
  const configSpinner = ora('Configuring project details...').start();
  try {
    // Update package.json
    const pkgPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      pkg.name = finalProjectName;
      pkg.description = `${finalProjectName} Application`;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }

    // Update README.md
    const readmePath = path.join(projectPath, 'README.md');
    if (fs.existsSync(readmePath)) {
      let readmeContent = fs.readFileSync(readmePath, 'utf-8');
      readmeContent = readmeContent.replace(/<h1>🏗 Kuli Digital NestJS Backend<\/h1>/g, `<h1>🏗 ${finalProjectName} Backend</h1>`);
      readmeContent = readmeContent.replace(/<p>The standard backend application architecture built with NestJS following the <b>Kuli Digital Standardization Manual<\/b>\.<\/p>/g, `<p>Backend application for ${finalProjectName}.</p>`);
      fs.writeFileSync(readmePath, readmeContent);
    }

    // Update Swagger config in main.ts
    const mainTsPath = path.join(projectPath, 'src', 'main.ts');
    if (fs.existsSync(mainTsPath)) {
      let mainTsContent = fs.readFileSync(mainTsPath, 'utf-8');
      mainTsContent = mainTsContent.replace(/\.setTitle\('Kuli Digital Standard API'\)/g, `.setTitle('${finalProjectName} API')`);
      mainTsContent = mainTsContent.replace(/\.setDescription\('Kuli Digital NestJS Backend API Documentation'\)/g, `.setDescription('${finalProjectName} Backend API Documentation')`);
      fs.writeFileSync(mainTsPath, mainTsContent);
    }
    
    configSpinner.succeed('Project details configured successfully.');
  } catch (error) {
    configSpinner.fail('Failed to configure project details.');
  }

  // 5. Initialize Git
  try {
    execSync('git init', { stdio: 'ignore' });
  } catch (e) {
    // Ignore if git is not installed
  }

  // 6. Install Dependencies
  if (!answers.skipInstall) {
    const installSpinner = ora(`Installing dependencies using npm... (this may take a few minutes)`).start();
    try {
      execSync(`npm install`, { stdio: 'ignore' });
      installSpinner.succeed('Dependencies installed successfully.');
    } catch (error) {
      installSpinner.fail('Failed to install dependencies.');
      console.log(chalk.yellow('\nYou can install them manually later.'));
    }
  }

  // 7. Success Message
  console.log(chalk.green.bold('\n✅ Project successfully created!\n'));
  console.log(chalk.white('Next steps:'));
  
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
