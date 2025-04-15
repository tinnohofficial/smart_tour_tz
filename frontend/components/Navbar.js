import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Navbar() {
  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Smart Tour
          </Link>
          <div className="hidden md:flex space-x-4">
            <Link href="/locations">
              <Button variant="ghost">Locations</Button>
            </Link>
            <Link href="/savings">
              <Button variant="ghost">Savings</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="hover:bg-blue-100">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">Register</Button>
            </Link>
          </div>
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col space-y-4 mt-4">
                <Link href="/locations">
                  <Button variant="ghost" className="w-full justify-start ">
                    Locations
                  </Button>
                </Link>
                <Link href="/savings">
                  <Button variant="ghost" className="w-full justify-start">
                    Savings
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full justify-start">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="w-full justify-start">Register</Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}

