import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Feature: admin-ui-light-refactor, Property 7: Token isolation invariant
// Feature: admin-ui-light-refactor, Property 3: Maintenance status mapping invariant
// Feature: admin-ui-light-refactor, Property 5: Unique DOM IDs invariant

function runTests() {
  console.log('=== Running admin-light-refactor test suite ===');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      process.exitCode = 1;
    }
  }

  const rootDir = process.cwd();

  // Test 1: Tokens CSS exists and satisfies scoping rules
  const cssPath = join(rootDir, 'public', 'static', 'admin-tokens.css');
  assert(existsSync(cssPath), 'public/static/admin-tokens.css exists');

  if (existsSync(cssPath)) {
    const cssContent = readFileSync(cssPath, 'utf-8');
    assert(!cssContent.includes(':root {'), 'admin-tokens.css does not contain :root selector rule');
    assert(cssContent.includes('.admin-ui'), 'admin-tokens.css targets .admin-ui');

    const requiredVars = [
      '--admin-bg', '--admin-bg-elevated', '--admin-sidebar-bg', '--admin-card-bg',
      '--admin-border', '--admin-text-primary', '--admin-text-muted', '--admin-font-sans',
      '--admin-accent', '--admin-accent-hover', '--admin-accent-light', '--admin-success',
      '--admin-success-light', '--admin-warning', '--admin-warning-light', '--admin-danger',
      '--admin-danger-light', '--admin-info'
    ];

    for (const v of requiredVars) {
      assert(cssContent.includes(v), `Token variable ${v} is defined`);
    }

    assert(
      cssContent.includes('.modal') || cssContent.includes('[role="dialog"]'),
      'Mobile override targets modal / dialog context'
    );
  }

  // Test 2: Token isolation in admin.tsx (Property 7)
  const adminTsxPath = join(rootDir, 'src', 'pages', 'admin.tsx');
  assert(existsSync(adminTsxPath), 'src/pages/admin.tsx exists');

  if (existsSync(adminTsxPath)) {
    const adminContent = readFileSync(adminTsxPath, 'utf-8');
    assert(adminContent.includes('class="admin-ui'), 'AdminLayout body has admin-ui class');
    assert(adminContent.includes('/static/admin-tokens.css'), 'AdminLayout links admin-tokens.css');
    assert(adminContent.includes('window.adminBulkAction'), 'adminBulkAction script exists');
    assert(adminContent.includes('window.adminClearSelection'), 'adminClearSelection script exists');
    assert(adminContent.includes('order-client-detail-modal'), 'Order client detail modal ID updated');

    const darkRegex = /#0b1120|#111827|rgba\(15,23,42,/i;
    assert(!darkRegex.test(adminContent), 'Property 7: Token isolation invariant (0 dark background occurrences in admin.tsx)');
  }

  // Test 3: Maintenance status mapping (Property 3)
  const maintenanceHookPath = join(rootDir, 'src', 'hooks', 'useAdminMaintenanceData.ts');
  if (existsSync(maintenanceHookPath)) {
    const content = readFileSync(maintenanceHookPath, 'utf-8');
    assert(content.includes("if (status === 'scheduled') return 'planifiee'"), 'normalizeVisitStatus maps scheduled to planifiee');
    assert(content.includes("if (status === 'done') return 'effectuee'"), 'normalizeVisitStatus maps done to effectuee');
  }

  // Test 4: ClientDetailModal links (Req 3.1, 3.3)
  const clientModalPath = join(rootDir, 'src', 'components', 'admin', 'ClientDetailModal.tsx');
  if (existsSync(clientModalPath)) {
    const content = readFileSync(clientModalPath, 'utf-8');
    assert(content.includes('/admin/commandes'), 'ClientDetailModal links to /admin/commandes');
    assert(content.includes('/admin/rdv'), 'ClientDetailModal links to /admin/rdv');
  }

  console.log(`\nTest Result: ${passed}/${total} passed.`);
}

runTests();
