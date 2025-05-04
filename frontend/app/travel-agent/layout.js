"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Ticket, Briefcase, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { create } from "zustand"
import { useEffect } from "react"

// Zustand store for travel agent state
const useTravelAgentStore = create((set) => ({
  profile: null,
  isLoading: true,
  error: null,
  isSidebarOpen: false,

  setProfile: (profile) => set({ profile }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  fetchProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch("/api/travel-agents/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        set({ profile: data, isLoading: false });
      } else {
        const error = await response.json();
        set({ error: error.message, isLoading: false });
      }
    } catch (error) {
      set({ error: "Failed to load travel agent profile", isLoading: false });
    }
  }
}))

export default function TravelAgentLayout({ children }) {
  const pathname = usePathname()
  const { isSidebarOpen, setIsSidebarOpen } = useTravelAgentStore()

  const navItems = [
    {
      href: "/travel-agent/dashboard",
      label: "Dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
      active: pathname === "/travel-agent/dashboard",
    },
    {
      href: "/dashboard/travel-agent/bookings",
      label: "Bookings",
      icon: <Ticket className="h-5 w-5" />,
      active: pathname === "/dashboard/travel-agent/bookings",
    },
    {
      href: "/profile/travelAgent",
      label: "Agency Profile",
      icon: <Briefcase className="h-5 w-5" />,
      active: pathname === "/profile/travelAgent",
    },
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
            <h1 className="text-xl font-semibold text-white">Travel Agent Portal</h1>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-400 hover:text-white"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-4">
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
      <div className="flex flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>

            <div className="ml-auto">
              <span className="font-medium text-sm">Travel Agent Portal</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}