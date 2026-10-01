import * as fs from 'fs';

const fileContent = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');
const lines = fileContent.split('\n');

for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('<p className=')) {
      console.log(`Line ${i+1}: ${lines[i].trim()}`);
   }
}
