import { performance } from 'perf_hooks';

const size = 10000;
const sheets = Array.from({ length: size }, (_, i) => ({ id: `sheet-${i}` }));
const targetId = `sheet-${size - 1}`;

function benchmarkFind() {
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    sheets.find(s => s.id === targetId);
  }
  const end = performance.now();
  return end - start;
}

function benchmarkForLoop() {
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    let found = null;
    for (let j = 0; j < sheets.length; j++) {
      if (sheets[j].id === targetId) {
        found = sheets[j];
        break;
      }
    }
  }
  const end = performance.now();
  return end - start;
}

console.log("find():", benchmarkFind(), "ms");
console.log("for loop:", benchmarkForLoop(), "ms");
