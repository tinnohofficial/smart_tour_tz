import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"


export function LocationCard({ id, name, description, image }) {
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
        <Link href={`/book/${id}`} className="w-full">
          <Button className="w-full text-white bg-blue-600 hover:bg-blue-700">Book Now</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

