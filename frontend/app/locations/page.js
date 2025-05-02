"use client"

import { useEffect } from "react"
import { Input } from "@/components/ui/input"
import { LocationCard } from "../components/location-card"
import useLocationStore from "./locationStore"

export default function Locations() {
  const {
    locations,
    searchTerm,
    setSearchTerm,
    fetchLocations,
    loading,
    error,
  } = useLocationStore()

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description.toLowerCase().includes(searchTerm.toLowerCase())
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
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
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

