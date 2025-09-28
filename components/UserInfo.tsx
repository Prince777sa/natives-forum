// components/UserInfo.tsx - Reusable user information display component
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import VerificationBadge from '@/components/VerificationBadge';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  membershipNumber?: string;
  userRole: string;
  profileImageUrl?: string | null;
  verificationStatus: string;
}

interface UserInfoProps {
  user: User;
  avatarSize?: 'sm' | 'md' | 'lg';
  showRole?: boolean;
  showMembershipNumber?: boolean;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

const avatarSizes = {
  sm: { size: 'w-8 h-8', iconSize: 'h-4 w-4' },
  md: { size: 'w-10 h-10', iconSize: 'h-5 w-5' },
  lg: { size: 'w-12 h-12', iconSize: 'h-6 w-6' }
};

// Helper function to get role label and styling
const getRoleLabel = (role: string | null | undefined) => {
  if (!role) {
    return { text: 'Member', color: 'border-gray-300 bg-gray-50 text-gray-700' };
  }

  const roleText = role.toLowerCase();

  switch (roleText) {
    case 'admin':
      return { text: 'Admin', color: 'border-red-300 bg-red-50 text-red-700' };
    case 'staff':
      return { text: 'Staff', color: 'border-purple-300 bg-purple-50 text-purple-700' };
    case 'leader':
      return { text: 'Leader', color: 'border-blue-300 bg-blue-50 text-blue-700' };
    case 'member':
      return { text: 'Member', color: 'border-gray-300 bg-gray-50 text-gray-700' };
    case 'regular':
      return { text: 'Member', color: 'border-gray-300 bg-gray-50 text-gray-700' };
    case 'supporter':
      return { text: 'Supporter', color: 'border-green-300 bg-green-50 text-green-700' };
    default:
      return { text: 'Member', color: 'border-gray-300 bg-gray-50 text-gray-700' };
  }
};

export default function UserInfo({
  user,
  avatarSize = 'md',
  showRole = true,
  showMembershipNumber = false,
  layout = 'horizontal',
  className = ''
}: UserInfoProps) {
  const avatarConfig = avatarSizes[avatarSize];
  const roleInfo = getRoleLabel(user.userRole);

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center space-y-2 ${className}`}>
        {/* Avatar */}
        <Link href={`/profile/${user.id}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
          <div className={`${avatarConfig.size} bg-gray-300 rounded-full flex items-center justify-center overflow-hidden`}>
            {user.profileImageUrl ? (
              <Image
                src={user.profileImageUrl}
                alt={`${user.firstName} ${user.lastName}`}
                width={avatarSize === 'sm' ? 32 : avatarSize === 'md' ? 40 : 48}
                height={avatarSize === 'sm' ? 32 : avatarSize === 'md' ? 40 : 48}
                className="w-full h-full object-cover"
              />
            ) : (
              <Users className={`${avatarConfig.iconSize} text-gray-500`} />
            )}
          </div>
        </Link>

        {/* User Info */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Link href={`/profile/${user.id}`} className="font-medium text-black hover:text-blue-600 transition-colors">
              {user.firstName} {user.lastName}
            </Link>
            <VerificationBadge
              isVerified={user.verificationStatus === 'yes'}
              size="sm"
              inline={true}
            />
          </div>

          <div className="flex items-center justify-center gap-2 mt-1">
            {showRole && (
              <Badge className={`text-xs px-2 py-0.5 border ${roleInfo.color}`}>
                {roleInfo.text}
              </Badge>
            )}
            {showMembershipNumber && user.membershipNumber && (
              <span className="text-xs text-gray-500">#{user.membershipNumber}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Avatar */}
      <Link href={`/profile/${user.id}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
        <div className={`${avatarConfig.size} bg-gray-300 rounded-full flex items-center justify-center overflow-hidden`}>
          {user.profileImageUrl ? (
            <Image
              src={user.profileImageUrl}
              alt={`${user.firstName} ${user.lastName}`}
              width={avatarSize === 'sm' ? 32 : avatarSize === 'md' ? 40 : 48}
              height={avatarSize === 'sm' ? 32 : avatarSize === 'md' ? 40 : 48}
              className="w-full h-full object-cover"
            />
          ) : (
            <Users className={`${avatarConfig.iconSize} text-gray-500`} />
          )}
        </div>
      </Link>

      {/* User Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${user.id}`} className="font-medium text-black hover:text-blue-600 transition-colors">
            {user.firstName} {user.lastName}
          </Link>
          <VerificationBadge
            isVerified={user.verificationStatus === 'yes'}
            size="sm"
            inline={true}
            className='-ml-2 -mt-3'
          />
        </div>

        <div className="flex items-center gap-2 mt-1">
          {showRole && (
            <Badge className={`text-xs px-2 py-0.5 rounded-none border ${roleInfo.color}`}>
              {roleInfo.text}
            </Badge>
          )}
          {showMembershipNumber && user.membershipNumber && (
            <span className="text-xs text-gray-500">#{user.membershipNumber}</span>
          )}
        </div>
      </div>
    </div>
  );
}