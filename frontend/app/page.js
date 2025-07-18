"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Users, Calendar, ArrowRight, Brain } from "lucide-react";
import { destinationsService } from "@/app/services/api";
import { toast } from "sonner";
import { getUserData, clearAuthData, getAuthToken } from "./utils/auth";

export default function Home() {
  const [user, setUser] = useState(null);
  const [featuredDestinations, setFeaturedDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and redirect to appropriate dashboard
    const userData = getUserData();
    console.log(userData);
    if (userData) {
      const user = userData;
      setUser(user);

      // Redirect logged-in users to their respective dashboards
      switch (user.role) {
        case "admin":
          router.push("/admin/dashboard");
          return;
        case "tour_guide":
          router.push("/tour-guide/dashboard");
          return;
        case "travel_agent":
          router.push("/travel-agent/dashboard");
          return;
        case "hotel_manager":
          router.push("/hotel-manager/dashboard");
          return;
        case "tourist":
          // Tourists can stay on home page but we'll still set user state
          break;
        default:
          break;
      }
    }

    // Fetch featured destinations
    const fetchDestinations = async () => {
      try {
        const destinations = await destinationsService.getAllDestinations();
        // Get first 3 destinations as featured
        setFeaturedDestinations(destinations.slice(0, 3));
      } catch (error) {
        console.error("Error fetching destinations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, [router]);

  const renderHeroSection = () => (
    <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl p-8 md:p-18 mb-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-amber-900">
          Discover Tanzania's Wonders
        </h1>{" "}
        <p className="text-md md:text-lg mb-8 text-amber-800 max-w-2xl mx-auto leading-relaxed">
          Get seamless booking experience with secure blockchain payments, build
          your travel savings, and connect with expert local guides for
          unforgettable adventures.
        </p>{" "}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/locations">
            <Button
              size="lg"
              className="text-lg px-8 py-4 bg-amber-700 text-white hover:bg-amber-800 shadow-lg"
            >
              <MapPin className="mr-2 h-5 w-5" />
              Explore Destinations
            </Button>
          </Link>

          {/* <Link href={user && user.role === 'tourist' ? "/ai-suggestions" : "/login"}>
              <Button
                size="lg"
                onClick={() => {
                  if (user && user.role === 'tourist') {
                    router.push("/ai-suggestions");
                  } else if (user && user.role !== 'tourist') {
                    toast.error("AI Travel Suggestions are only available for tourists. Please log in with a tourist account.");
                  } else {
                    toast.info("Please log in to access AI Travel Suggestions.");
                    router.push("/login");
                  }
                }}
                className="text-lg px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-lg"
              >
                <Brain className="mr-2 h-5 w-5" />
                AI Travel Suggestions
              </Button>
            </Link> */}

          {!user && (
            <>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-4 border-amber-700 text-amber-700 hover:bg-amber-50"
                >
                  Start Your Journey
                </Button>
              </Link>
            </>
          )}
          {user && (
            <Link href="/savings">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4 border-amber-700 text-amber-700 hover:bg-amber-50"
              >
                <Calendar className="mr-2 h-5 w-5" />
                My Savings
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  const renderWelcomeBack = () =>
    user && (
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-6 mb-8 border border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-amber-900 mb-2">
              Welcome back, {user.email.split("@")[0]}! 👋
            </h2>
            <p className="text-amber-800">
              Ready for your next adventure in Tanzania?
            </p>
          </div>
          <div className="hidden md:flex space-x-3">
            <Link href="/savings">
              <Button className="bg-amber-700 text-white hover:bg-amber-800">
                My Savings
              </Button>
            </Link>
            <Link href="/locations">
              <Button
                variant="outline"
                className="border-amber-700 text-amber-700 hover:bg-amber-50"
              >
                Browse Tours
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );

  const renderFeaturedDestinations = () => (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-amber-900 mb-2">
            Featured Destinations
          </h2>
          <p className="text-amber-700">
            Discover Tanzania's most popular attractions
          </p>
        </div>
        <Link href="/locations">
          <Button
            variant="outline"
            className="border-amber-700 text-amber-700 hover:bg-amber-50"
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
          {featuredDestinations.map((destination) => (
            <Card
              key={destination.id}
              className="overflow-hidden border-amber-200 hover:shadow-lg transition-shadow duration-300 p-0 pb-4"
            >
              <div className="relative h-48 ">
                <Image
                  src={destination.image_url || "/placeholder.svg"}
                  alt={destination.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 right-4"></div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-xl text-amber-900 mb-2">
                  {destination.name}
                </h3>
                <p className="text-amber-700 text-sm mb-4 line-clamp-2">
                  {destination.description}
                </p>
                <Link href={`/book/${destination.id}`}>
                  <Button className="w-full bg-amber-700 text-white hover:bg-amber-800">
                    Book Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
  const renderKeyFeatures = () => (
    <div className="mb-12 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl p-8 md:p-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
          Why Choose Smart Tour Tanzania?
        </h2>
        <p className="text-lg text-amber-800 max-w-3xl mx-auto">
            Experience the future of travel with our innovative platform combining Smart Savings, 
            blockchain security, and local expertise
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
        {/* <Card className="text-center p-6 bg-white/90 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-shadow">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-amber-900 mb-3">AI Suggestions</h3>
          <p className="text-amber-700 text-sm">
            Get personalized travel suggestions based on your preferences
          </p>
        </Card>  */}

        <Card className="text-center p-6 bg-white/90 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-shadow">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-white font-bold text-2xl">₿</div>
          </div>
          <h3 className="text-xl font-bold text-amber-900 mb-3">
            Crypto Payments
          </h3>
          <p className="text-amber-700 text-sm">
            Secure, transparent payments using crypto with our Tanzania Shilling
            Coin (TZC)
          </p>
        </Card>

        <Card className="text-center p-6 bg-white/90 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-shadow">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-amber-900 mb-3">
            Smart Savings{" "}
          </h3>
          <p className="text-amber-700 text-sm">
            Build your travel fund with our savings and get 5% discounts on
            bookings
          </p>
        </Card>

        <Card className="text-center p-6 bg-white/90 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-shadow">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-amber-900 mb-3">
            Expert Local Guides
          </h3>
          <p className="text-amber-700 text-sm">
            Professional local guides with deep knowledge of Tanzania's culture
            and wildlife
          </p>
        </Card>
      </div>
    </div>
  );

  const renderWhyChooseUs = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
      <Card className="text-center p-6 border-amber-200">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="h-8 w-8 text-amber-700" />
        </div>
        <h3 className="text-xl font-bold text-amber-900 mb-3">Expert Guides</h3>
        <p className="text-amber-700">
          Professional local guides with deep knowledge of Tanzania's culture
          and wildlife
        </p>
      </Card>

      <Card className="text-center p-6 border-amber-200">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-8 w-8 text-amber-700" />
        </div>
        <h3 className="text-xl font-bold text-amber-900 mb-3">
          Unique Destinations
        </h3>
        <p className="text-amber-700">
          Access to exclusive locations and hidden gems across Tanzania
        </p>
      </Card>

      <Card className="text-center p-6 border-amber-200">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-amber-700" />
        </div>
        <h3 className="text-xl font-bold text-amber-900 mb-3">
          Trusted Service
        </h3>
        <p className="text-amber-700">
          Safe, reliable, and personalized travel experiences for every
          adventurer
        </p>
      </Card>
    </div>
  );
  return (
    <div className="max-w-7xl mx-auto">
      {renderHeroSection()}
      {renderWelcomeBack()}
      {renderFeaturedDestinations()}
      {renderKeyFeatures()}
      {/* {renderWhyChooseUs()} */}
    </div>
  );
}
