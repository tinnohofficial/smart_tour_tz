import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-blue-600">Welcome to Smart Tour System</h1>
      <p className="text-lg md:text-xl mb-8 max-w-2xl">
        Discover amazing destinations, book your perfect trip, and create unforgettable memories with our smart and
        easy-to-use tour system.
      </p>
      <div className="space-y-4 sm:space-y-0 sm:space-x-4">
        <Link href="/locations">
          <Button size="lg" className="text-lg px-6 py-3 w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700">
            Explore Destinations
          </Button>
        </Link>
        <Link href="/register">
          <Button size="lg" variant="outline" className="text-lg px-6 py-3 w-full sm:w-auto hover:bg-blue-100">
            Sign Up Now
          </Button>
        </Link>
      </div>
    </div>
  )
}

