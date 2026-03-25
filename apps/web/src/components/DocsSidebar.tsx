'use client';

import { BookOpen, Monitor, Radar, Terminal } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

const sections = [
  {
    label: 'Getting Started',
    items: [{ title: 'Introduction', href: '/docs/getting-started', icon: BookOpen }],
  },
  {
    label: 'CLI',
    items: [{ title: 'CLI Reference', href: '/docs/cli', icon: Terminal }],
  },
  {
    label: 'Catch Mode',
    items: [{ title: 'Catch Mode', href: '/docs/catch-mode', icon: Radar }],
  },
  {
    label: 'Web Inspector',
    items: [{ title: 'Web Inspector', href: '/docs/web-inspector', icon: Monitor }],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar
      collapsible="offcanvas"
      className="top-16 h-[calc(100svh-4rem)] overflow-y-auto border-outline"
    >
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="font-mono text-xs tracking-widest uppercase">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className="data-[active=true]:text-primary"
                    >
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
