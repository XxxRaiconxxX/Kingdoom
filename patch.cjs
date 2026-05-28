const fs = require('fs');
let content = fs.readFileSync('../kingdoom-bot/src/handlers/player.js', 'utf8');

const newCode = `    let menu = \`╔════════════════════════════╗
⚔️  *KINGDOOM — REINO DE LAS SOMBRAS*  ⚔️
╚════════════════════════════╝
🏰 _Bienvenido al Compendio de Comandos_


━━━━━━━━━━━━━━━━━━━━━━━━
🗡️ *COMANDOS DEL REINO*
_Para todos los aventureros_
━━━━━━━━━━━━━━━━━━━━━━━━

💰 \\\`!oro [monto] [@user]\\\` — Consulta o envía oro
🧙 \\\`!perfil\\\` — Tu estado de aventurero
🔄 \\\`!cambiarcuenta [nombre]\\\` — Cambia de personaje
🔗 \\\`!vinculo\\\` — Revisa tu enlace con la web
📜 \\\`!nuevo\\\` — Guía corta para empezar
✅ \\\`!verificar <usuario_o_id>\\\` — Vinculate al reino
🏆 \\\`!ranking\\\` — Top semanal de poder
🌍 \\\`!reino\\\` — Resumen público del reino
💎 \\\`!ricos\\\` — Las mayores fortunas
🛒 \\\`!mercado [nombre]\\\` — Explora el mercado
🗡️ \\\`!item <nombre>\\\` — Ficha de un objeto
🎯 \\\`!mision [nombre]\\\` — Lista o inspecciona misiones
🎪 \\\`!evento [nombre]\\\` — Lista o inspecciona eventos
🎲 \\\`!dados <monto>\\\` — Apuesta oro en los dados
🔮 \\\`!oraculo <pregunta>\\\` — Consulta al Oráculo
❓ \\\`!ayuda\\\` — Abre este compendio\`;

    if (isSenderOwner) {
      menu += \`\\n\\n\\n━━━━━━━━━━━━━━━━━━━━━━━━\\n\` +
              \`👑 *COMANDOS DEL SOBERANO*\\n\` +
              \`_Exclusivo para el Owner / Creador_\\n\` +
              \`━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n\` +
              \`🛡️ \\\\!add admin <objetivo>\\\\ — Otorga admin\\n\` +
              \`🚫 \\\\!remove admin <objetivo>\\\\ — Revoca admin\\n\` +
              \`📋 \\\\!registrar <nombre> [oro]\\\\ — Nuevo jugador\\n\` +
              \`➕ \\\\!grant <objetivo> <monto>\\\\ — Entrega oro\\n\` +
              \`➖ \\\\!quitar <objetivo> <monto>\\\\ — Descuenta oro\\n\` +
              \`⛓️ \\\\!ban <objetivo>\\\\ — Destierra un jugador\\n\` +
              \`📲 \\\\!verificarnumero <objetivo>\\\\ — Vinculación forzada\\n\` +
              \`📊 \\\\!stats\\\\ — Resumen general del reino\\n\` +
              \`📜 \\\\!censo\\\\ — Lista total de guerreros (CSV)\\n\` +
              \`⏳ \\\\!pendientes\\\\ — Jugadores sin registrar\\n\` +
              \`🧹 \\\\!purga\\\\ — Expulsa inactivos\\n\` +
              \`🗺️ \\\\!grupos\\\\ — Grupos activos vinculados\\n\` +
              \`🆔 \\\\!groupid\\\\ — ID de WhatsApp del grupo\\n\` +
              \`🔍 \\\\!data <query>\\\\ — Consulta SQL en la BD\\n\` +
              \`⚙️ \\\\!staff\\\\ — Vista operativa del staff\\n\` +
              \`📖 \\\\!bitacora\\\\ — Últimas acciones del consejo\\n\` +
              \`👑 \\\\!admin\\\\ — Abre el menú soberano\`.replace(/\\\\/g, '\`');
    } else if (isSenderAdmin) {
      menu += \`\\n\\n\\n━━━━━━━━━━━━━━━━━━━━━━━━\\n\` +
              \`🛡️ *COMANDOS DE ADMINISTRADOR*\\n\` +
              \`_Gestión y Moderación_\\n\` +
              \`━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n\` +
              \`📋 \\\\!registrar <nombre> [oro]\\\\ — Nuevo jugador\\n\` +
              \`➕ \\\\!grant <objetivo> <monto>\\\\ — Entrega oro\\n\` +
              \`➖ \\\\!quitar <objetivo> <monto>\\\\ — Descuenta oro\\n\` +
              \`⛓️ \\\\!ban <objetivo>\\\\ — Destierra un jugador\\n\` +
              \`📲 \\\\!verificarnumero <objetivo>\\\\ — Vinculación forzada\\n\` +
              \`📊 \\\\!stats\\\\ — Resumen general del reino\\n\` +
              \`📜 \\\\!censo\\\\ — Lista total de guerreros (CSV)\\n\` +
              \`⏳ \\\\!pendientes\\\\ — Jugadores sin registrar\\n\` +
              \`🧹 \\\\!purga\\\\ — Expulsa inactivos\\n\` +
              \`🗺️ \\\\!grupos\\\\ — Grupos activos vinculados\\n\` +
              \`⚙️ \\\\!staff\\\\ — Vista operativa del staff\\n\` +
              \`📖 \\\\!bitacora\\\\ — Últimas acciones del consejo\\n\` +
              \`👑 \\\\!admin\\\\ — Abre el menú admin\`.replace(/\\\\/g, '\`');
    }

    menu += \`\\n\\n━━━━━━━━━━━━━━━━━━━━━━━━\\n\` +
            \`_🏰 Que el oro fluya y el reino prospere_ ⚔️\\n\` +
            \`━━━━━━━━━━━━━━━━━━━━━━━━\`;

    let identityName = 'Jugador';
    if (isSenderOwner) identityName = '👑 Señor Owner';
    else if (isSenderAdmin) identityName = '🛡️ Administrador';

    menu += \`\\n\\n*Identidad:* \` + identityName + \` | *Tel:* \` + normalizePhone(sender);

    if (!player) {
      if (isSenderOwner || isSenderAdmin) {
        menu += \`\\n⚠️ Aun no tienes personaje forjado. Usa \\\`!registrar <tu_nombre> [oro]\\\`.\`;
      } else {
        menu += \`\\n⚠️ Aun no estas registrado. Pidele al staff que use \\\`!registrar\\\` para darte entrada.\`;
      }
    }

    return menu;
`;

const startIdx = content.indexOf('    let helpSections = [');
const endIdxStr = "return heraldCard('Compendio del Heraldo', helpSections, { icon: '📜' });";
const endIdx = content.indexOf(endIdxStr);

if (startIdx !== -1 && endIdx !== -1) {
  const finalContent = content.substring(0, startIdx) + newCode + content.substring(endIdx + endIdxStr.length);
  fs.writeFileSync('../kingdoom-bot/src/handlers/player.js', finalContent);
  console.log('Replaced successfully.');
} else {
  console.log('Target string not found.');
}
