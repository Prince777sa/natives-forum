"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, TrendingUp, Activity, Lock, CheckCircle, Settings, BarChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AdminDashboard = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [membershipInput, setMembershipInput] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInitiatives: 0,
    totalPledges: 0,
    totalAmount: 0
  });

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!isLoading && (!isAuthenticated || user?.email !== 'admin@nativesforum.org')) {
      router.push('/');
      return;
    }

    // Fetch admin stats once verified
    if (isVerified) {
      fetchAdminStats();
    }
  }, [isAuthenticated, user, isLoading, router, isVerified]);

  const fetchAdminStats = async () => {
    try {
      // Use existing stats API
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats({
          totalUsers: data.activeMembers,
          totalInitiatives: data.totalInitiatives,
          totalPledges: 0, // Will add pledge stats later
          totalAmount: 0
        });
      }

      // Fetch initiatives data
      const initiativesRes = await fetch('/api/initiatives');
      if (initiativesRes.ok) {
        const initiativesData = await initiativesRes.json();
        // Calculate total pledges and amounts from initiatives
        let totalPledges = 0;
        let totalAmount = 0;
        initiativesData.initiatives.forEach((init: any) => {
          totalPledges += init.currentParticipants || 0;
          totalAmount += init.currentAmount || 0;
        });
        setStats(prev => ({
          ...prev,
          totalPledges,
          totalAmount
        }));
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  };

  const handleMembershipVerification = () => {
    // Verify membership number matches the user's membership number
    if (membershipInput === user?.membershipNumber) {
      setIsVerified(true);
      setVerificationError('');
    } else {
      setVerificationError('Invalid membership number. Please try again.');
      setMembershipInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMembershipVerification();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-4">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.email !== 'admin@nativesforum.org') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-4">Access Denied</div>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 rounded-none border-black">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-600 rounded-none flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin Verification Required
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Please enter your membership number to access the admin dashboard
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="membership" className="block text-sm font-medium text-gray-700 mb-2">
                Membership Number
              </label>
              <Input
                id="membership"
                type="text"
                value={membershipInput}
                onChange={(e) => setMembershipInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your membership number"
                className="rounded-none border-black"
                autoFocus
              />
              {verificationError && (
                <p className="text-red-600 text-sm mt-2">{verificationError}</p>
              )}
            </div>
            <Button
              onClick={handleMembershipVerification}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-none"
              disabled={!membershipInput.trim()}
            >
              <Shield className="h-4 w-4 mr-2" />
              Verify Access
            </Button>
            <div className="text-center pt-4">
              <p className="text-xs text-gray-500">
                Logged in as: {user?.email}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-600 rounded-none flex items-center justify-center mr-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.firstName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Verified #{user?.membershipNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-none border-black">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-none flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-black">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-600 rounded-none flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Initiatives</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInitiatives}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-black">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-600 rounded-none flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pledges</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPledges.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-black">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#cdf556] rounded-none flex items-center justify-center">
                  <span className="text-lg font-bold text-black">R</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R{stats.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-none border-black">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/admin/users">
                <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-none justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/initiatives">
                <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-none justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Manage Initiatives
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-none justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Pledge Analytics
                </Button>
              </Link>
              <Link href="/admin/pledges">
                <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-none justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Pledges
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-none border-black">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center text-gray-600 py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Activity monitoring coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;