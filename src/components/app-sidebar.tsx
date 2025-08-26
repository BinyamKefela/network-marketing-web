"use client"

import * as React from "react"
import {
  Antenna,
  AntennaIcon,
  AudioWaveform,
  BookOpen,
  Bot,
  BoxIcon,
  Command,
  CreditCardIcon,
  Frame,
  GalleryVerticalEnd,
  LogOutIcon,
  LucidePieChart,
  Map,
  PersonStanding,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavNetworking } from "./nav-networking"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

// This is sample data.
const data = {
  user: {
    name: "Binyam",
    email: "binyamkefela@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "ANT Inc",
      logo: AntennaIcon,
      plan: "Enterprise",
    },
    {
      name: "ANT Inc",
      logo: Antenna,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "promoters",
      url: "#",
      icon: SquareTerminal,
      //isActive: false,
      
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  settings: [
    {name:"Dashboard",
      url:"/dashboard",
      icon:LucidePieChart
    },
    {name:"users",
      url:"/dashboard/users",
      icon:PersonStanding
    },
    {name:"staff",
      url:"/dashboard/staff",
      icon:PersonStanding
    },
    {
      name: "promoters",
      url: "/auth/login",
      icon: Frame,
    },
    {name:"products",
      url:"#",
      icon:BoxIcon
    },
    {
      name: "Sales",
      url: "#",
      icon: PieChart,
    },
    {name:"transactions",
      url:"#",
      icon:CreditCardIcon
    },
    {
      name: "commisions",
      url: "#",
      icon: Map,
    },
    {
      name:"commissions configuration",
      url: "#",
      icon: GalleryVerticalEnd,
    },
    {
      name: "housing",
      url: "#",
      icon: AntennaIcon,
    },
    {name:"logout",
      url:"#",
      icon:LogOutIcon,
      onClick: () => {
        Cookies.remove("token")
        window.location.href = "/auth/login"
      }
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        
        <NavNetworking items={data.settings}/>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
