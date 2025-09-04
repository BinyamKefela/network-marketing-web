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
  Package2Icon,
  PenBoxIcon,
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
      name: "Fast network Marketing",
      logo: AntennaIcon,
      plan: "Enterprise",
    },
    {
      name: "Fast network Marketing",
      logo: Antenna,
      plan: "Startup",
    },
    {
      name: "Fast network Marketing",
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
    {name:"configuration",
      url:"/dashboard/configuration",
      icon:Settings2
    },
    {name:"training",
      url:"/dashboard/training",
      icon:PenBoxIcon
    },
    {
      name: "package",
      url: "/dashboard/package",
      icon: Package2Icon,
    },
    {
      name: "category",
      url: "/dashboard/category",
      icon: Frame,
    },
    {name:"products",
      url:"/dashboard/products",
      icon:BoxIcon
    },
    {
      name:"commissions configuration",
      url: "/dashboard/commission_configuration",
      icon: GalleryVerticalEnd,
    },
    {
      name:"unilevel configuration",
      url: "/dashboard/unilevel_configuration",
      icon: GalleryVerticalEnd,
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
