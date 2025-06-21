"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Sparkles,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Calendar,
  Star,
  ArrowRight,
  Loader2,
  ChevronRight,
  CheckCircle,
  Info,
  Hotel,
  Activity,
  Camera,
  Mountain,
  Waves,
  Trees,
  Building,
  Compass,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { aiSuggestionsService } from "@/app/services/api";
import { formatTZS } from "@/app/utils/currency";
import { getFullImageUrl } from "@/app/services/api";
import Image from "next/image";

const INTEREST_OPTIONS = [
  { id: "wildlife", label: "Wildlife Safari", icon: <Camera className="h-4 w-4" /> },
  { id: "mountain", label: "Mountain Trekking", icon: <Mountain className="h-4 w-4" /> },
  { id: "beach", label: "Beach & Islands", icon: <Waves className="h-4 w-4" /> },
  { id: "culture", label: "Cultural Tours", icon: <BookOpen className="h-4 w-4" /> },
  { id: "nature", label: "Nature & Parks", icon: <Trees className="h-4 w-4" /> },
  { id: "city", label: "City Exploration", icon: <Building className="h-4 w-4" /> },
  { id: "adventure", label: "Adventure Sports", icon: <Compass className="h-4 w-4" /> },
  { id: "photography", label: "Photography", icon: <Camera className="h-4 w-4" /> },
];

const BUDGET_RANGES = [
  { value: "500000-1000000", label: "500K - 1M TZS", range: "Budget-friendly" },
  { value: "1000000-2500000", label: "1M - 2.5M TZS", range: "Mid-range" },
  { value: "2500000-5000000", label: "2.5M - 5M TZS", range: "Premium" },
  { value: "5000000+", label: "5M+ TZS", range: "Luxury" },
];

const TRAVEL_STYLES = [
  { value: "adventure", label: "Adventure Seeker" },
  { value: "relaxed", label: "Relaxed & Leisurely" },
  { value: "cultural", label: "Cultural Immersion" },
  { value: "luxury", label: "Luxury Experience" },
  { value: "budget", label: "Budget Conscious" },
  { value: "family", label: "Family Friendly" },
];

const ACCOMMODATION_TYPES = [
  { value: "camping", label: "Camping & Lodges" },
  { value: "budget", label: "Budget Hotels" },
  { value: "mid-range", label: "Mid-range Hotels" },
  { value: "luxury", label: "Luxury Hotels & Resorts" },
  { value: "mixed", label: "Mixed Accommodation" },
];

const SEASONS = [
  { value: "dry", label: "Dry Season (June - October)" },
  { value: "wet", label: "Wet Season (November - May)" },
  { value: "any", label: "Any Time" },
];

