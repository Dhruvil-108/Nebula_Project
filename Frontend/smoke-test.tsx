/* Temporary smoke test — renders each CRM page to static markup to surface runtime crashes. */
// @ts-ignore — provide a Vite-like import.meta.env for the Node runner
(globalThis as any).importMetaEnvShim = true;
// @ts-ignore
if (!(globalThis as any).import) { (globalThis as any).import = {}; }
// @ts-ignore
(globalThis as any).import.meta = (globalThis as any).import.meta || {};
// @ts-ignore
(globalThis as any).import.meta.env = { VITE_API_URL: 'http://localhost:5000/api/v1' };
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LeadsPage } from './src/pages/crm/LeadsPage';
import { PipelinePage } from './src/pages/crm/PipelinePage';
import { ContactsPage } from './src/pages/crm/ContactsPage';
import { CompaniesPage } from './src/pages/crm/CompaniesPage';
import { DealsPage } from './src/pages/crm/DealsPage';
import { Sidebar } from './src/components/shell/Sidebar';

const qc = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
});

const cases: Array<[string, React.ReactNode]> = [
  ['LeadsPage', <LeadsPage />],
  ['PipelinePage', <PipelinePage />],
  ['ContactsPage', <ContactsPage />],
  ['CompaniesPage', <CompaniesPage />],
  ['DealsPage', <DealsPage />],
  ['Sidebar', <MemoryRouter initialEntries={['/dashboard/crm/leads']}><Sidebar collapsed={false} onToggle={() => {}} mobileOpen={false} onMobileClose={() => {}} /></MemoryRouter>],
];

let failures = 0;
for (const [name, tree] of cases) {
  try {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/dashboard/crm/leads']}>{tree}</MemoryRouter>
      </QueryClientProvider>
    );
    console.log(`OK   ${name} (${html.length} chars)`);
  } catch (err) {
    failures++;
    console.error(`FAIL ${name}:`, err && (err as Error).stack || err);
  }
}
if (failures > 0) process.exit(1);
