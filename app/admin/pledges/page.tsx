'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Filter,
  Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Pledge {
  id: string;
  amount: number;
  beneficiaryName: string;
  relationship: string;
  gender?: string;
  province: string;
  createdAt: string;
  pledger: {
    name: string;
    membershipNumber: string;
    email: string;
  };
  initiative: {
    id: string;
    title: string;
    status: string;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalPledges: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface Initiative {
  id: string;
  title: string;
}

const PledgeManagement = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalPledges: 0,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInitiative, setSelectedInitiative] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const provinces = [
    'eastern-cape', 'free-state', 'gauteng', 'kwazulu-natal',
    'limpopo', 'mpumalanga', 'northern-cape', 'north-west', 'western-cape'
  ];

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!isLoading && (!isAuthenticated || user?.email !== 'admin@nativesforum.org')) {
      router.push('/admin');
      return;
    }

    if (isAuthenticated && user?.email === 'admin@nativesforum.org') {
      fetchInitiatives();
      fetchPledges();
    }
  }, [isAuthenticated, user, isLoading, router, pagination.currentPage, searchTerm, selectedInitiative, selectedProvince, sortBy, sortOrder]);

  const fetchInitiatives = async () => {
    try {
      const response = await fetch('/api/initiatives');
      if (response.ok) {
        const data = await response.json();
        setInitiatives(data.initiatives.map((init: any) => ({
          id: init.id,
          title: init.title
        })));
      }
    } catch (error) {
      console.error('Error fetching initiatives:', error);
    }
  };

  const fetchPledges = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (selectedInitiative) params.append('initiative', selectedInitiative);
      if (selectedProvince) params.append('province', selectedProvince);

      const response = await fetch(`/api/admin/pledges?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPledges(data.pledges);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch pledges');
      }
    } catch (error) {
      console.error('Error fetching pledges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const formatProvinceName = (province: string) => {
    return province.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedInitiative('');
    setSelectedProvince('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
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
              <div className="w-10 h-10 bg-green-600 rounded-none flex items-center justify-center mr-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pledge Management</h1>
                <p className="text-gray-600">View and manage all pledges</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total Pledges: {pagination.totalPledges.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="rounded-none border-black">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Pledges
              </CardTitle>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search pledgers, beneficiaries, or initiatives..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 rounded-none border-black"
                  />
                </div>

                {/* Initiative Filter */}
                <Select value={selectedInitiative} onValueChange={setSelectedInitiative}>
                  <SelectTrigger className="w-60 rounded-none border-black">
                    <SelectValue placeholder="Filter by initiative" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Initiatives</SelectItem>
                    {initiatives.map((initiative) => (
                      <SelectItem key={initiative.id} value={initiative.id}>
                        {initiative.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Province Filter */}
                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger className="w-48 rounded-none border-black">
                    <SelectValue placeholder="Filter by province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Provinces</SelectItem>
                    {provinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {formatProvinceName(province)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {(searchTerm || selectedInitiative || selectedProvince) && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="rounded-none border-black"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg text-gray-600">Loading pledges...</div>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="border border-black rounded-none overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead
                          className="cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                          onClick={() => handleSort('pledger_name')}
                        >
                          <div className="flex items-center gap-2">
                            Pledger
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="border-r border-gray-200">Beneficiary</TableHead>
                        <TableHead className="border-r border-gray-200">Initiative</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                          onClick={() => handleSort('amount')}
                        >
                          <div className="flex items-center gap-2">
                            Amount
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="border-r border-gray-200">Province</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center gap-2">
                            Date
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pledges.map((pledge) => (
                        <TableRow key={pledge.id} className="hover:bg-gray-50">
                          <TableCell className="border-r border-gray-100">
                            <div>
                              <div className="font-medium text-gray-900">{pledge.pledger.name}</div>
                              <div className="text-sm text-gray-500">
                                #{pledge.pledger.membershipNumber}
                              </div>
                              <div className="text-sm text-gray-500">{pledge.pledger.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <div>
                              <div className="font-medium text-gray-900">{pledge.beneficiaryName}</div>
                              <div className="text-sm text-gray-500">
                                {pledge.relationship}
                                {pledge.gender && ` • ${pledge.gender}`}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <div>
                              <div className="font-medium text-gray-900 truncate max-w-xs">
                                {pledge.initiative.title}
                              </div>
                              <Badge className={`rounded-none ${getStatusColor(pledge.initiative.status)}`}>
                                {pledge.initiative.status.charAt(0).toUpperCase() + pledge.initiative.status.slice(1)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(pledge.amount)}
                            </div>
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {formatProvinceName(pledge.province)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {formatDate(pledge.createdAt)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalPledges)} of{' '}
                    {pagination.totalPledges} pledges
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPreviousPage}
                      className="rounded-none border-black"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>

                    <span className="text-sm text-gray-600">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="rounded-none border-black"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PledgeManagement;