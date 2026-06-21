import { resolveRemoteVisualReference } from './api/admin/_visualReference.js';

async function run() {
  try {
    const res = await resolveRemoteVisualReference('https://es.pinterest.com/pin/995436323900148775/');
    console.log(res);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
run();
