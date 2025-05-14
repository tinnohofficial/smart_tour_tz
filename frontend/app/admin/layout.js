"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, MapPin, Activity, Calendar, LogOut, Menu } from "lucide-react"
import { create } from 'zustand' // Import zustand create
import { publishAuthChange } from "@/components/Navbar" // Import publishAuthChange

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { RouteProtection } from "@/components/route-protection"

// 1. Define the Zustand Store
export const useAdminLayoutStore = create((set) => ({
  isMobileSidebarOpen: false, // Initial state
  setMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }), // Action to explicitly set the state
  // Optional: toggle action if needed elsewhere
  // toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
}))


// 2. Define the AdminLayout Component
export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  // Get state and actions from the Zustand store
  const isMobileSidebarOpen = useAdminLayoutStore((state) => state.isMobileSidebarOpen)
  const setMobileSidebarOpen = useAdminLayoutStore((state) => state.setMobileSidebarOpen)

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
      active: pathname === "/admin/dashboard",
    },
    {
      label: "Account Approvals",
      icon: Users,
      href: "/admin/applications",
      active: pathname === "/admin/applications",
    },
    {
      label: "Destinations",
      icon: MapPin,
      href: "/admin/destinations",
      active: pathname === "/admin/destinations",
    },
    {
      label: "Activities",
      icon: Activity,
      href: "/admin/activities",
      active: pathname === "/admin/activities",
    },
    {
      label: "Tour Assignments",
      icon: Calendar,
      href: "/admin/assignments",
      active: pathname === "/admin/assignments",
    },
  ]

  // Helper function to close the sidebar, using the store's action
  const closeMobileSidebar = () => setMobileSidebarOpen(false)
  
  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    
    // Notify navbar about auth state change
    publishAuthChange() 
    
    // Navigate to login page immediately
    router.push('/login')
  }

  // Use RouteProtection to protect the entire admin layout
  return (
    <RouteProtection allowedRoles={['admin']}>
      <div className="h-full -top-5 relative">
        {/* --- Desktop Sidebar --- */}
        <div className="hidden h-full -ml-12 md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
          <div className="h-20 flex items-center justify-center border-b border-gray-800">
            <Link href="/admin/dashboard" className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Smart Tour Admin</h1>
            </Link>
          </div>
          <ScrollArea className="flex flex-col flex-grow p-4">
            <div className="space-y-2">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-gray-800/50 rounded-lg transition",
                    route.active ? "text-white bg-gray-800" : "text-gray-400",
                  )}
                >
                  <div className="flex items-center flex-1">
                    <route.icon className={cn("h-5 w-5 mr-3", route.active ? "text-white" : "text-gray-400")} />
                    {route.label}
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-gray-800">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800/50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>

        {/* --- Main Content Area --- */}
        <div className="md:pl-60 -mr-8 h-full">
          {/* --- Mobile Header / Trigger --- */}
          <div className="flex items-center bg-white">
            {/* Use Zustand state and action for the Sheet */}
            <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu />
                </Button>
              </SheetTrigger>
              {/* --- Mobile Sidebar Content (SheetContent) --- */}
              <SheetContent side="left" className="p-0 bg-gray-900">
                <div className="h-20 flex items-center justify-center border-b border-gray-800">
                  {/* Close sidebar on link click */}
                  <Link href="/admin/dashboard" className="flex items-center" onClick={closeMobileSidebar}>
                    <h1 className="text-2xl font-bold text-white">Smart Tour Admin</h1>
                  </Link>
                </div>
                <ScrollArea className="flex flex-col flex-grow p-4">
                  <div className="space-y-2 mt-4">
                    {routes.map((route) => (
                      <Link
                        key={route.href}
                        href={route.href}
                        onClick={closeMobileSidebar} // Close sidebar on link click
                        className={cn(
                          "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-gray-800/50 rounded-lg transition",
                          route.active ? "text-white bg-gray-800" : "text-gray-400",
                        )}
                      >
                        <div className="flex items-center flex-1">
                          <route.icon className={cn("h-5 w-5 mr-3", route.active ? "text-white" : "text-gray-400")} />
                          {route.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-gray-800">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800/50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* --- Header Content (Right Side) --- */}
            {/* <div className="flex w-full justify-between">
              <div className="flex items-center gap-x-2"> */}
                {/* Title shown only on mobile where sidebar is hidden */}
                {/* <h1 className="text-xl font-semibold md:hidden">Smart Tour Admin</h1>
              </div>
              <div className="flex items-center gap-x-2">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-white">A</div>
                  <span className="ml-2 font-medium hidden md:block">Admin</span>
                </div>
              </div>
            </div> */}
          </div>

          {/* --- Page Content --- */}
          <main className="h-full overflow-y-auto p-4 md:p-8">{children}</main>
        </div>
      </div>
    </RouteProtection>
  )
}