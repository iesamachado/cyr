const fs = require('fs');

let content = fs.readFileSync('/media/disco/dades/src/ComputaciónYRobotica/js/common/tasks.js', 'utf8');
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

let out = "export const CLASSROOM_TASKS = [\n";
tasks.forEach((t, i) => {
  let newId = String(i); // Now it starts at 0!
  let crit = t.crit;
  
  if (t.title === 'Cuéntame quién eres') {
    crit = ''; // Remove criteria
  }
  
  let comma = i < tasks.length - 1 ? "," : "";
  out += `  {
    id: '${newId}', title: '${t.title}', block: '${t.block}', crit: '${crit}',
    description: \`${t.desc}\`
  }${comma}\n`;
});
out += "];\n";

fs.writeFileSync('/media/disco/dades/src/ComputaciónYRobotica/js/common/tasks.js', out);
