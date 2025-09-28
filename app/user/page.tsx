"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditableProfileAvatar } from '@/components/EditableProfileAvatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  User,
  MapPin,
  Calendar,
  Vote,
  MessageSquare,
  Heart,
  Building2,
  Settings,
  Edit,
  Shield,
  Users,
  Activity,
  Bell,
  Save,
  X,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';
import { useAuth, withAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Image from 'next/image';

const UserDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [currentUser, setCurrentUser] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    province: user?.province || '',
    willingToVolunteer: user?.willingToVolunteer || false,
    twitterHandle: user?.twitter_handle || '',
    instagramHandle: user?.instagram_handle || '',
    linkedinProfile: user?.linkedin_profile || ''
  });

  // User activity data - all useState hooks must be at the top
  const [userStats, setUserStats] = useState({
    totalVotes: 0,
    totalComments: 0,
    totalRsvps: 0,
    totalLikes: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [provinceStats, setProvinceStats] = useState({
    activeMembers: 0,
    recentVotes: 0,
    localInitiatives: 0
  });
  const [activityLoading, setActivityLoading] = useState(true);

  // Fetch user activity data
  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        const response = await fetch('/api/user/activity');
        if (response.ok) {
          const data = await response.json();
          setUserStats(data.stats);
          setRecentActivity(data.recentActivity);
          setProvinceStats(data.provinceStats);
        }
      } catch (error) {
        console.error('Failed to fetch user activity:', error);
      } finally {
        setActivityLoading(false);
      }
    };

    if (user) {
      fetchUserActivity();
    }
  }, [user]);

  if (!user) return null;

  // Update local user state when profile image changes
  const handleImageUpdate = (newImageUrl: string) => {
    setCurrentUser(prev => prev ? { ...prev, profile_image_url: newImageUrl } : null);
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data when canceling
      setEditForm({
        firstName: user.firstName,
        lastName: user.lastName,
        province: user.province,
        willingToVolunteer: user.willingToVolunteer,
        twitterHandle: user.twitter_handle || '',
        instagramHandle: user.instagram_handle || '',
        linkedinProfile: user.linkedin_profile || ''
      });
    }
    setIsEditing(!isEditing);
  };

  // Handle form submission
  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile updated successfully!');
        await refreshUser();
        setIsEditing(false);
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form field changes
  const handleFormChange = (field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
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

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'poll_vote':
        return Vote;
      case 'poll_comment':
      case 'blog_comment':
      case 'event_comment':
        return MessageSquare;
      case 'blog_like':
        return Heart;
      case 'event_rsvp':
        return Calendar;
      default:
        return Activity;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-black text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 bg-orange-600 flex items-center justify-center text-3xl font-bold">
              {currentUser && <EditableProfileAvatar user={currentUser} onImageUpdate={handleImageUpdate} />}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-white text-sm">First Name</Label>
                      <Input
                        id="firstName"
                        value={editForm.firstName}
                        onChange={(e) => handleFormChange('firstName', e.target.value)}
                        className="bg-white text-black rounded-none border-white"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-white text-sm">Last Name</Label>
                      <Input
                        id="lastName"
                        value={editForm.lastName}
                        onChange={(e) => handleFormChange('lastName', e.target.value)}
                        className="bg-white text-black rounded-none border-white"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="province" className="text-white text-sm ">Province</Label>
                    <Select value={editForm.province} onValueChange={(value) => handleFormChange('province', value)}>
                      <SelectTrigger className="bg-white rounded-none text-black border-white">
                        <SelectValue placeholder="Select your province" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eastern-cape">Eastern Cape</SelectItem>
                        <SelectItem value="free-state">Free State</SelectItem>
                        <SelectItem value="gauteng">Gauteng</SelectItem>
                        <SelectItem value="kwazulu-natal">KwaZulu-Natal</SelectItem>
                        <SelectItem value="limpopo">Limpopo</SelectItem>
                        <SelectItem value="mpumalanga">Mpumalanga</SelectItem>
                        <SelectItem value="northern-cape">Northern Cape</SelectItem>
                        <SelectItem value="north-west">North West</SelectItem>
                        <SelectItem value="western-cape">Western Cape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="volunteer"
                      checked={editForm.willingToVolunteer}
                      onCheckedChange={(checked) => handleFormChange('willingToVolunteer', checked)}
                    />
                    <Label htmlFor="volunteer" className="text-white text-sm">
                      I am willing to volunteer for community initiatives
                    </Label>
                  </div>

                  {/* Social Media Section */}
                  <div className="space-y-4 pt-4 border-t border-gray-600">
                    <h3 className="text-white text-sm font-medium">Social Media Links (Optional)</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="twitterHandle" className="text-white text-sm flex items-center gap-2">
                          <Twitter className="h-4 w-4" />
                          Twitter Handle
                        </Label>
                        <Input
                          id="twitterHandle"
                          value={editForm.twitterHandle}
                          onChange={(e) => handleFormChange('twitterHandle', e.target.value)}
                          className="bg-white text-black rounded-none border-white"
                          placeholder="@username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="instagramHandle" className="text-white text-sm flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          Instagram Handle
                        </Label>
                        <Input
                          id="instagramHandle"
                          value={editForm.instagramHandle}
                          onChange={(e) => handleFormChange('instagramHandle', e.target.value)}
                          className="bg-white text-black rounded-none border-white"
                          placeholder="@username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedinProfile" className="text-white text-sm flex items-center gap-2">
                          <Linkedin className="h-4 w-4" />
                          LinkedIn Profile URL
                        </Label>
                        <Input
                          id="linkedinProfile"
                          value={editForm.linkedinProfile}
                          onChange={(e) => handleFormChange('linkedinProfile', e.target.value)}
                          className="bg-white text-black rounded-none border-white"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>#{user.membershipNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-2">
                    {user.firstName} {user.lastName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>#{user.membershipNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="capitalize">{user.province.replace('-', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <Badge className={`${getRoleColor(user.userRole)} border-0`}>
                      {React.createElement(getRoleIcon(user.userRole), { className: "h-3 w-3 mr-1" })}
                      {user.userRole.charAt(0).toUpperCase() + user.userRole.slice(1)}
                    </Badge>
                    {user.willingToVolunteer && (
                      <Badge variant="outline" className="border-[#cdf556] rounded-none text-[#cdf556]">
                        Volunteer Ready
                      </Badge>
                    )}
                  </div>

                  {/* Social Media Links */}
                  {(user.twitter_handle || user.instagram_handle || user.linkedin_profile) && (
                    <div className="flex items-center gap-3 mt-4">
                      {user.twitter_handle && (
                        <a
                          href={`https://twitter.com/${user.twitter_handle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors"
                        >
                          <Twitter className="h-4 w-4" />
                          <span>{user.twitter_handle}</span>
                        </a>
                      )}
                      {user.instagram_handle && (
                        <a
                          href={`https://instagram.com/${user.instagram_handle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors"
                        >
                          <Instagram className="h-4 w-4" />
                          <span>{user.instagram_handle}</span>
                        </a>
                      )}
                      {user.linkedin_profile && (
                        <a
                          href={user.linkedin_profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="bg-[#cdf556] text-black rounded-none hover:bg-[#bde345]"
                >
                  <Save className="h-4 w-4 mr-2 " />
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={handleEditToggle}
                  variant="outline"
                  className="border-white text-black hover:bg-white rounded-none hover:text-black"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleEditToggle}
                variant="outline"
                className="border-white rounded-none text-black hover:bg-white hover:text-black"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Activity Stats */}
            <Card className="border border-black rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  <Activity className="h-5 w-5" />
                  Your Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 animate-spin mx-auto">
                      <Image src="/2.png" alt="Loading..." width={32} height={32} className="h-8 w-8" />
                    </div>
                    <p className="mt-2 text-gray-600">Loading your activity...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {userStats.totalVotes}
                      </div>
                      <div className="text-sm text-gray-600">Polls Voted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-black mb-1">
                        {userStats.totalComments}
                      </div>
                      <div className="text-sm text-gray-600">Comments Posted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {userStats.totalRsvps}
                      </div>
                      <div className="text-sm text-gray-600">Events RSVPed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-black mb-1">
                        {userStats.totalLikes}
                      </div>
                      <div className="text-sm text-gray-600">Posts Liked</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border border-black rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-black">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </div>
                  <Button variant="outline" size="sm" className="border-black rounded-none text-black hover:bg-black hover:text-white">
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 animate-spin mx-auto">
                      <Image src="/2.png" alt="Loading..." width={32} height={32} className="h-8 w-8" />
                    </div>
                    <p className="mt-2 text-gray-600">Loading recent activity...</p>
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent activity yet.</p>
                    <p className="text-sm text-gray-500 mt-2">Start engaging with polls, events, and blog posts to see your activity here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => {
                      const IconComponent = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
                          <div className="w-10 h-10 bg-orange-600 flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-black">
                              <span className="font-medium">{activity.action}</span>{' '}
                              <span className="text-orange-600">{activity.target}</span>
                            </p>
                            <p className="text-sm text-gray-500">{activity.relativeDate}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-black rounded-none">
              <CardHeader>
                <CardTitle className="text-black">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="border-black rounded-none text-black hover:bg-black hover:text-white h-auto p-4 flex items-start gap-3"
                  >
                    <Vote className="h-5 w-5 mt-0.5" />
                    <div className="text-left">
                      <div className="font-medium">Vote on Initiatives</div>
                      <div className="text-sm opacity-70">Shape our collective future</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-black rounded-none text-black hover:bg-black hover:text-white h-auto p-4 flex items-start gap-3"
                  >
                    <Building2 className="h-5 w-5 mt-0.5" />
                    <div className="text-left">
                      <div className="font-medium">Make a Pledge</div>
                      <div className="text-sm opacity-70">Support our initiatives</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-black text-black rounded-none hover:bg-black hover:text-white h-auto p-4 flex items-start gap-3"
                  >
                    <MessageSquare className="h-5 w-5 mt-0.5" />
                    <div className="text-left">
                      <div className="font-medium">Join Discussions</div>
                      <div className="text-sm opacity-70">Share your thoughts</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-black text-black rounded-none hover:bg-black hover:text-white h-auto p-4 flex items-start gap-3"
                  >
                    <Users className="h-5 w-5 mt-0.5" />
                    <div className="text-left">
                      <div className="font-medium">Find Community</div>
                      <div className="text-sm opacity-70">Connect with others</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Account Settings */}
            <Card className="border border-black rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  <Settings className="h-5 w-5" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleEditToggle}
                  variant="outline"
                  className="w-full justify-start rounded-none border-black text-black hover:bg-black hover:text-white"
                >
                  <User className="h-4 w-4 mr-3" />
                  Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-none border-black text-black hover:bg-black hover:text-white"
                >
                  <Bell className="h-4 w-4 mr-3" />
                  Notifications
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-none border-black text-black hover:bg-black hover:text-white"
                >
                  <Shield className="h-4 w-4 mr-3" />
                  Privacy & Security
                </Button>
              </CardContent>
            </Card>

            {/* Membership Info */}
            <Card className="border border-black bg-[#cdf556] rounded-none">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="font-bold text-black mb-2">Membership Status</h3>
                  <div className="text-2xl font-bold text-black mb-1">
                    #{user.membershipNumber}
                  </div>
                  <p className="text-sm text-black mb-4">
                    Active Member since {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-black text-white rounded-none hover:bg-gray-800"
                  >
                    View Benefits
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Province Community */}
            <Card className="border border-black rounded-none">
              <CardHeader>
                <CardTitle className="text-black capitalize">
                  {user.province.replace('-', ' ')} Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 animate-spin mx-auto">
                      <Image src="/2.png" alt="Loading..." width={24} height={24} className="h-6 w-6" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Members</span>
                      <span className="font-bold text-black">{provinceStats.activeMembers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Recent Votes</span>
                      <span className="font-bold text-black">{provinceStats.recentVotes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Local Initiatives</span>
                      <span className="font-bold text-black">{provinceStats.localInitiatives}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 border-black text-black rounded-none hover:bg-black hover:text-white"
                    >
                      View Community
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAuth(UserDashboard);