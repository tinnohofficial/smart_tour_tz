import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Clock, AlertTriangle, User, FileText, Shield } from "lucide-react"
import Link from "next/link"

export function ProfileCompletionBanner({ userRole, profileStatus, hasProfile }) {
  const getStatusConfig = () => {
    switch (profileStatus) {
      case 'pending_profile':
        return {
          icon: <User className="h-5 w-5 text-amber-600" />,
          title: "Complete Your Profile",
          description: "Please complete your profile to access all features and start receiving bookings.",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          textColor: "text-amber-800",
          descColor: "text-amber-700",
          progress: 33,
          actionText: "Complete Profile Now",
          actionPath: getProfileCompletionPath(userRole),
          variant: "warning"
        }
      case 'pending_approval':
        return {
          icon: <Clock className="h-5 w-5 text-blue-600" />,
          title: "Profile Under Review",
          description: "Your profile has been submitted and is currently being reviewed by our administrators. You'll receive full access once approved.",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200", 
          textColor: "text-blue-800",
          descColor: "text-blue-700",
          progress: 66,
          actionText: "View Profile",
          actionPath: getProfilePath(userRole),
          variant: "info"
        }
      case 'active':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          title: "Profile Approved",
          description: "Your profile has been approved! You now have full access to all features.",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800", 
          descColor: "text-green-700",
          progress: 100,
          actionText: "Manage Profile",
          actionPath: getProfilePath(userRole),
          variant: "success"
        }
      case 'rejected':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
          title: "Profile Needs Updates",
          description: "Your profile submission needs some updates. Please review and resubmit.",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          descColor: "text-red-700", 
          progress: 25,
          actionText: "Update Profile",
          actionPath: getProfilePath(userRole),
          variant: "destructive"
        }
      default:
        return null
    }
  }

  const getProfileCompletionPath = (role) => {
    switch (role) {
      case 'tour_guide':
        return '/tour-guide/complete-profile'
      case 'hotel_manager':
        return '/hotel-manager/complete-profile'
      case 'travel_agent':
        return '/travel-agent/complete-profile'
      default:
        return '/profile'
    }
  }

  const getProfilePath = (role) => {
    switch (role) {
      case 'tour_guide':
        return '/tour-guide/profile'
      case 'hotel_manager':
        return '/hotel-manager/profile'
      case 'travel_agent':
        return '/travel-agent/profile'
      default:
        return '/profile'
    }
  }

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'tour_guide':
        return 'Tour Guide'
      case 'hotel_manager':
        return 'Hotel Manager'
      case 'travel_agent':
        return 'Travel Agent'
      default:
        return 'User'
    }
  }

  const getProgressSteps = () => {
    return [
      {
        step: 1,
        label: 'Account Created',
        completed: true,
        icon: <CheckCircle2 className="h-4 w-4" />
      },
      {
        step: 2,
        label: 'Profile Completed',
        completed: profileStatus !== 'pending_profile',
        icon: hasProfile ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />
      },
      {
        step: 3,
        label: 'Admin Approval',
        completed: profileStatus === 'active',
        icon: profileStatus === 'active' ? <CheckCircle2 className="h-4 w-4" /> : <Shield className="h-4 w-4" />
      }
    ]
  }

  // Don't show banner for active users
  if (profileStatus === 'active') {
    return null
  }

  const config = getStatusConfig()
  if (!config) return null

  const steps = getProgressSteps()

  return (
    <Alert className={`mb-6 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start space-x-3">
        {config.icon}
        <div className="flex-1">
          <AlertTitle className={`${config.textColor} font-semibold mb-2`}>
            {config.title}
          </AlertTitle>
          <AlertDescription className={`${config.descColor} mb-4`}>
            {config.description}
          </AlertDescription>

          {/* Progress Steps */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className={`font-medium ${config.textColor}`}>Setup Progress</span>
              <span className={`${config.descColor}`}>{config.progress}% Complete</span>
            </div>
            
            <Progress value={config.progress} className="h-2 mb-3" />
            
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.step} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : profileStatus === 'pending_profile' && step.step === 2
                        ? 'bg-amber-500 text-white'
                        : profileStatus === 'pending_approval' && step.step === 3
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step.completed ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <span className="text-xs font-medium">{step.step}</span>
                    )}
                  </div>
                  <span className={`ml-2 text-xs ${
                    step.completed ? 'text-green-600 font-medium' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 w-8 mx-3 ${
                      step.completed ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {getRoleDisplayName(userRole)} Registration
            </div>
            <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
              <Link href={config.actionPath}>
                {config.actionText}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Alert>
  )
}