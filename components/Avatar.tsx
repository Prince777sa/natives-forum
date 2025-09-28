// components/Avatar.tsx - Profile image display component
"use client";

import React from 'react';
import { CldImage } from 'next-cloudinary';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: {
    initials: string;
    bgColor?: string;
  };
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

const sizePixels = {
  xs: { width: 24, height: 24 },
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
  xl: { width: 96, height: 96 },
};

export function Avatar({
  src,
  alt,
  size = 'md',
  className,
  fallback
}: AvatarProps) {
  const sizeClass = sizeClasses[size];
  const pixelSize = sizePixels[size];

  // If we have a profile image URL, display it
  if (src && src.trim() !== '') {
    // Extract public ID from Cloudinary URL if it's a full URL
    const getPublicIdFromUrl = (url: string): string => {
      if (url.includes('cloudinary.com')) {
        // Extract public ID from Cloudinary URL
        const parts = url.split('/');
        const uploadIndex = parts.findIndex(part => part === 'upload');

        if (uploadIndex !== -1) {
          // Get everything after version number (if exists)
          let publicIdPart = parts.slice(uploadIndex + 2).join('/');
          // Remove file extension
          const cleanedPublicId = publicIdPart.replace(/\.[^/.]+$/, '');
          return cleanedPublicId;
        }
      }
      // If it's already a public ID or non-Cloudinary URL, return as-is
      return url;
    };

    const publicId = getPublicIdFromUrl(src);

    try {
      return (
        <div className={cn('relative overflow-hidden', sizeClass, className)}>
          <CldImage
            src={publicId}
            alt={alt}
            width={pixelSize.width}
            height={pixelSize.height}
            crop={{
              type: 'fill',
              source: true,
              gravity: 'face',
            }}
            className="object-cover w-full h-full"
            sizes={`${pixelSize.width}px`}
          />
        </div>
      );
    } catch (error) {
      console.error('Error rendering profile image:', error);
      // Fall through to initials
    }
  }

  // Fallback to initials if no image
  const initials = fallback?.initials || alt.slice(0, 2).toUpperCase();
  const bgColor = fallback?.bgColor || 'bg-orange-600';

  return (
    <div
      className={cn(
        'flex items-center justify-center text-white font-bold',
        sizeClass,
        bgColor,
        className
      )}
    >
      {initials}
    </div>
  );
}

// Specialized navbar avatar
export function NavbarAvatar({ user }: { user: { firstName: string; lastName: string; profile_image_url?: string | null } }) {
  return (
    <Avatar
      src={user.profile_image_url}
      alt={`${user.firstName} ${user.lastName}`}
      size="sm"
      fallback={{
        initials: `${user.firstName[0]}${user.lastName[0]}`,
        bgColor: 'bg-orange-600'
      }}
      className="border border-gray-300"
    />
  );
}

// Profile page avatar (larger)
export function ProfileAvatar({ user }: { user: { firstName: string; lastName: string; profile_image_url?: string | null } }) {
  return (
    <Avatar
      src={user.profile_image_url}
      alt={`${user.firstName} ${user.lastName}`}
      size="xl"
      fallback={{
        initials: `${user.firstName[0]}${user.lastName[0]}`,
        bgColor: 'bg-orange-600'
      }}
      className="border-2 border-gray-300"
    />
  );
}