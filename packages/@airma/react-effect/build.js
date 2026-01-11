const path = require('path');

const esbuild = require('esbuild');

const { es5Plugin } = require('esbuild-plugin-es5');

function buildEsm() {
  const outdir = path.join(__dirname, 'esm');
  return esbuild.build({
    entryPoints: ['src/**/*'],
    bundle: false,
    outdir,
    target: 'es2016',
    format: 'esm',
    loader: {}
  });
}

function buildMain() {
  const outfile = path.join(__dirname, 'dist', 'index.js');
  return esbuild.build({
    entryPoints: ['src/index.ts'],
    external:['react', '@airma/react-state', '@airma/react-hooks-core'],
    bundle: true,
    plugins: [es5Plugin()],
    supported: { destructuring: true },
    format: 'cjs',
    target: ['chrome58', 'edge16', 'firefox57', 'node12', 'safari11'],
    outfile
  });
}

async function build() {
  await buildEsm();
  await buildMain();
}

build();
