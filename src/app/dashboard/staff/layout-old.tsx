import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { Children } from "react";


export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {  
  return (
<ThemeProvider 
        attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange>
        
        <SidebarProvider>
          <AppSidebar/>
          <main>
            <SidebarTrigger />
            <ModeToggle/>
            {children}
            </main>

            </SidebarProvider>
            </ThemeProvider >);
}