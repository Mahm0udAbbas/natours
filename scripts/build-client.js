const fs = require('fs');
const esbuild = require('esbuild');
const dotenv = require('dotenv');

const environment = process.env.NODE_ENV || 'development';
const environmentFile = `.env.${environment}`;

dotenv.config({
  path: fs.existsSync(environmentFile) ? environmentFile : '.env',
  quiet: true,
});

const watch = process.argv.includes('--watch');
const options = {
  entryPoints: ['public/js/index.js'],
  bundle: true,
  minify: environment === 'production',
  sourcemap: true,
  outdir: 'public/dist',
  entryNames: 'bundle',
  assetNames: 'assets/[name]-[hash]',
  loader: { '.png': 'file' },
  define: {
    'globalThis.__API_BASE_URL__': JSON.stringify(
      process.env.CLIENT_API_BASE_URL || '',
    ),
  },
};

const run = async () => {
  if (watch) {
    const context = await esbuild.context(options);
    await context.watch();
    return;
  }

  await esbuild.build(options);
};

run().catch(() => process.exit(1));
