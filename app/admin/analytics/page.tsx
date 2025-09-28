'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  MapPin,
  Star,
  ChevronLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AnalyticsData {
  overallStats: {
    totalPledges: number;
    totalAmount: number;
    uniquePledgers: number;
    averagePledge: number;
    initiativesWithPledges: number;
    malePledges: number;
    femalePledges: number;
    unspecifiedGender: number;
  };
  initiativeStats: Array<{
    id: string;
    title: string;
    status: string;
    pledgeCount: number;
    totalAmount: number;
    uniquePledgers: number;
    targetAmount: number;
    targetParticipants: number;
    amountProgress: number;
    participantProgress: number;
  }>;
  provinceStats: Array<{
    province: string;
    pledgeCount: number;
    totalAmount: number;
    uniquePledgers: number;
    averagePledge: number;
  }>;
  trends: Array<{
    date: string;
    pledges: number;
    amount: number;
    uniquePledgers: number;
  }>;
  topPledgers: Array<{
    name: string;
    membershipNumber: string;
    province: string;
    pledgeCount: number;
    totalAmount: number;
  }>;
  amountDistribution: Array<{
    range: string;
    count: number;
    amount: number;
  }>;
  recentPledges: Array<{
    id: string;
    amount: number;
    beneficiaryName: string;
    relationship: string;
    province: string;
    createdAt: string;
    pledgerName: string;
    membershipNumber: string;
    initiativeTitle: string;
  }>;
}

const PledgeAnalytics = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeRange: timeRange
      });

      const response = await fetch(`/api/admin/analytics/pledges?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        console.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!isLoading && (!isAuthenticated || user?.email !== 'admin@nativesforum.org')) {
      router.push('/admin');
      return;
    }

    if (isAuthenticated && user?.email === 'admin@nativesforum.org') {
      fetchAnalytics();
    }
  }, [isAuthenticated, user, isLoading, router, timeRange, fetchAnalytics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-4">Loading analytics...</div>
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

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-4">No data available</div>
        </div>
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
              <Link href="/admin" className="mr-4">
                <Button variant="outline" size="sm" className="border-gray-300 rounded-none">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="w-10 h-10 bg-orange-600 rounded-none flex items-center justify-center mr-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pledge Analytics</h1>
                <p className="text-gray-600">Comprehensive pledge data and insights</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40 rounded-none border-black">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-none border-black">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-none flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pledges</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overallStats.totalPledges.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-black">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-600 rounded-none flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.overallStats.totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-black">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-600 rounded-none flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unique Pledgers</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overallStats.uniquePledgers.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-black">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#cdf556] rounded-none flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-black" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Pledge</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.overallStats.averagePledge)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Initiative Performance */}
          <Card className="rounded-none border-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Initiative Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.initiativeStats.slice(0, 5).map((initiative) => (
                  <div key={initiative.id} className="border-b border-gray-100 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 truncate">{initiative.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`rounded-none ${getStatusColor(initiative.status)}`}>
                            {initiative.status.charAt(0).toUpperCase() + initiative.status.slice(1)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {initiative.pledgeCount} pledges
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{formatCurrency(initiative.totalAmount)}</div>
                        <div className="text-sm text-gray-500">{initiative.amountProgress.toFixed(1)}% of target</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 h-2">
                      <div
                        className="bg-[#cdf556] h-2"
                        style={{ width: `${Math.min(initiative.amountProgress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Province Breakdown */}
          <Card className="rounded-none border-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Province Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.provinceStats.slice(0, 6).map((province) => (
                  <div key={province.province} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">{province.province}</div>
                      <div className="text-sm text-gray-500">{province.pledgeCount} pledges</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(province.totalAmount)}</div>
                      <div className="text-sm text-gray-500">Avg: {formatCurrency(province.averagePledge)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Amount Distribution & Top Pledgers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Amount Distribution */}
          <Card className="rounded-none border-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Pledge Amount Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.amountDistribution.map((range) => (
                  <div key={range.range} className="flex justify-between items-center">
                    <div className="font-medium text-gray-900">{range.range}</div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{range.count} pledges</div>
                      <div className="text-sm text-gray-500">{formatCurrency(range.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Pledgers */}
          <Card className="rounded-none border-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Top Pledgers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.topPledgers.map((pledger, index) => (
                  <div key={pledger.membershipNumber} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{pledger.name}</div>
                        <div className="text-sm text-gray-500">#{pledger.membershipNumber} • {pledger.province}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(pledger.totalAmount)}</div>
                      <div className="text-sm text-gray-500">{pledger.pledgeCount} pledges</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Pledges */}
        <Card className="rounded-none border-black">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Pledges
              </CardTitle>
              <Link href="/admin/pledges">
                <Button variant="outline" className="rounded-none border-black">
                  View All Pledges
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border border-black rounded-none overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="border-r border-gray-200">Pledger</TableHead>
                    <TableHead className="border-r border-gray-200">Beneficiary</TableHead>
                    <TableHead className="border-r border-gray-200">Initiative</TableHead>
                    <TableHead className="border-r border-gray-200">Amount</TableHead>
                    <TableHead className="border-r border-gray-200">Province</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.recentPledges.slice(0, 10).map((pledge) => (
                    <TableRow key={pledge.id} className="hover:bg-gray-50">
                      <TableCell className="border-r border-gray-100">
                        <div>
                          <div className="font-medium text-gray-900">{pledge.pledgerName}</div>
                          <div className="text-sm text-gray-500">#{pledge.membershipNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-gray-100">
                        <div>
                          <div className="font-medium text-gray-900">{pledge.beneficiaryName}</div>
                          <div className="text-sm text-gray-500">{pledge.relationship}</div>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-gray-100">
                        <div className="font-medium text-gray-900 truncate max-w-xs">{pledge.initiativeTitle}</div>
                      </TableCell>
                      <TableCell className="border-r border-gray-100">
                        <div className="font-semibold text-gray-900">{formatCurrency(pledge.amount)}</div>
                      </TableCell>
                      <TableCell className="border-r border-gray-100">
                        <div className="text-gray-900">{pledge.province}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-900">{formatDate(pledge.createdAt)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PledgeAnalytics;