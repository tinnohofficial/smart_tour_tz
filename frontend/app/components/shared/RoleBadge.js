// Shared role badge components
import { Badge } from "@/components/ui/badge";
import { User, Hotel, Briefcase } from "lucide-react";

/**
 * Role badge component that displays appropriate badge based on user role
 * @param {Object} props - Component props
 * @param {string} props.role - User role (tour_guide, hotel_manager, travel_agent, etc.)
 * @param {string} props.variant - Badge variant (default: outline)
 * @returns {JSX.Element} Role badge component
 */
export const RoleBadge = ({ role, variant = "outline" }) => {
  switch (role) {
    case "tour_guide":
      return (
        <Badge variant={variant} className="flex items-center gap-1">
          <User className="h-3 w-3" /> Tour Guide
        </Badge>
      );
    case "hotel_manager":
      return (
        <Badge variant={variant} className="flex items-center gap-1">
          <Hotel className="h-3 w-3" /> Hotel Manager
        </Badge>
      );
    case "travel_agent":
      return (
        <Badge variant={variant} className="flex items-center gap-1">
          <Briefcase className="h-3 w-3" /> Travel Agent
        </Badge>
      );
    default:
      return <Badge variant={variant}>{role}</Badge>;
  }
};
