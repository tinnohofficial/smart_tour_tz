// Shared loading component
import { Loader2 } from "lucide-react";

/**
 * Loading spinner component with customizable message
 * @param {Object} props - Component props
 * @param {string} props.message - Loading message (default: "Loading...")
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.size - Icon size (default: "h-8 w-8")
 * @returns {JSX.Element} Loading component
 */
export const LoadingSpinner = ({ 
  message = "Loading...", 
  className = "flex h-[70vh] items-center justify-center",
  size = "h-8 w-8"
}) => {
  return (
    <div className={className}>
      <div className="text-center">
        <Loader2 className={`${size} animate-spin text-amber-600 mx-auto`} />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
};

/**
 * Compact loading spinner for inline use
 * @param {Object} props - Component props
 * @param {string} props.message - Loading message (optional)
 * @returns {JSX.Element} Compact loading component
 */
export const CompactLoader = ({ message }) => {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-4 w-4 animate-spin text-amber-600 mr-2" />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
};
