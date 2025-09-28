import React from 'react';
import { RiVerifiedBadgeFill } from "react-icons/ri";

interface VerificationBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  inline?: boolean; // New prop to control positioning
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  isVerified,
  size = 'md',
  className = '',
  inline = false
}) => {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <RiVerifiedBadgeFill
      className={`${sizeClasses[size]} text-[#cdf556] ${inline ? 'relative' : 'absolute -top-0.5 -right-0.5 z-50'} ${className}`}
      title="Verified User"
    />
  );
};

export default VerificationBadge;