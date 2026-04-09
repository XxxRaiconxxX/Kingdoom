import json

with open('grimorio_final.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# The file needs to be a TypeScript file with an export
header = """import { GrimoireCategory } from '../types';

export const GRIMOIRE_DATA: GrimoireCategory[] = """

footer = ";"

with open('src/data/grimorio.ts', 'w', encoding='utf-8') as f:
    f.write(header)
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write(footer)
