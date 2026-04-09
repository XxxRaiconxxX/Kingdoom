import os
import re
import json

def parse_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8-sig', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        return None
    
    # Title
    t_match = re.search(r'#+\s+--(.*?)--', content)
    title = t_match.group(1).strip() if t_match else os.path.basename(filepath)
    
    # Levels
    levels = {1: [], 2: [], 3: [], 4: [], 5: []}
    
    # Improved regex for levels
    lvl_splits = re.split(r'#+\s+Habilidades de Lv(\d)', content, flags=re.IGNORECASE)
    for i in range(1, len(lvl_splits), 2):
        lvl_num = int(lvl_splits[i])
        lvl_text = lvl_splits[i+1]
        
        # Skills: "X. **Name**:"
        skill_matches = re.finditer(r'(\d+)\.\s+\*\*(.*?)\*\*(?::|:?)(.*?)(?=\d+\.\s+\*\*|$)', lvl_text, re.S)
        for s in skill_matches:
            name = s.group(2).strip()
            body = s.group(3).strip()
            
            # Attributes
            effect = re.search(r'Efecto:\*\* (.*?)(?:\n|$)', body)
            cd = re.search(r'CD:\*\* (.*?)(?:\n|$)', body)
            limit = re.search(r'Limitante:\*\* (.*?)(?:\n|$)', body)
            anti = re.search(r'Anti-Mano Negra:\*\* (.*?)(?:\n|$)', body)
            
            levels[lvl_num].append({
                "level": lvl_num,
                "name": name,
                "effect": effect.group(1).strip() if effect else "Efecto no detallado.",
                "cd": cd.group(1).strip() if cd else "N/A",
                "limit": limit.group(1).strip() if limit else "Sin restricciones.",
                "antiManoNegra": anti.group(1).strip() if anti else "Sin especificar."
            })
            
    # Description
    desc = re.split(r'#+\s+Habilidades', content, flags=re.IGNORECASE)[0]
    desc = re.sub(r'#+\s+--.*?--', '', desc).strip()

    return {
        "id": re.sub(r'\W+', '-', title.lower()).strip('-'),
        "title": title,
        "description": desc,
        "levels": levels
    }

mapping = {
    "invocacion": ["texto 4.txt", "texto 5.txt", "texto 6.txt", "texto 7.txt", "texto 8.txt", "texto 9.txt"],
    "elemental": ["texto 31.txt", "texto 37.txt", "texto 38.txt", "texto 35.txt", "texto 15.txt", "texto 16.txt", "texto 17.txt"],
    "control": ["texto.txt", "texto 18.txt", "texto 19.txt", "texto 20.txt", "texto 39.txt", "texto 21.txt", "texto 22.txt", "texto 23.txt", "texto 34.txt", "texto 25.txt", "texto 26.txt", "texto 41.txt"],
    "luz": ["texto 10.txt", "texto 11.txt", "texto 12.txt", "texto 13.txt", "texto 14.txt", "texto 28.txt", "texto 36.txt"],
    "oscuridad": ["texto 29.txt", "texto 40.txt", "texto 27.txt"]
}

base_dir = "./extracted_powers/Poderes/"
final = []
for cid, files in mapping.items():
    styles = []
    for f in files:
        p = os.path.join(base_dir, f)
        if os.path.exists(p):
            res = parse_file(p)
            if res: styles.append(res)
    final.append({"id": cid, "title": cid.capitalize(), "styles": styles})

with open("grimorio_final.json", "w", encoding="utf-8") as f:
    json.dump(final, f, indent=2, ensure_ascii=False)
