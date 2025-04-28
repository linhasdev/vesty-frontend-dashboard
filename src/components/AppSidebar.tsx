import type * as React from "react"
import { BookOpen, Calendar, Home, LineChart, Play, Settings, User, ClipboardCheck, BookMarked } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "./ui/sidebar"

// Navigation data with the three requested sections
const navigationData = [
  {
    title: "Estudar",
    items: [
      {
        title: "Continuar assistindo",
        url: "/continue-watching",
        icon: Play,
      },
      {
        title: "Homepage",
        url: "/",
        icon: Home,
      },
    ],
  },
  {
    title: "Planejamento",
    items: [
      {
        title: "Suas Aulas",
        url: "/plan",
        icon: BookOpen,
      },
      {
        title: "Calendário",
        url: "/plan?view=calendar",
        icon: Calendar,
      },
      {
        title: "Matérias",
        url: "/plan?view=subjects",
        icon: BookMarked,
      },
      {
        title: "Progresso",
        url: "/progress",
        icon: LineChart,
      },
    ],
  },
  {
    title: "Conta",
    items: [
      {
        title: "Perfil",
        url: "/profile",
        icon: User,
      },
      {
        title: "Configurações",
        url: "/settings",
        icon: Settings,
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarContent>
        {navigationData.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
} 