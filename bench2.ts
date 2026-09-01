import { performance } from 'perf_hooks';

const size = 2;
const sheets = Array.from({ length: size }, (_, i) => ({ id: `sheet-${i}` }));
const targetId = `sheet-${size - 1}`;

function benchmarkFind() {
  const start = performance.now();
  for (let i = 0; i < 1_000_000; i++) {
    sheets.find(s => s.id === targetId);
  }
  return performance.now() - start;
}

function benchmarkForLoop() {
  const start = performance.now();
  for (let i = 0; i < 1_000_000; i++) {
    let found = null;
    for (let j = 0; j < sheets.length; j++) {
      if (sheets[j].id === targetId) {
        found = sheets[j];
        break;
      }
    }
  }
  return performance.now() - start;
}

console.log("N=2 find():", benchmarkFind(), "ms");
console.log("N=2 for loop:", benchmarkForLoop(), "ms");
