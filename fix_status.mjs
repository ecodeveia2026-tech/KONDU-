import fs from 'fs';
import path from 'path';

const files = [
  'src/lib/types.ts',
  'src/lib/services/orderService.ts',
  'src/pages/admin/AdminDashboard.tsx',
  'src/pages/business/BusinessDashboard.tsx',
  'src/pages/client/ClientDashboard.tsx',
  'src/pages/provider/ProviderDashboard.tsx'
];

const basePath = 'C:/Users/DELL/Desktop/KONDU';

files.forEach(file => {
  const filePath = path.join(basePath, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (file === 'src/lib/types.ts') {
    content = content.replace(
      /export type OrderStatus = .*/g,
      "export type OrderStatus = 'CREATED' | 'SEARCHING' | 'PROVIDER_ACCEPTED' | 'ARRIVING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';"
    );
  } else {
    // Replace all occurrences in other files
    content = content.replace(/'created'/g, "'CREATED'");
    content = content.replace(/'searching'/g, "'SEARCHING'");
    content = content.replace(/'accepted'/g, "'PROVIDER_ACCEPTED'");
    content = content.replace(/'arriving'/g, "'ARRIVING'");
    content = content.replace(/'in_progress'/g, "'IN_PROGRESS'");
    content = content.replace(/'completed'/g, "'COMPLETED'");
    content = content.replace(/'cancelled'/g, "'CANCELLED'");
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
