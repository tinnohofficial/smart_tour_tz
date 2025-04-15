"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileUploader } from "../components/file-uploader"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { ChevronRight, User } from "lucide-react"
import { useRegisterStore } from "./registerStore"

export default function Register() {
  const router = useRouter()
  const {
    step,
    role,
    basicFormData,
    tourGuideFormData,
    hotelManagerFormData,
    travelAgentFormData,
    setStep,
    setRole,
    setBasicFormData,
    setTourGuideFormData,
    setHotelManagerFormData,
    setTravelAgentFormData,
    resetAllForms
  } = useRegisterStore();


  const onBasicSubmit = (event) => {
    event.preventDefault();

    const email = basicFormData.email;
    const password = basicFormData.password;
    const confirmPassword = basicFormData.confirmPassword;
    const phoneNumber = basicFormData.phoneNumber;
    const selectedRole = basicFormData.role;

    if (!email || !password || !confirmPassword || !phoneNumber || !selectedRole) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      toast.error("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      toast.error("Password must contain at least one lowercase letter.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      toast.error("Password must contain at least one number.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setRole(selectedRole);
    if (selectedRole === "tourist") {
      handleFinalSubmit({
        ...basicFormData,
        roleSpecificData: null,
      });
    } else {
      setStep(2);
    }
  };

  const onRoleSpecificSubmit = (event) => {
    event.preventDefault();
    let roleSpecificData = {};

    if (role === "tourGuide") {
        const fullName = tourGuideFormData.fullName;
        const location = tourGuideFormData.location;
        const expertise = tourGuideFormData.expertise;

        if (!fullName || !location || !expertise) {
          toast.error("Please fill in all Tour Guide information fields.");
          return;
        }
        if (fullName.length < 2) {
          toast.error("Please enter your full name.");
          return;
        }
        if (location.length < 2) {
          toast.error("Please enter your location.");
          return;
        }
        if (expertise.length < 2) {
          toast.error("Please enter your areas of expertise.");
          return;
        }


        roleSpecificData = tourGuideFormData;

    } else if (role === "hotelManager") {
        const hotelName = hotelManagerFormData.hotelName;
        const hotelLocation = hotelManagerFormData.hotelLocation;
        const hotelCapacity = hotelManagerFormData.hotelCapacity;
        const hotelFacilities = hotelManagerFormData.hotelFacilities;

        if (!hotelName || !hotelLocation || !hotelCapacity || !hotelFacilities) {
          toast.error("Please fill in all Hotel Manager information fields.");
          return;
        }

        if (hotelName.length < 2) {
          toast.error("Please enter the hotel name.");
          return;
        }
        if (hotelLocation.length < 2) {
          toast.error("Please enter the hotel location.");
          return;
        }
        if (hotelCapacity.length < 1) {
          toast.error("Please enter the hotel capacity.");
          return;
        }
        if (hotelFacilities.length < 2) {
          toast.error("Please describe the hotel facilities.");
          return;
        }
        roleSpecificData = hotelManagerFormData;

    } else if (role === "travelAgent") {
        const companyName = travelAgentFormData.companyName;
        const travelRoutes = travelAgentFormData.travelRoutes;

        if (!companyName || !travelRoutes) {
          toast.error("Please fill in all Travel Agent information fields.");
          return;
        }
        if (companyName.length < 2) {
          toast.error("Please enter the company name.");
          return;
        }
        if (travelRoutes.length < 2) {
          toast.error("Please enter your travel routes with pricing.");
          return;
        }
        roleSpecificData = travelAgentFormData;
    }


    const completeData = {
      ...basicFormData,
      roleSpecificData: roleSpecificData,
    };
    handleFinalSubmit(completeData);
  };


  const handleFinalSubmit = (completeData) => {
    console.log("Registration data:", completeData);

    toast.success(
      role === "tourist" 
        ? "Your account has been created!" 
        : "Your application has been submitted for review!"
    );

    setTimeout(() => {
      router.push("/login");
      resetAllForms(); 
      setStep(1); 
      setRole(""); 
    }, 2000);
  };

  const handleFileChange = (files, formSetter, fieldName) => {
    formSetter({ [fieldName]: files }); 
  };


  return (
    <div className="container max-w-3xl mx-auto py-10">
      <Card className="border-blue-100 shadow-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
            {step === 2 && (
              <Button onClick={() => setStep(1)} className="text-sm text-white bg-blue-500">
              ↩ &nbsp; Back to Basic Info
              </Button>
            )}
          </div>
          <CardDescription className="text-gray-500">Enter your details to create your Smart Tour account</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={onBasicSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                  <Input
                    id="email"
                    placeholder="your.email@example.com"
                    value={basicFormData.email}
                    onChange={(e) => setBasicFormData({ email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                    <Input
                      type="password"
                      id="password"
                      placeholder="••••••••"
                      value={basicFormData.password}
                      onChange={(e) => setBasicFormData({ password: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      At least 8 characters with uppercase, lowercase, and numbers
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Confirm Password</label>
                    <Input
                      type="password"
                      id="confirmPassword"
                      placeholder="••••••••"
                      value={basicFormData.confirmPassword}
                      onChange={(e) => setBasicFormData({ confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Phone Number</label>
                  <Input
                    id="phoneNumber"
                    placeholder="+1 (555) 000-0000"
                    value={basicFormData.phoneNumber}
                    onChange={(e) => setBasicFormData({ phoneNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="role" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Role</label>
                  <Select onValueChange={(value) => setBasicFormData({ role: value })} defaultValue={basicFormData.role}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="tourist">Tourist</SelectItem>
                      <SelectItem value="tourGuide">Tour Guide</SelectItem>
                      <SelectItem value="hotelManager">Hotel Manager</SelectItem>
                      <SelectItem value="travelAgent">Travel Agent</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Select your role in the system. Additional information may be required.
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full text-white bg-blue-600 hover:bg-blue-700">
                {basicFormData.role === "tourist" ? "Create Account" : "Continue"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div>
              {role === "tourGuide" && (
                <form onSubmit={onRoleSpecificSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                      <User size={18} />
                      <h3>Tour Guide Information</h3>
                    </div>
                    <Separator />

                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Full Name</label>
                      <Input
                        id="fullName"
                        placeholder="Eddie thinker"
                        value={tourGuideFormData.fullName}
                        onChange={(e) => setTourGuideFormData({ fullName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="location" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Location</label>
                      <Input
                        id="location"
                        placeholder="City, Country"
                        value={tourGuideFormData.location}
                        onChange={(e) => setTourGuideFormData({ location: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="expertise" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Areas of Expertise</label>
                      <Textarea
                        id="expertise"
                        placeholder="Wildlife, History, Adventure, etc."
                        className="min-h-[100px]"
                        value={tourGuideFormData.expertise}
                        onChange={(e) => setTourGuideFormData({ expertise: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="licenseDocuments" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Documents</label>
                      <FileUploader
                        onChange={(files) => handleFileChange(files, setTourGuideFormData, 'licenseDocuments')}
                        maxFiles={3}
                        acceptedFileTypes="application/pdf,image/*"
                      />
                      <p className="text-xs text-gray-500">
                        Upload your tour guide license or certification (PDF or images)
                      </p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full text-white bg-blue-600 hover:bg-blue-700">
                    Submit Application
                  </Button>
                </form>
              )}

              {role === "hotelManager" && (
                <form onSubmit={onRoleSpecificSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                      <User size={18} />
                      <h3>Hotel Manager Information</h3>
                    </div>
                    <Separator />

                    <div className="space-y-2">
                      <label htmlFor="hotelName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Hotel Name</label>
                      <Input
                        id="hotelName"
                        placeholder="Serengeti Luxury Lodge"
                        value={hotelManagerFormData.hotelName}
                        onChange={(e) => setHotelManagerFormData({ hotelName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="hotelLocation" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Hotel Location</label>
                      <Input
                        id="hotelLocation"
                        placeholder="City, Country"
                        value={hotelManagerFormData.hotelLocation}
                        onChange={(e) => setHotelManagerFormData({ hotelLocation: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="hotelCapacity" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Hotel Capacity</label>
                      <Input
                        id="hotelCapacity"
                        placeholder="Number of rooms/guests"
                        value={hotelManagerFormData.hotelCapacity}
                        onChange={(e) => setHotelManagerFormData({ hotelCapacity: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="hotelFacilities" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Hotel Facilities</label>
                      <Textarea
                        id="hotelFacilities"
                        placeholder="Pool, Spa, Restaurant, etc."
                        className="min-h-[100px]"
                        value={hotelManagerFormData.hotelFacilities}
                        onChange={(e) => setHotelManagerFormData({ hotelFacilities: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="hotelImages" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Hotel Images</label>
                      <FileUploader
                        onChange={(files) => handleFileChange(files, setHotelManagerFormData, 'hotelImages')}
                        maxFiles={5}
                        acceptedFileTypes="image/*"
                      />
                      <p className="text-xs text-gray-500">Upload images of your hotel (up to 5 images)</p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full text-white bg-blue-600 hover:bg-blue-700">
                    Submit Application
                  </Button>
                </form>
              )}

              {role === "travelAgent" && (
                <form onSubmit={onRoleSpecificSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                      <User size={18} />
                      <h3>Travel Agent Information</h3>
                    </div>
                    <Separator />

                    <div className="space-y-2">
                      <label htmlFor="companyName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Company Name</label>
                      <Input
                        id="companyName"
                        placeholder="Safari Adventures"
                        value={travelAgentFormData.companyName}
                        onChange={(e) => setTravelAgentFormData({ companyName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="travelRoutes" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Travel Routes with Pricing</label>
                      <Textarea
                        id="travelRoutes"
                        placeholder="Describe your travel routes and pricing structure"
                        className="min-h-[150px]"
                        value={travelAgentFormData.travelRoutes}
                        onChange={(e) => setTravelAgentFormData({ travelRoutes: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="legalDocuments" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Legal Documents</label>
                      <FileUploader
                        onChange={(files) => handleFileChange(files, setTravelAgentFormData, 'legalDocuments')}
                        maxFiles={3}
                        acceptedFileTypes="application/pdf,image/*"
                      />
                      <p className="text-xs text-gray-500">
                        Upload your business license and other legal documents (PDF or images)
                      </p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full text-white bg-blue-600 hover:bg-blue-700">
                    Submit Application
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t pt-6">
          <div className="text-sm text-gray-500 text-center">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Sign in
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}