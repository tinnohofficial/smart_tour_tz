// Shared icon components for transport types
import { Bus, Plane, Ship, Train, Car } from "lucide-react";

/**
 * Transport icon component that displays appropriate icon based on transport type
 * @param {Object} props - Component props
 * @param {string} props.type - Transport type (air, bus, train, ferry, etc.)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.color - Icon color (default: text-amber-600)
 * @returns {JSX.Element} Transport icon component
 */
export const TransportIcon = ({ type, className = "h-5 w-5", color = "text-amber-600" }) => {
  const iconClass = `${className} ${color}`;
  
  switch (type?.toLowerCase()) {
    case "air":
      return <Plane className={iconClass} />;
    case "bus":
      return <Bus className={iconClass} />;
    case "train":
      return <Train className={iconClass} />;
    case "ferry":
      return <Ship className={iconClass} />;
    default:
      return <Car className={iconClass} />;
  }
};

/**
 * Transport icon with margin for list items
 * @param {Object} props - Component props
 * @param {string} props.type - Transport type
 * @returns {JSX.Element} Transport icon with margin
 */
export const TransportIconWithMargin = ({ type }) => {
  const iconClass = "h-5 w-5 text-gray-500 mr-3";
  
  switch (type?.toLowerCase()) {
    case "air":
      return <Plane className={iconClass} />;
    case "bus":
      return <Car className={iconClass} />;
    case "train":
      return <Train className={iconClass} />;
    case "ferry":
      return <Ship className={iconClass} />;
    default:
      return <Car className={iconClass} />;
  }
};
