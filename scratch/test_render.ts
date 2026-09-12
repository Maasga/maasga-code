import { AdminProduitsPage } from '../src/pages/admin.js';

try {
  const html = (AdminProduitsPage({ success: undefined, deleted: undefined }) as any).toString();
  const lines = html.split('\n');
  console.log(`Total lines in rendered HTML: ${lines.length}`);
  
  lines.forEach((line: string, index: number) => {
    const lineNum = index + 1;
    if (lineNum >= 125 && lineNum <= 165) {
      console.log(`${lineNum}: ${line}`);
    }
  });
} catch(e) {
  console.error('Render error:', e);
}
