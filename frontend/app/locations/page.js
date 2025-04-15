"use client"

import { Input } from "@/components/ui/input"
import { LocationCard } from "../components/location-card"
import useLocationStore from "./locationStore"

export const locations = [
  {
    id: 1,
    name: "Serengeti National Park",
    description: "Experience the incredible wildlife of Tanzania in this world-famous national park.",
    image: "/serengeti-national-park.jpg",
    price:" 500"
  },
  {
    id: 2,
    name: "Zanzibar Beaches",
    description: "Relax on the pristine white sand beaches of Zanzibar with crystal clear waters.",
    image: "/zanzibar-beach.jpg",
    price:" 500"
  },
  {
    id: 3,
    name: "Mount Kilimanjaro",
    description: 'Climb Africa\'s highest peak and witness breathtaking views from the "Roof of Africa".',
    image: "/kilimanjaro.jpg",
    price:" 400"
  },
  {
    id: 4,
    name: "Ngorongoro Conservation Area",
    description: "Explore the unique ecosystem of this UNESCO World Heritage site, home to diverse wildlife.",
    image: "/ngorongoro-c.jpg",
    price:" 500"
  },
  {
    id: 5,
    name: "Stone Town, Zanzibar",
    description: "Wander through the historic streets of Stone Town and discover its rich cultural heritage.",
    image: "/stone-town.jpg",
    price:" 300"
  },
  {
    id: 6,
    name: "Tarangire National Park",
    description: "Famous for its large elephant population and iconic baobab trees.",
    image: "/tarangire-b.jpg",
    price:" 600"
  },
]

export default function Locations() {
  const { searchTerm, setSearchTerm} = useLocationStore();

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Explore Locations</h1>
      <Input
        type="text"
        placeholder="Search locations..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-6 py-4.5"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLocations.map((location) => (
          <LocationCard
            key={location.id}
            id={location.id}
            name={location.name}
            description={location.description}
            image={location.image}
          />
        ))}
      </div>
    </div>
  )
}