export default function AISuggestions() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [user, setUser] = useState(null);
  
  const [preferences, setPreferences] = useState({
    budget: "",
    duration: "",
    interests: [],
    groupSize: "",
    travelStyle: "",
    accommodation: "",
    season: "",
    specialRequirements: "",
  });
  // Check authentication and role on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("userData");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== "tourist") {
        router.push("/forbidden");
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  const handleInterestToggle = (interestId) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleInputChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (currentStep === 1 && (!preferences.budget || !preferences.duration)) {
      toast.error("Please select your budget and duration");
      return;
    }
    if (currentStep === 2 && preferences.interests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      // Add a small delay to show the loading animation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await aiSuggestionsService.getTourSuggestions(preferences);
      setSuggestions(response);
      setCurrentStep(4); // Move to results step
      toast.success("AI suggestions generated successfully!");
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast.error("Failed to generate suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };  const handleBookDestination = (destinationId) => {
    router.push(`/book/${destinationId}`);
  };

  const resetSuggestions = () => {
    setSuggestions(null);
    setCurrentStep(1);
    setPreferences({
      budget: "",
      duration: "",
      interests: [],
      groupSize: "",
      travelStyle: "",
      accommodation: "",
      season: "",
      specialRequirements: "",
    });
  };

  const renderStep1 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-amber-100 p-3 rounded-full">
            <DollarSign className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          Budget & Duration
        </CardTitle>
        <CardDescription>
          Let's start with your budget and how long you want to travel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="budget" className="text-sm font-medium">
            What's your budget range?
          </Label>
          <Select
            value={preferences.budget}
            onValueChange={(value) => handleInputChange("budget", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your budget range" />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{range.label}</span>
                    <Badge variant="outline" className="ml-2">
                      {range.range}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration" className="text-sm font-medium">
            How many days are you planning to travel?
          </Label>
          <Input
            id="duration"
            type="number"
            min="1"
            max="30"
            placeholder="e.g., 7"
            value={preferences.duration}
            onChange={(e) => handleInputChange("duration", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="groupSize" className="text-sm font-medium">
            Group size (optional)
          </Label>
          <Input
            id="groupSize"
            type="number"
            min="1"
            placeholder="e.g., 4"
            value={preferences.groupSize}
            onChange={(e) => handleInputChange("groupSize", e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={nextStep}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Next Step
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-amber-100 p-3 rounded-full">
            <Star className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          Your Interests
        </CardTitle>
        <CardDescription>
          Select all the activities and experiences that interest you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {INTEREST_OPTIONS.map((interest) => (
            <div
              key={interest.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                preferences.interests.includes(interest.id)
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200 hover:border-amber-300"
              }`}
              onClick={() => handleInterestToggle(interest.id)}
            >
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={preferences.interests.includes(interest.id)}
                  onChange={() => handleInterestToggle(interest.id)}
                  className="data-[state=checked]:bg-amber-600"
                />
                {interest.icon}
                <span className="text-sm font-medium">{interest.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>
            Previous
          </Button>
          <Button
            onClick={nextStep}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Next Step
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-amber-100 p-3 rounded-full">
            <Users className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          Travel Preferences
        </CardTitle>
        <CardDescription>
          Tell us more about your travel style and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Travel Style</Label>
          <Select
            value={preferences.travelStyle}
            onValueChange={(value) => handleInputChange("travelStyle", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="What's your travel style?" />
            </SelectTrigger>
            <SelectContent>
              {TRAVEL_STYLES.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Accommodation Preference</Label>
          <Select
            value={preferences.accommodation}
            onValueChange={(value) => handleInputChange("accommodation", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Preferred accommodation type" />
            </SelectTrigger>
            <SelectContent>
              {ACCOMMODATION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Preferred Season</Label>
          <Select
            value={preferences.season}
            onValueChange={(value) => handleInputChange("season", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="When do you prefer to travel?" />
            </SelectTrigger>
            <SelectContent>
              {SEASONS.map((season) => (
                <SelectItem key={season.value} value={season.value}>
                  {season.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Special Requirements (optional)
          </Label>
          <Textarea
            placeholder="Any special requirements, dietary restrictions, accessibility needs, etc."
            value={preferences.specialRequirements}
            onChange={(e) => handleInputChange("specialRequirements", e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>
            Previous
          </Button>
          <Button
            onClick={generateSuggestions}
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Get AI Suggestions
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderResults = () => (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Your Personalized Tour Suggestions
          </CardTitle>
          <CardDescription>
            Based on your preferences, here are our AI-powered recommendations
          </CardDescription>
        </CardHeader>
      </Card>

      {/* General Advice */}
      {suggestions?.suggestions?.generalAdvice && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Info className="mr-2 h-5 w-5" />
              Travel Advice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700">{suggestions.suggestions.generalAdvice}</p>
          </CardContent>
        </Card>
      )}

      {/* Budget Tips */}
      {suggestions?.suggestions?.budgetTips && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <DollarSign className="mr-2 h-5 w-5" />
              Budget Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700">{suggestions.suggestions.budgetTips}</p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suggestions?.suggestions?.recommendations?.map((rec, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-amber-600" />
                    {rec.destinationName}
                  </CardTitle>
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary" className="mr-2">
                      {rec.matchScore}% Match
                    </Badge>
                    <Badge variant="outline">
                      {rec.estimatedCost}
                    </Badge>
                  </div>
                </div>
                {rec.destination?.imageUrl && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden ml-4">
                    <Image
                      src={getFullImageUrl(rec.destination.imageUrl)}
                      alt={rec.destinationName}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {rec.destination?.description && (
                <p className="text-sm text-gray-600">{rec.destination.description}</p>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Why this destination:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {rec.reasons?.map((reason, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="mr-2 h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {rec.suggestedActivities?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Suggested Activities:</h4>
                  <div className="flex flex-wrap gap-2">
                    {rec.suggestedActivities.map((activity, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <Activity className="mr-1 h-3 w-3" />
                        {activity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {rec.bestTravelTime && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="mr-2 h-4 w-4" />
                  Best time: {rec.bestTravelTime}
                </div>
              )}

              {rec.itinerarySuggestion && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Itinerary Suggestion:</h4>
                  <p className="text-sm text-gray-600">{rec.itinerarySuggestion}</p>
                </div>
              )}              <Button
                onClick={() => handleBookDestination(rec.destinationId)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                Book This Destination
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}      </div>

      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={resetSuggestions}>
          Try New Preferences
        </Button>
        <Button
          onClick={() => router.push("/locations")}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          Explore All Destinations
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-amber-600 p-4 rounded-full">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Tour Suggestions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get personalized tour recommendations powered by AI based on your preferences
          </p>
        </div>

        {/* Progress Steps */}
        {currentStep < 4 && (
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep >= step
                        ? "bg-amber-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-12 h-1 ${
                        currentStep > step ? "bg-amber-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}        {/* Step Content */}
        {isLoading ? (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
                  <Brain className="absolute inset-0 m-auto h-6 w-6 text-amber-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    AI is analyzing your preferences...
                  </h3>
                  <p className="text-gray-600">
                    Please wait while we generate personalized tour suggestions for you
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Sparkles className="h-4 w-4" />
                  <span>Powered by Google Gemini AI</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderResults()}
          </>
        )}
      </div>
    </div>
  );
}
