"use client"

import * as React from "react"
import {
  Antenna,
  AntennaIcon,
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
    {
      name: "category",
      url: "/dashboard/category",
      icon: Frame,
    },
    {name:"products",
      url:"/dashboard/products",
      icon:BoxIcon
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
    {name:"configuration",
      url:"/dashboard/configuration",
      icon:Settings2
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
      name: "tree setting",
      url: "/dashboard/tree_setting",
      icon: PieChart,
    },
    {
      name: "MLM settings",
      url: "/dashboard/mlm_settings",
      icon: AntennaIcon,
    },
    {
      name: "sales",
      url: "/dashboard/sales",
      icon: PieChart,
    },
    {name:"transactions",
      url:"/dashboard/transaction",
      icon:CreditCardIcon
    },
    {
      name: "commisions",
      url: "/dashboard/commissions",
      icon: Map,
    },
    
    {
      name: "housing",
      url: "/dashboard/housing",
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
