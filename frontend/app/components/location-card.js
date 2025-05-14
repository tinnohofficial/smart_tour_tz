import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"


export function LocationCard({ id, name, description, image }) {
  const router = useRouter()
  
  const handleBooking = () => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("userData")
    
    if (!token || !userData) {
      toast.error("You need to log in to book a destination")
      router.push("/login")
      return
    }
    
    // Check if the user is a tourist
    try {
      const user = JSON.parse(userData)
      if (user.role !== "tourist") {
        toast.error("Only tourists can make bookings")
        return
      }
      
      // If user is logged in and is a tourist, redirect to booking page
      router.push(`/book/${id}`)
    } catch (error) {
      console.error("Error parsing user data:", error)
      toast.error("Authentication error. Please log in again.")
      localStorage.removeItem("token")
      localStorage.removeItem("userData")
      router.push("/login")
    }
  }
  
  return (
    <Card className="overflow-hidden flex flex-col py-0 pb-6">
      <Image
        src={image}
        alt={name}
        width={400}
        height={200}
        className="w-full h-56 object-cover m-0 p-0"
      />
      <CardHeader>
        <CardTitle className="text-2xl text-blue-600">{name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow text-gray-500">
        <CardDescription>{description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full text-white bg-blue-600 hover:bg-blue-700" 
          onClick={handleBooking}
        >
          Book Now
        </Button>
      </CardFooter>
    </Card>
  )
}

