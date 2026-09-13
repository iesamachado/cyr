const fs = require('fs');

// We have the array in tasks.js. We can regex all objects.
let content = fs.readFileSync('/media/disco/dades/src/ComputaciónYRobotica/js/common/tasks.js', 'utf8');

// match all id: '...', title: '...', block: '...', crit: '...', description: `...`
const regex = /\{\s*id:\s*'([^']+)',\s*title:\s*'([^']+)',\s*block:\s*'([^']+)',\s*crit:\s*'([^']*)',\s*description:\s*`([\s\S]*?)`\s*\}/g;

let tasks = [];
let match;
while ((match = regex.exec(content)) !== null) {
  tasks.push({
    oldId: match[1],
    title: match[2],
    block: match[3],
    crit: match[4],
    desc: match[5]
  });
}

// Sort by block, then by game or not, then by old ID
tasks.sort((a, b) => {
  let bA = parseInt(a.block);
  let bB = parseInt(b.block);
  if (bA !== bB) return bA - bB;
  
  let gameA = a.title.includes('Juego:') ? 1 : 0;
  let gameB = b.title.includes('Juego:') ? 1 : 0;
  if (gameA !== gameB) return gameA - gameB;
  
  let isNumA = !isNaN(a.oldId);
  let isNumB = !isNaN(b.oldId);
  
  if (isNumA && isNumB) return parseInt(a.oldId) - parseInt(b.oldId);
  if (isNumA) return -1;
  if (isNumB) return 1;
  return a.oldId.localeCompare(b.oldId);
});

let out = "export const CLASSROOM_TASKS = [\n";
tasks.forEach((t, i) => {
  let comma = i < tasks.length - 1 ? "," : "";
  out += `  {
    id: '${i + 1}', title: '${t.title}', block: '${t.block}', crit: '${t.crit}',
    description: \`${t.desc}\`
  }${comma}\n`;
});
out += "];\n";

fs.writeFileSync('/media/disco/dades/src/ComputaciónYRobotica/js/common/tasks.js', out);
