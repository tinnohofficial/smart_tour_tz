"use client"

import { forwardRef } from "react"
import PhoneInput from "react-phone-number-input"
import { cn } from "@/lib/utils"
import "react-phone-number-input/style.css"

const PhoneInputComponent = forwardRef(({ className, defaultCountry = "TZ", onChange, ...props }, ref) => {
  const handleChange = (value) => {
    onChange?.(value)
  }

  return (
    <PhoneInput
      ref={ref}
      defaultCountry={defaultCountry}
      international
      withCountryCallingCode
      onChange={handleChange}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      countrySelectProps={{
        className: "text-sm"
      }}
      numberInputProps={{
        className: "flex-1 border-0 bg-transparent px-0 focus:outline-none focus:ring-0"
      }}
      {...props}
    />
  )
})

PhoneInputComponent.displayName = "PhoneInput"

export { PhoneInputComponent as PhoneInput }
