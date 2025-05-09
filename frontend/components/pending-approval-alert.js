import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { UserCircle } from "lucide-react"
import Link from "next/link"

export function PendingApprovalAlert({ userRole, hasCompletedProfile }) {
  const getProfileLink = () => {
    switch (userRole) {
      case "hotel_manager":
        return "/profile/hotelManager"
      case "tour_guide":
        return "/tour-guide/profile"
      case "travel_agent":
        return "/profile/travelAgent"
      default:
        return "/profile"
    }
  }

  return (
    <Alert className="mb-6 border-yellow-200 bg-yellow-50">
      <UserCircle className="h-5 w-5 text-yellow-600" />
      <AlertTitle className="text-yellow-800 ml-2">Account Pending Approval</AlertTitle>
      <AlertDescription className="ml-2">
        <div className="mt-2 text-yellow-700">
          {!hasCompletedProfile ? (
            <>
              Please complete your profile to gain full access to all features.
              <div className="mt-4">
                <Button asChild variant="outline" className="border-yellow-300 hover:bg-yellow-100">
                  <Link href={getProfileLink()}>Complete Profile</Link>
                </Button>
              </div>
            </>
          ) : (
            "Your profile is under review. You will have access to all features once approved by an administrator."
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}