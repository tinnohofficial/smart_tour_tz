"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Calendar, CreditCard, LogOut, Star, User, Menu, X, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // Add this import
import { cn } from "@/lib/utils"
import { useLayoutStore } from "./layoutStore"

export default function TourGuideLayout({ children }) {
  const pathname = usePathname()
  const { isSidebarOpen, setIsSidebarOpen } = useLayoutStore()

  const navItems = [
    {
      href: "/tour-guide/dashboard",
      label: "Dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
      active: pathname === "/tour-guide/dashboard",
    },
    {
      href: "/tour-guide/bookings",
      label: "Assigned Tours",
      icon: <Calendar className="h-5 w-5" />,
      active: pathname === "/tour-guide/bookings",
    },
    {
      href: "/tour-guide/profile",
      label: "Profile",
      icon: <User className="h-5 w-5" />,
      active: pathname === "/tour-guide/profile",
    },
    {
      href: "/tour-guide/password",
      label: "Change Password",
      icon: <Lock className="h-5 w-5" />,
      active: pathname === "/tour-guide/password",
    }
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-gray-900 transition-transform duration-200 ease-in-out md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
            <h1 className="text-xl font-semibold text-white">Tour Guide Portal</h1>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-400 hover:text-white"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-4 px-2 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  item.active ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
                )}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-gray-800 p-4">
            <button className="flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col bg-white md:pl-54">
        {/* Top navigation */}
        <header className="sticky top-0 left-0 z-10 bg-transparent shadow-sm md:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>

            <div className="ml-auto flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt="User" />
                <AvatarFallback>M</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pl-8 py-6">{children}</main>
      </div>
    </div>
  )
}
