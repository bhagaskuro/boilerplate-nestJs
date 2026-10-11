#!/usr/bin/env node

import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';
import { generateResource } from './generators/resource.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const currentPath = process.cwd();

async function run() {
  console.log(
    chalk.cyan.bold('\n🚀 Kuli Digital NestJS Boilerplate Generator\n'),
  );

  const argProjectName = process.argv[2];
  const isCurrentDirArg = argProjectName === '.';

  const defaultName = isCurrentDirArg
    ? path.basename(currentPath)
    : argProjectName || 'my-nestjs-app';

  const { projectName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project Name:',
      default: defaultName,
    },
  ]);

  if (!projectName.trim()) {
    console.error(chalk.red('Project name cannot be empty.'));
    process.exitCode = 1;
    return;
  }

  const isCurrentDir = isCurrentDirArg || projectName === '.';
  const projectPath = isCurrentDir
    ? currentPath
    : path.resolve(currentPath, projectName);

  const finalProjectName =
    projectName === '.' ? path.basename(currentPath) : projectName;

  // Check destination directory.
  if (fs.existsSync(projectPath)) {
    const files = fs
      .readdirSync(projectPath)
      .filter((file) => file !== '.git');

    if (files.length > 0) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message:
            'Directory is not empty. Do you want to continue? Existing files may be overwritten.',
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('\n⚠️ Setup cancelled.\n'));
        return;
      }
    }
  }

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

  const copySpinner = ora('Generating project structure...').start();

  try {
    // Assumes the package structure is:
    // package-root/
    // ├── src/index.js
    // └── template/
    const templateDir = path.resolve(__dirname, '../template');

    if (!fs.existsSync(templateDir)) {
      throw new Error(`Template directory not found: ${templateDir}`);
    }

    if (!fs.statSync(templateDir).isDirectory()) {
      throw new Error(`Template path is not a directory: ${templateDir}`);
    }

    fs.mkdirSync(projectPath, { recursive: true });

fs.cpSync(templateDir, projectPath, {
  recursive: true,
  force: true,
  filter: (source) => {
    const relative = path.relative(templateDir, source);
    const parts = relative.split(path.sep);

    // Abaikan direktori dan file yang tidak diperlukan.
    const ignored = [
      'node_modules',
      '.git',
      'dist',
      'coverage',
      '.env',
      '.env.local',
    ];

    if (parts.some((part) => ignored.includes(part))) {
      return false;
    }

    // Jangan ikutkan implementasi generator CLI.
    if (
      relative === 'generators' ||
      relative.startsWith(`generators${path.sep}`)
    ) {
      return false;
    }

    return true;
  },
});

    // Restore .gitignore from the npm-safe template filename.
    const gitignorePath = path.join(projectPath, 'gitignore');
    const targetGitignorePath = path.join(projectPath, '.gitignore');

    if (fs.existsSync(gitignorePath)) {
      if (fs.existsSync(targetGitignorePath)) {
        fs.rmSync(targetGitignorePath);
      }

      fs.renameSync(gitignorePath, targetGitignorePath);
    } else if (!fs.existsSync(targetGitignorePath)) {
      console.warn(
        chalk.yellow(
          'Warning: Neither template/gitignore nor template/.gitignore was copied.',
        ),
      );
    }

    copySpinner.succeed('Project structure generated successfully.');
  } catch (error) {
    copySpinner.fail('Failed to generate project structure.');
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  // Configure generated project.
  const envSpinner = ora('Configuring environment variables...').start();

  try {
    const envExamplePath = path.join(projectPath, '.env.example');
    const envPath = path.join(projectPath, '.env');

    if (fs.existsSync(envExamplePath)) {
      let envContent = fs.readFileSync(envExamplePath, 'utf8');

      envContent = envContent.replace(
        /__DATABASE_NAME__/g,
        answers.database,
      );

      envContent = envContent.replace(
        /APP_NAME=my-app/g,
        `APP_NAME=${finalProjectName}`,
      );

      // Do not overwrite an existing .env file.
      if (!fs.existsSync(envPath)) {
        fs.writeFileSync(envPath, envContent);
      }

      envSpinner.succeed('.env configuration completed.');
    } else {
      envSpinner.warn('.env.example not found; skipping .env setup.');
    }
  } catch (error) {
    envSpinner.fail('Failed to configure .env file.');
    console.error(error.message);
  }

  const configSpinner = ora('Configuring project details...').start();

  try {
    const pkgPath = path.join(projectPath, 'package.json');

    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

      pkg.name = finalProjectName
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      pkg.description = `${finalProjectName} Application`;

      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    }

    const readmePath = path.join(projectPath, 'README.md');

    if (fs.existsSync(readmePath)) {
      let readmeContent = fs.readFileSync(readmePath, 'utf8');

      readmeContent = readmeContent.replace(
        /<h1>🏗 Kuli Digital NestJS Backend<\/h1>/g,
        `<h1>🏗 ${finalProjectName} Backend</h1>`,
      );

      readmeContent = readmeContent.replace(
        /<p>The standard backend application architecture built with the <b>Kuli Digital Standardization Manual<\/b>\.<\/p>/g,
        `<p>Backend application for ${finalProjectName}.</p>`,
      );

      fs.writeFileSync(readmePath, readmeContent);
    }

    const mainTsPath = path.join(projectPath, 'src', 'main.ts');

    if (fs.existsSync(mainTsPath)) {
      let mainTsContent = fs.readFileSync(mainTsPath, 'utf8');

      mainTsContent = mainTsContent.replace(
        /\.setTitle\('Kuli Digital Standard API'\)/g,
        `.setTitle('${finalProjectName} API')`,
      );

      mainTsContent = mainTsContent.replace(
        /\.setDescription\('Kuli Digital NestJS Backend API Documentation'\)/g,
        `.setDescription('${finalProjectName} Backend API Documentation')`,
      );

      fs.writeFileSync(mainTsPath, mainTsContent);
    }

    configSpinner.succeed('Project details configured successfully.');
  } catch (error) {
    configSpinner.fail('Failed to configure project details.');
    console.error(error.message);
  }

  // Initialize Git in the generated project.
  try {
    execSync('git init', {
      cwd: projectPath,
      stdio: 'ignore',
    });
  } catch {
    console.log(chalk.yellow('Git initialization skipped.'));
  }

  // Install dependencies in the generated project.
  if (!answers.skipInstall) {
    const installSpinner = ora(
      'Installing dependencies using npm...',
    ).start();

    try {
      execSync('npm install', {
        cwd: projectPath,
        stdio: 'inherit',
      });

      installSpinner.succeed('Dependencies installed successfully.');
    } catch {
      installSpinner.fail('Failed to install dependencies.');
      console.log(chalk.yellow('You can run npm install manually.'));
    }
  }

  console.log(chalk.green.bold('\n✅ Project successfully created!\n'));
  console.log(chalk.white('Next steps:'));

  if (!isCurrentDir) {
    console.log(chalk.cyan(`  cd "${projectName}"`));
  }

  if (answers.skipInstall) {
    console.log(chalk.cyan('  npm install'));
  }

  console.log(chalk.cyan('  npx prisma migrate dev'));
  console.log(chalk.cyan('  npm run prisma:seed'));
  console.log(chalk.cyan('  npm run start:dev\n'));
  console.log(chalk.gray('Happy Coding! - Kuli Digital\n'));
}

async function main() {
  const args = process.argv.slice(2);

  // Generate a resource inside an existing NestJS project.
  if (args[0] === 'g' || args[0] === 'generate') {
    if (args[1] !== 'resource' || !args[2]) {
      console.error(
        'Usage: kuli-digital-nestjs g resource <name> [--dry-run] [--force]',
      );
      process.exitCode = 1;
      return;
    }

    await generateResource({
      name: args[2],
      dryRun: args.includes('--dry-run'),
      force: args.includes('--force'),
    });

    return;
  }

  // Default behavior: create a new boilerplate project.
  await run();
}

main().catch((error) => {
  console.error(chalk.red(error.message));
  process.exitCode = 1;
});