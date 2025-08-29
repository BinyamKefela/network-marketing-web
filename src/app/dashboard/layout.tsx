"use client"; // <--- Add this line

import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { LogOutIcon } from "lucide-react";
import { useRouter } from 'next/navigation';
import { logoutUser } from "../auth/login/api";


export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  const handleLogout = () => {
    logoutUser();
    // Redirect the user after they have been logged out.
    router.push('/auth/login');
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange>
      <SidebarProvider>
        <AppSidebar />
        <main>
          <SidebarTrigger />
          <ModeToggle />
          <div onClick={handleLogout}>
            <LogOutIcon />
          </div>
          <div className="flex flex-col items-center justify-center">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}