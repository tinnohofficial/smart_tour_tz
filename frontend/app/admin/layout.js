"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, MapPin, Activity, Calendar, LogOut, Menu, Lock, Wallet } from "lucide-react"
import { publishAuthChange } from "@/components/Navbar"
import { useLayoutStore } from "@/app/store/layoutStore"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { RouteProtection } from "@/components/route-protection"

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  // Use the shared layout store
  const { isSidebarOpen: isMobileSidebarOpen, setIsSidebarOpen: setMobileSidebarOpen } = useLayoutStore()

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
    {
      label: "Change Password",
      icon: Lock,
      href: "/admin/password",
      active: pathname === "/admin/password",
    },
    {
      label: "Withdraw Funds",
      icon: Wallet,
      href: "/admin/withdraw",
      active: pathname === "/admin/withdraw",
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
      <div className="fixed inset-0 h-screen w-screen">
        {/* --- Desktop Sidebar --- */}
        <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-amber-900">
          <div className="h-20 flex items-center justify-center border-b border-amber-800">
            <Link href="/admin/dashboard" className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Smart Tour Admin</h1>
            </Link>
          </div>
          <ScrollArea className="flex flex-col flex-grow p-4">
            <div className="space-y-2">
              {(routes || []).map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-amber-800/50 rounded-lg transition",
                    route.active ? "text-white bg-amber-800" : "text-amber-200",
                  )}
                >
                  <div className="flex items-center flex-1">
                    <route.icon className={cn("h-5 w-5 mr-3", route.active ? "text-white" : "text-amber-200")} />
                    {route.label}
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-amber-800">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-amber-200 hover:text-white hover:bg-amber-800/50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>

        {/* --- Main Content Area --- */}
        <div className="md:pl-72 h-full w-full flex flex-col">
          {/* --- Mobile Header / Trigger --- */}
          <div className="flex items-center bg-white p-4 md:hidden border-b">
            {/* Use Zustand state and action for the Sheet */}
            <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu />
                </Button>
              </SheetTrigger>
              {/* --- Mobile Sidebar Content (SheetContent) --- */}
              <SheetContent side="left" className="p-0 bg-amber-900">
                <div className="h-20 flex items-center justify-center border-b border-amber-800">
                  {/* Close sidebar on link click */}
                  <Link href="/admin/dashboard" className="flex items-center" onClick={closeMobileSidebar}>
                    <h1 className="text-2xl font-bold text-white">Smart Tour Admin</h1>
                  </Link>
                </div>
                <ScrollArea className="flex flex-col flex-grow p-4">
                  <div className="space-y-2 mt-4">
                    {(routes || []).map((route) => (
                      <Link
                        key={route.href}
                        href={route.href}
                        onClick={closeMobileSidebar} // Close sidebar on link click
                        className={cn(
                          "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-amber-800/50 rounded-lg transition",
                          route.active ? "text-white bg-amber-800" : "text-amber-200",
                        )}
                      >
                        <div className="flex items-center flex-1">
                          <route.icon className={cn("h-5 w-5 mr-3", route.active ? "text-white" : "text-amber-200")} />
                          {route.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-amber-800">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-amber-200 hover:text-white hover:bg-amber-800/50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* --- Page Content --- */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        </div>
      </div>
    </RouteProtection>
  )
}