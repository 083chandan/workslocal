import { DocsSidebar } from '@/components/DocsSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen className="min-h-0! flex-1 pt-16">
      <DocsSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2 px-4 pt-4 md:hidden">
          <SidebarTrigger />
          <span className="font-mono text-xs tracking-widest text-muted uppercase">Docs</span>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
