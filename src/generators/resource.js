import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_DIR = path.resolve(__dirname, '../../template/generators/resource');

function toKebabCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function toPascalCase(value) {
  return toKebabCase(value)
    .split('-')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
}

// Intentionally conservative: handles common resource names, not arbitrary English plurals.
function singularize(value) {
  if (value.endsWith('ies') && value.length > 3) return `${value.slice(0, -3)}y`;
  if (value.endsWith('sses')) return value.slice(0, -2);
  if (value.endsWith('s') && !value.endsWith('ss')) return value.slice(0, -1);
  return value;
}

function replaceTokens(content, tokens) {
  return Object.entries(tokens).reduce(
    (result, [key, value]) => result.replaceAll(`__${key}__`, value),
    content,
  );
}

function ensureInside(parent, target) {
  const relative = path.relative(parent, target);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function findPrismaModuleImport(moduleFile, projectRoot) {
  const candidates = [
    path.join(projectRoot, 'src/common/prisma/prisma.module.ts'),
    path.join(projectRoot, 'src/common/prisma/prisma.module.js'),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(
      'PrismaModule tidak ditemukan. Generator mengasumsikan src/common/prisma/prisma.module.ts. ' +
      'Sesuaikan lokasi di src/generators/resource.js jika struktur project berbeda.',
    );
  }

  let importPath = path.relative(path.dirname(moduleFile), found).replaceAll(path.sep, '/');
  importPath = importPath.replace(/\.(ts|js)$/, '');
  if (!importPath.startsWith('.')) importPath = `./${importPath}`;
  return importPath;
}

function registerInAppModule(projectRoot, moduleClass, moduleImportPath, dryRun = false) {
  const appModulePath = path.join(projectRoot, 'src', 'app.module.ts');

  if (!fs.existsSync(appModulePath)) {
    throw new Error(
      'src/app.module.ts tidak ditemukan. Registrasi module dibatalkan.',
    );
  }

  let content = fs.readFileSync(appModulePath, 'utf8');

  // Cari decorator @Module(), bukan konfigurasi ConfigModule.forRoot().
  const decoratorMatch = content.match(/@Module\s*\(\s*\{/);

  if (!decoratorMatch || decoratorMatch.index === undefined) {
    throw new Error(
      'Decorator @Module({...}) tidak ditemukan di src/app.module.ts.',
    );
  }

  const decoratorStart = decoratorMatch.index + decoratorMatch[0].length;
  const decoratorContent = content.slice(decoratorStart);

  // Cari property imports milik @Module decorator.
  const importsMatch = decoratorContent.match(
    /^\s*imports\s*:\s*\[/m,
  );

  if (!importsMatch || importsMatch.index === undefined) {
    throw new Error(
      'Array imports milik @Module() tidak ditemukan. Registrasi dibatalkan.',
    );
  }

  const arrayStart =
    decoratorStart + importsMatch.index + importsMatch[0].lastIndexOf('[');

  // Temukan penutup array yang benar, tanpa tertukar dengan array bersarang.
  let depth = 0;
  let quote = null;
  let escaped = false;
  let arrayEnd = -1;

  for (let i = arrayStart; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    // Lewati string agar karakter [ dan ] di dalam string tidak dihitung.
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      continue;
    }

    // Lewati komentar satu baris.
    if (char === '/' && next === '/') {
      const newline = content.indexOf('\n', i);
      if (newline === -1) break;
      i = newline;
      continue;
    }

    // Lewati komentar multiline.
    if (char === '/' && next === '*') {
      const endComment = content.indexOf('*/', i + 2);
      if (endComment === -1) {
        throw new Error('Komentar tidak ditutup di app.module.ts.');
      }
      i = endComment + 1;
      continue;
    }

    if (char === '[') depth++;

    if (char === ']') {
      depth--;

      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }

  if (arrayEnd === -1) {
    throw new Error(
      'Array imports di @Module() tidak valid atau tidak ditutup.',
    );
  }

  const importsContent = content.slice(arrayStart + 1, arrayEnd);
  const moduleRegex = new RegExp(`\\b${moduleClass}\\b`);

  if (moduleRegex.test(importsContent)) {
    return {
      changed: false,
      message: `${moduleClass} sudah terdaftar di AppModule.`,
    };
  }

  // Tambahkan module ke array imports milik @Module().
  const trimmedImports = importsContent.trimEnd();
  const separator =
    trimmedImports.length > 0 && !trimmedImports.endsWith(',')
      ? ','
      : '';

  content =
    content.slice(0, arrayEnd) +
    `${separator}\n    ${moduleClass},\n  ` +
    content.slice(arrayEnd);

  // Tambahkan import statement jika belum tersedia.
  const normalizedPath = moduleImportPath.replaceAll('\\', '/');
  const importRegex = new RegExp(
    `import\\s*\\{[^}]*\\b${moduleClass}\\b[^}]*\\}\\s*from\\s*['"][^'"]+['"]`,
  );

  if (!importRegex.test(content)) {
    const importStatement =
      `import { ${moduleClass} } from '${normalizedPath}';`;

    const importLines = [
      ...content.matchAll(/^import .*;?\s*$/gm),
    ];

    if (importLines.length > 0) {
      const lastImport = importLines[importLines.length - 1];
      const insertAt = lastImport.index + lastImport[0].length;

      content =
        content.slice(0, insertAt) +
        '\n' +
        importStatement +
        content.slice(insertAt);
    } else {
      content = importStatement + '\n' + content;
    }
  }

  if (!dryRun) {
    fs.writeFileSync(appModulePath, content, 'utf8');
  }

  return {
    changed: true,
    message: `${dryRun ? '[dry-run] ' : ''}${moduleClass} berhasil didaftarkan ke AppModule.`,
  };
}

export async function generateResource({ name, cwd = process.cwd(), dryRun = false, force = false }) {
  const rawName = String(name ?? '').trim();
  if (!rawName || !/[a-zA-Z0-9]/.test(rawName)) {
    throw new Error('Nama resource wajib diisi, contoh: users, blog-posts, userProfiles.');
  }

  const kebabPlural = toKebabCase(rawName);
  const kebabSingular = singularize(kebabPlural);
  const pluralPascal = toPascalCase(kebabPlural);
  const singularPascal = toPascalCase(kebabSingular);
  const prismaModel = kebabSingular.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

  const projectRoot = path.resolve(cwd);
  const modulesDir = path.join(projectRoot, 'src/modules');
  const resourceDir = path.join(modulesDir, kebabPlural);
  const moduleFile = path.join(resourceDir, `${kebabPlural}.module.ts`);
  const serviceFile = path.join(resourceDir, `${kebabPlural}.service.ts`);

  if (!fs.existsSync(path.join(projectRoot, 'src/common/prisma/prisma.service.ts'))) {
    throw new Error(
      'PrismaService tidak ditemukan di src/common/prisma/prisma.service.ts. ' +
      'Generator ini mengasumsikan PrismaService dan PrismaModule berada di src/common/prisma/.',
    );
  }

  if (!fs.existsSync(TEMPLATE_DIR)) {
    throw new Error(`Folder template tidak ditemukan: ${TEMPLATE_DIR}`);
  }

  const templateFiles = [
    ['controllers/v1/controller.ts.template', path.join(resourceDir, 'controllers/v1', `${kebabPlural}.controller.ts`)],
    ['core/dto/create.dto.ts.template', path.join(resourceDir, 'core/dto', `create-${kebabSingular}.dto.ts`)],
    ['core/dto/update.dto.ts.template', path.join(resourceDir, 'core/dto', `update-${kebabSingular}.dto.ts`)],
    ['core/dto/query.dto.ts.template', path.join(resourceDir, 'core/dto', `${kebabSingular}-query.dto.ts`)],
    ['core/dto/response.dto.ts.template', path.join(resourceDir, 'core/dto', `${kebabSingular}-response.dto.ts`)],
    ['core/entities/entity.ts.template', path.join(resourceDir, 'core/entities', `${kebabSingular}.entity.ts`)],
    ['core/helpers/transform.helper.ts.template', path.join(resourceDir, 'core/helpers', `${kebabSingular}-transform.helper.ts`)],
    ['module.ts.template', moduleFile],
    ['service.ts.template', serviceFile],
  ];

  const tokens = {
    RESOURCE_KEBAB: kebabPlural,
    RESOURCE_PASCAL: pluralPascal,
    SINGULAR_KEBAB: kebabSingular,
    SINGULAR_PASCAL: singularPascal,
    PRISMA_MODEL: prismaModel,
  };

  const outputs = templateFiles.map(([templateName, outputPath]) => {
    const sourcePath = path.join(TEMPLATE_DIR, templateName);
    if (!fs.existsSync(sourcePath)) throw new Error(`Template tidak ditemukan: ${sourcePath}`);
    return {
      outputPath,
      content: replaceTokens(fs.readFileSync(sourcePath, 'utf8'), tokens),
    };
  });

  const conflicts = outputs.filter(({ outputPath }) => fs.existsSync(outputPath));
  let overwriteConflicts = false;
  if (conflicts.length && !force) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: `${conflicts.length} file sudah ada. Timpa file tersebut?`,
      default: false,
    }]);
    if (!overwrite) {
      console.log(chalk.yellow('Generate resource dibatalkan; tidak ada file yang ditulis.'));
      return;
    }
    overwriteConflicts = true;
  }

  const appModuleImport = `./modules/${kebabPlural}/${kebabPlural}.module`;
  // Validate registration before writing generated files.
  const registration = registerInAppModule(projectRoot, `${pluralPascal}Module`, appModuleImport, true);

  if (dryRun) {
    console.log(chalk.cyan(`[dry-run] Resource ${kebabPlural}:`));
    for (const output of outputs) console.log(`  ${path.relative(projectRoot, output.outputPath)}`);
    console.log(`  src/app.module.ts (${registration.message})`);
    return;
  }

  for (const output of outputs) {
    fs.mkdirSync(path.dirname(output.outputPath), { recursive: true });
    if (!force && !overwriteConflicts && fs.existsSync(output.outputPath)) continue;
    fs.writeFileSync(output.outputPath, output.content, 'utf8');
  }

  const finalRegistration = registerInAppModule(projectRoot, `${pluralPascal}Module`, appModuleImport, false);
  console.log(chalk.green(`Resource '${kebabPlural}' berhasil dibuat.`));
  console.log(chalk.gray(`Prisma delegate yang digunakan: prisma.${prismaModel}`));
  console.log(chalk.gray(finalRegistration.message));
  console.log(chalk.yellow('Pastikan model Prisma cocok dengan delegate dan field id yang digunakan template.'));
}

export function normalizeResourceName(name) {
  return {
    kebabPlural: toKebabCase(name),
    kebabSingular: singularize(toKebabCase(name)),
    pluralPascal: toPascalCase(name),
    singularPascal: toPascalCase(singularize(toKebabCase(name))),
  };
}
