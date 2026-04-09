import os
import re
import json

def parse_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8-sig', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None
    
    # Style Title
    title_match = re.search(r'#+\s+--(.*?)--', content)
    if not title_match:
        title_match = re.search(r'\*\*(.*?)\*\*', content)
    
    title = title_match.group(1).strip() if title_match else "Estilo Desconocido"
    
    # Description (everything before Lv1)
    # Finding the first "#### Habilidades de Lv"
    split_point = re.search(r'####?\s+Habilidades de Lv', content, re.IGNORECASE)
    if split_point:
        description_raw = content[:split_point.start()]
    else:
        description_raw = content

    description = re.sub(r'#+\s+--.*?--', '', description_raw)
    description = re.sub(r'^.*?Entramos en la.*?\n', '', description, flags=re.IGNORECASE)
    description = re.sub(r'^.*?Siguiendo el orden.*?\n', '', description, flags=re.IGNORECASE)
    description = re.sub(r'^.*?Es el arte de.*?\n', '', description, flags=re.IGNORECASE)
    description = description.strip()

    levels_data = {1: [], 2: [], 3: [], 4: [], 5: []}
    
    # Find all level blocks
    level_blocks = re.split(r'####?\s+Habilidades de Lv(\d)', content, flags=re.IGNORECASE)
    # level_blocks[0] is intro
    # Then it's lvl_num, lvl_content, lvl_num, lvl_content...
    for i in range(1, len(level_blocks), 2):
        lvl = int(level_blocks[i])
        block_content = level_blocks[i+1]
        
        # Find skills in block
        # Look for "X. **Name**:" and capturing until the next skill or end of block
        skills = re.findall(r'(\d+)\.\s+\*\*(.*?)\*\*:(.*?)(?=\s*\d+\.\s+\*\*|$)', block_content, re.S)
        for _, name, body in skills:
            effect = re.search(r'\* \*\*Efecto:\*\* (.*?)(?=\n\s*\*|$)', body, re.S)
            cd = re.search(r'\* \*\*CD:\*\* (.*?)(?=\n\s*\*|$)', body, re.S)
            limit = re.search(r'\* \*\*Limitante:\*\* (.*?)(?=\n\s*\*|$)', body, re.S)
            anti = re.search(r'\* \*\*Anti-Mano Negra:\*\* (.*?)(?=\n\s*\*|$)', body, re.S)
            
            # If CD/Limit/Anti are missing, try generic search or leave blank
            levels_data[lvl].append({
                "level": lvl,
                "name": name.strip(),
                "effect": effect.group(1).strip() if effect else "No descrito.",
                "cd": cd.group(1).strip() if cd else "No especificado.",
                "limit": limit.group(1).strip() if limit else "Sin restricciones visibles.",
                "antiManoNegra": anti.group(1).strip() if anti else "Sin especificaciones."
            })
            
    return {
        "id": re.sub(r'\W+', '-', title.lower()).strip('-'),
        "title": title,
        "description": description,
        "levels": levels_data
    }

mapping = {
    "invocacion": ["texto 4.txt", "texto 5.txt", "texto 6.txt", "texto 7.txt", "texto 8.txt", "texto 9.txt"],
    "elemental": ["texto 31.txt", "texto 37.txt", "texto 38.txt", "texto 35.txt", "texto 15.txt", "texto 16.txt", "texto 17.txt"],
    "control": ["texto.txt", "texto 18.txt", "texto 19.txt", "texto 20.txt", "texto 39.txt", "texto 21.txt", "texto 22.txt", "texto 23.txt", "texto 34.txt", "texto 25.txt", "texto 26.txt", "texto 41.txt"],
    "luz": ["texto 10.txt", "texto 11.txt", "texto 12.txt", "texto 13.txt", "texto 14.txt", "texto 28.txt", "texto 36.txt"],
    "oscuridad": ["texto 29.txt", "texto 40.txt", "texto 27.txt"]
}

base_dir = "./extracted_powers/Poderes/"
grimorio = {
    "invocacion": {"title": "Magia de Invocación", "styles": []},
    "elemental": {"title": "Magia Elemental", "styles": []},
    "control": {"title": "Magia de Control", "styles": []},
    "luz": {"title": "Magia de Luz", "styles": []},
    "oscuridad": {"title": "Magia de Oscuridad", "styles": []}
}

for cat_id, files in mapping.items():
    for f in files:
        if os.path.exists(os.path.join(base_dir, f)):
            res = parse_file(os.path.join(base_dir, f))
            if res: grimorio[cat_id]["styles"].append(res)

final_data = []
for cid, data in grimorio.items():
    final_data.append({"id": cid, "title": data["title"], "styles": data["styles"]})

with open("grimorio_output.json", "w", encoding="utf-8") as f:
    json.dump(final_data, f, indent=2, ensure_ascii=False)
