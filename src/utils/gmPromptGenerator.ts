import gmPromptRaw from '../../docs/gm-system-prompt.md?raw';
import type { PlayerAccount, RealmMission, RealmMissionClaim } from '../types';

export function generateMissionGmPrompt(
  mission: RealmMission,
  players: PlayerAccount[],
  claims: RealmMissionClaim[]
): string {
  let prompt = gmPromptRaw;

  prompt += '\n\n---\n\n## CONFIGURACIÓN DE LA MISIÓN ACTUAL\n\n';
  prompt += `A continuación se presentan los datos de la misión seleccionada. Úsalos para rellenar la Sección 6 y empezar el rol.\n\n`;

  prompt += `### 6.1 — BRIEFING DE MISIÓN\n\n`;
  prompt += `- **Nombre de la misión:** ${mission.title}\n`;
  prompt += `- **Escenario:** (Define un escenario acorde a la descripción: ${mission.description.split('\n')[0].slice(0, 50)}...)\n`;
  prompt += `- **Objetivo principal:** ${mission.description}\n`;
  
  if (mission.gmConfig?.objetivosJugadores && mission.gmConfig.objetivosJugadores.length > 0) {
    prompt += `- **Objetivos adicionales de los Jugadores:**\n`;
    mission.gmConfig.objetivosJugadores.forEach(obj => {
      prompt += `  - ${obj}\n`;
    });
  }

  if (mission.gmConfig?.objetivosGM && mission.gmConfig.objetivosGM.length > 0) {
    prompt += `- **Objetivo oculto/GM:**\n`;
    mission.gmConfig.objetivosGM.forEach(obj => {
      prompt += `  - ${obj}\n`;
    });
  }

  if (mission.gmConfig?.condicionesVictoria && mission.gmConfig.condicionesVictoria.length > 0) {
    prompt += `- **Condiciones de victoria:**\n`;
    mission.gmConfig.condicionesVictoria.forEach(cond => {
      prompt += `  - ${cond}\n`;
    });
  }

  if (mission.gmConfig?.condicionesDerrota && mission.gmConfig.condicionesDerrota.length > 0) {
    prompt += `- **Condiciones de derrota:**\n`;
    mission.gmConfig.condicionesDerrota.forEach(cond => {
      prompt += `  - ${cond}\n`;
    });
  }

  prompt += `- **Modo GM:** ${mission.gmConfig?.modoMision ?? 'exploracion'}\n`;
  prompt += `- **Escalada permitida:** Puede usar NPCs hostiles: ${mission.gmConfig?.escalada?.puedeUsarNpcHostil ? 'Sí' : 'No'}. Puede derivar en combate: ${mission.gmConfig?.escalada?.puedeEscalarACombate ? 'Sí' : 'No'}.\n\n`;

  prompt += `### 6.2 — FICHAS DE JUGADORES\n\n`;
  
  if (claims.length === 0) {
    prompt += `*Aún no hay jugadores registrados en esta misión.*\n\n`;
  } else {
    const playersMap = new Map(players.map(p => [p.id, p]));
    claims.forEach(claim => {
      const player = playersMap.get(claim.playerId);
      prompt += `- **Nombre del personaje:** ${claim.playerName}\n`;
      if (player) {
        prompt += `- **Estado Inicial (Oro):** ${player.gold} monedas\n`;
      }
      prompt += `- **Clase/Rol:** (Solicitar al jugador si no está claro)\n`;
      prompt += `- **Habilidades activas:** (El jugador debe enviarlas antes de iniciar)\n`;
      prompt += `- **Ítems en inventario:** (El jugador debe enviarlos antes de iniciar)\n\n`;
    });
  }

  prompt += `### 6.3 — FICHAS DE ENEMIGOS / NPCs\n\n`;
  if (mission.gmConfig?.npcs && mission.gmConfig.npcs.length > 0) {
    mission.gmConfig.npcs.forEach(npc => {
      prompt += `- **Nombre:** ${npc.name}\n`;
      prompt += `- **Tipo (Rol):** ${npc.role}\n`;
      if (npc.behaviorNotes) {
        prompt += `- **Comportamiento / Lógica:** ${npc.behaviorNotes}\n`;
      }
      if (npc.allowedMagic && npc.allowedMagic.length > 0) {
        prompt += `- **Magia Permitida:**\n`;
        npc.allowedMagic.forEach(magic => {
          prompt += `  - ${magic.title} (${magic.categoryTitle}): ${magic.abilityNames.slice(0, 3).join(', ')}...\n`;
        });
      }
      prompt += '\n';
    });
  } else {
    prompt += `*No hay NPCs registrados formalmente para esta misión. Genera los que sean necesarios según el Modo GM y Escalada permitida.*\n\n`;
  }

  prompt += `\n**Instrucciones finales:** Inicia el rol presentando el Turno 1 con la ambientación.`;

  return prompt;
}
