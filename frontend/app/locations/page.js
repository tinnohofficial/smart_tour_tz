"use client"

import { useEffect } from "react"
import { Input } from "@/components/ui/input"
import { LocationCard } from "../components/location-card"
import useLocationStore from "./locationStore"
import { Search, MapPin, Loader2 } from "lucide-react"

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-red-50/20">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 mr-3" />
              <span className="text-xl font-semibold">Discover Tanzania</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Explore Amazing Destinations
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
              From the majestic Serengeti to the pristine beaches of Zanzibar, 
              discover the most breathtaking locations Tanzania has to offer
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search Section */}
        <div className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-600 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search destinations, activities, or experiences..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 bg-amber-50/30"
              />
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-amber-900">
              {searchTerm ? `Search Results for "${searchTerm}"` : 'All Destinations'}
            </h2>
            <div className="text-amber-700 font-medium">
              {filteredLocations.length} destination{filteredLocations.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-amber-600 animate-spin mb-4" />
            <p className="text-amber-700 text-lg">Loading amazing destinations...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-600 font-medium mb-2">Oops! Something went wrong</div>
            <div className="text-red-500">{error}</div>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && filteredLocations.length === 0 && searchTerm && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-12 text-center">
            <MapPin className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-900 mb-2">No destinations found</h3>
            <p className="text-amber-700">
              Try adjusting your search terms or browse all available destinations
            </p>
          </div>
        )}

        {/* Locations Grid */}
        {!loading && !error && filteredLocations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
        )}
      </div>
    </div>
  )
}

