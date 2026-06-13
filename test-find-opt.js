const sheets = Array.from({ length: 100000 }, (_, i) => ({ id: i }));

console.time("find");
for (let i = 0; i < 1000; i++) {
  sheets.find(s => s.id === 99999);
}
console.timeEnd("find");

console.time("for-loop");
for (let i = 0; i < 1000; i++) {
  let found = undefined;
  for (let j = 0; j < sheets.length; j++) {
    if (sheets[j].id === 99999) {
      found = sheets[j];
      break;
    }
  }
}
console.timeEnd("for-loop");

console.time("map");
const map = new Map();
for(let i=0; i<sheets.length; i++) {
  map.set(sheets[i].id, sheets[i]);
}
for (let i = 0; i < 1000; i++) {
  map.get(99999);
}
console.timeEnd("map");
