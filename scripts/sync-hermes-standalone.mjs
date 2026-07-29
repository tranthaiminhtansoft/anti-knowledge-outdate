import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const htmlPath = path.join(root, 'public/hermes-agent-human-body.html');
const controllerPath = path.join(root, 'src/HermesUseCases.tsx');
const dataPath = path.join(root, 'src/hermes-usecases-data.json');

const [html, controllerSource, dataSource] = await Promise.all([
  fs.readFile(htmlPath, 'utf8'),
  fs.readFile(controllerPath, 'utf8'),
  fs.readFile(dataPath, 'utf8'),
]);

const useCases = JSON.parse(dataSource);
const serializedUseCases = JSON.stringify(useCases).replaceAll('<', '\\u003c');
const blockStartMarker = "        const tabPanel = document.createElement('div');";
const blockEndMarker = "        select('gateway');";
const blockStart = controllerSource.indexOf(blockStartMarker);
const blockEnd = controllerSource.indexOf(blockEndMarker, blockStart);

if (blockStart < 0 || blockEnd < 0) {
  throw new Error('Không tìm thấy controller block trong HermesUseCases.tsx');
}

const controllerBlock = controllerSource.slice(
  blockStart,
  blockEnd + blockEndMarker.length,
);

const prelude = `
const useCases = ${serializedUseCases};
const runtime = document.documentElement;
const sourceMain = document.querySelector('main.wrap');
const tabs = [...runtime.querySelectorAll('.tab')];
const paths = [...runtime.querySelectorAll('.route')];
const actors = [...runtime.querySelectorAll('.actor')];
const active = runtime.querySelector('#active-route');
const pulse = runtime.querySelector('#traffic');
const stage = runtime.querySelector('#stage');
const caseHead = runtime.querySelector('.case-head');
const diagramShell = runtime.querySelector('.diagram-shell');
const timeline = runtime.querySelector('#timeline');
const pause = runtime.querySelector('#pause');
const responseTyping = runtime.querySelector('#response-typing');
const responseDots = runtime.querySelector('#response-dots');
const assemblyBoard = runtime.querySelector('#assembly-board');
const assemblyTitle = runtime.querySelector('#assembly-title');
const assemblyCurrent = runtime.querySelector('#assembly-current');
const assemblyNeedCopy = runtime.querySelector('[data-assembly-tier="need"] .row-copy');
const assemblyGainCopy = runtime.querySelector('[data-assembly-tier="gain"] .row-copy');
const assemblySystemCopy = runtime.querySelector('[data-assembly-tier="system"] .row-copy');
const assemblyMessagesCopy = runtime.querySelector('[data-assembly-tier="messages"] .row-copy');
const assemblyToolsCopy = runtime.querySelector('[data-assembly-tier="tools"] .row-copy');
const assemblyRows = [...runtime.querySelectorAll('[data-assembly-tier]')];
if (!sourceMain || !active || !pulse || !stage || !caseHead || !diagramShell || !timeline || !pause || !responseTyping || !responseDots || !assemblyBoard || !assemblyTitle || !assemblyCurrent || !assemblyNeedCopy || !assemblyGainCopy || !assemblySystemCopy || !assemblyMessagesCopy || !assemblyToolsCopy) {
  throw new Error('Thiếu thành phần tương tác standalone');
}
const cleanups = [];
let timer;
let raf;
const stopMotion = () => {
  if (timer !== undefined) window.clearTimeout(timer);
  if (raf !== undefined) window.cancelAnimationFrame(raf);
  timer = undefined;
  raf = undefined;
};
`;

const generated = ts.transpileModule(`(() => {${prelude}\n${controllerBlock}\n})();`, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.None,
    removeComments: true,
  },
}).outputText.trim();
if (generated.toLowerCase().includes('</script')) {
  throw new Error('Controller sinh ra chứa closing script tag không an toàn');
}

const script = `<script data-generated-from="src/HermesUseCases.tsx+src/hermes-usecases-data.json">\n${generated}\n</script>`;
const scriptPattern = /<script\s+data-generated-from="src\/HermesUseCases\.tsx\+src\/hermes-usecases-data\.json">[\s\S]*?<\/script>/g;
const scripts = [...html.matchAll(scriptPattern)];
if (scripts.length !== 1 || scripts[0].index === undefined) {
  throw new Error(`Cần đúng một generated script marker, tìm thấy ${scripts.length}`);
}
const currentScript = scripts[0];

const nextHtml = `${html.slice(0, currentScript.index)}${script}${html.slice(currentScript.index + currentScript[0].length)}`;
if (checkOnly) {
  if (nextHtml !== html) {
    throw new Error('Standalone bị lệch nguồn; chạy npm run sync:hermes-standalone');
  }
} else {
  await fs.writeFile(htmlPath, nextHtml);
}

process.stdout.write(`${checkOnly ? 'Verified' : 'Synced'} standalone: ${Object.entries(useCases).map(([name, item]) => `${name}=${item.edges.length}`).join(', ')}\n`);
