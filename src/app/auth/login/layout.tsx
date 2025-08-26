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
            <main className="flex p-20  justify-center items-center h-full">
              <div className="border-2 border-gray-600  border-solid rounded-lg shadow-lg p-6 bg-white w-full max-w-4xl">
                
            {children}
            </div>
          </main>
        </div>
        </body>
        </html>);
}
