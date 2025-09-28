'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  MapPin,
  Calendar,
  Shield,
  Users,
  Twitter,
  Instagram,
  Linkedin,
  ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import VerificationBadge from '@/components/VerificationBadge';

interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  userRole: string;
  province: string;
  profileImageUrl?: string;
  verificationStatus: 'yes' | 'no';
  twitterHandle?: string;
  instagramHandle?: string;
  linkedinProfile?: string;
  joinedDate: string;
}

const PublicProfilePage = () => {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/public`);

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 404) {
        setError('User not found');
      } else {
        setError('Failed to load user profile');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-600 text-white';
      case 'volunteer':
        return 'bg-[#cdf556] text-black';
      default:
        return 'bg-black text-white';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Shield;
      case 'volunteer':
        return Users;
      default:
        return User;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin mx-auto mb-4">
            <Image src="/2.png" alt="Loading..." width={32} height={32} className="h-8 w-8" />
          </div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-4">Profile Not Found</div>
          <p className="text-gray-600 mb-6">{error || 'The requested user profile could not be found.'}</p>
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-none">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="border-gray-300 rounded-none mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="w-10 h-10 bg-blue-600 rounded-none flex items-center justify-center mr-4">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
              <p className="text-gray-600">Public member information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="rounded-none border-black">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                  {user.profileImageUrl ? (
                    <Image
                      src={user.profileImageUrl}
                      alt={`${user.firstName} ${user.lastName}`}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-gray-500" />
                  )}
                </div>
                <VerificationBadge
                  isVerified={user.verificationStatus === 'yes'}
                  size="lg"
                />
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {user.firstName} {user.lastName}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="capitalize">{user.province.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(user.joinedDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <Badge className={`${getRoleColor(user.userRole)} border-0`}>
                    {React.createElement(getRoleIcon(user.userRole), { className: "h-3 w-3 mr-1" })}
                    {user.userRole.charAt(0).toUpperCase() + user.userRole.slice(1)}
                  </Badge>
                </div>

                {/* Social Media Links */}
                {(user.twitterHandle || user.instagramHandle || user.linkedinProfile) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Connect</h3>
                    <div className="flex flex-wrap gap-3">
                      {user.twitterHandle && (
                        <a
                          href={`https://twitter.com/${user.twitterHandle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-none hover:bg-gray-50 transition-colors"
                        >
                          <Twitter className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-700">{user.twitterHandle}</span>
                        </a>
                      )}
                      {user.instagramHandle && (
                        <a
                          href={`https://instagram.com/${user.instagramHandle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-none hover:bg-gray-50 transition-colors"
                        >
                          <Instagram className="h-4 w-4 text-pink-500" />
                          <span className="text-sm text-gray-700">{user.instagramHandle}</span>
                        </a>
                      )}
                      {user.linkedinProfile && (
                        <a
                          href={user.linkedinProfile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-none hover:bg-gray-50 transition-colors"
                        >
                          <Linkedin className="h-4 w-4 text-blue-700" />
                          <span className="text-sm text-gray-700">LinkedIn</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <div className="bg-white border border-gray-200 rounded-none p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Member</h3>
            <p className="text-gray-600">
              This user is an active member of the NativesForum community, participating in
              democratic discussions and community-driven initiatives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;