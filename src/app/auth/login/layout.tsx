'use client'
import SideBar from "@/components/ui/side_nav"
import React from "react";

export default function Layout({children}:{children:React.ReactNode}){
  return(
    <html lang="en" className="no-root-layout">
      <body>
    <div className="flex justify-center h-screen bg-gray-100 font-inter">
          {/* Side Navigation Bar - uses its own internal state */}
          
    
          {/* Main content area, where page content will be rendered */}
            <main className="flex p-25  justify-center items-center h-full">
                
            {children}
          </main>
        </div>
        </body>
        </html>);
}
