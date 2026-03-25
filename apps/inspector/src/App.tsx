import { JSX, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';

import { EmptyState } from './components/EmptyState';
import { Filters } from './components/Filters';
import { Header } from './components/Header';
import { RequestDetail } from './components/RequestDetail';
import { RequestList } from './components/RequestList';
import { useRequests } from './hooks/use-requests';
import { useTheme } from './hooks/use-theme';
import { useTunnelInfo } from './hooks/use-tunnel-info';
import type { CapturedRequest, Filters as FilterType } from './types';

export function App(): JSX.Element {
  const { requests, isConnected, clear } = useRequests();
  const tunnelInfo = useTunnelInfo();
  const { theme, toggle: toggleTheme } = useTheme();
  const [selected, setSelected] = useState<CapturedRequest | null>(null);
  const [filters, setFilters] = useState<FilterType>({
    methods: new Set(),
    statusMin: null,
    statusMax: null,
    pathSearch: '',
  });

  const filtered = requests.filter((req) => {
    if (filters.methods.size > 0 && !filters.methods.has(req.method)) return false;
    if (filters.statusMin !== null && req.responseStatusCode < filters.statusMin) return false;
    if (filters.statusMax !== null && req.responseStatusCode > filters.statusMax) return false;
    if (filters.pathSearch && !req.path.toLowerCase().includes(filters.pathSearch.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="flex h-screen flex-col">
      <Header
        tunnelInfo={tunnelInfo}
        isConnected={isConnected}
        requestCount={requests.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        onClear={clear}
      />

      <Filters filters={filters} onChange={setFilters} />

      <Group orientation="horizontal" className="min-h-0 flex-1">
        {/* Left pane - request list */}
        <Panel defaultSize={35} minSize={20}>
          <div className="h-full overflow-y-auto">
            {filtered.length === 0 ? (
              <EmptyState mode={tunnelInfo?.mode ?? 'http'} />
            ) : (
              <RequestList requests={filtered} selected={selected} onSelect={setSelected} />
            )}
          </div>
        </Panel>

        <Separator className="w-1 cursor-col-resize bg-(--border) transition-colors hover:bg-blue-500" />

        {/* Right pane - detail */}
        <Panel defaultSize={65} minSize={30}>
          <div className="h-full overflow-y-auto">
            {selected ? (
              <RequestDetail request={selected} tunnelUrl={tunnelInfo?.publicUrl} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-(--muted-foreground)">
                Select a request to view details
              </div>
            )}
          </div>
        </Panel>
      </Group>
    </div>
  );
}

export default App;
