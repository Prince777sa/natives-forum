'use client';
import React, { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Target,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Users,
  DollarSign,
  Calendar,
  Star,
  Building2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Initiative {
  id: string;
  title: string;
  description: string;
  content?: string;
  status: string;
  category: {
    name: string;
    slug: string;
  };
  author: string;
  targetParticipants: number;
  currentParticipants: number;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  endDate?: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalInitiatives: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const InitiativeManagement = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalInitiatives: 0,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Edit initiative state
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    content: '',
    status: '',
    targetParticipants: 0,
    targetAmount: 0,
    featured: false
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchInitiatives = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      const response = await fetch(`/api/admin/initiatives?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInitiatives(data.initiatives);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch initiatives');
      }
    } catch (error) {
      console.error('Error fetching initiatives:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!isLoading && (!isAuthenticated || user?.email !== 'admin@nativesforum.org')) {
      router.push('/admin');
      return;
    }

    if (isAuthenticated && user?.email === 'admin@nativesforum.org') {
      fetchInitiatives();
    }
  }, [isAuthenticated, user, isLoading, router, pagination.currentPage, searchTerm, sortBy, sortOrder, fetchInitiatives]);

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

  const openEditDialog = (initiativeToEdit: Initiative) => {
    setEditingInitiative(initiativeToEdit);
    setEditForm({
      title: initiativeToEdit.title,
      description: initiativeToEdit.description,
      content: initiativeToEdit.content || '',
      status: initiativeToEdit.status,
      targetParticipants: initiativeToEdit.targetParticipants,
      targetAmount: initiativeToEdit.targetAmount,
      featured: initiativeToEdit.featured
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingInitiative) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/initiatives/${editingInitiative.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setEditDialogOpen(false);
        setEditingInitiative(null);
        fetchInitiatives(); // Refresh the initiatives list
      } else {
        const error = await response.json();
        console.error('Failed to update initiative:', error);
      }
    } catch (error) {
      console.error('Error updating initiative:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteInitiative = async (initiativeId: string) => {
    try {
      const response = await fetch(`/api/admin/initiatives/${initiativeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchInitiatives(); // Refresh the initiatives list
      } else {
        const error = await response.json();
        console.error('Failed to delete initiative:', error);
      }
    } catch (error) {
      console.error('Error deleting initiative:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
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
              <div className="w-10 h-10 bg-orange-600 rounded-none flex items-center justify-center mr-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Initiative Management</h1>
                <p className="text-gray-600">Manage all platform initiatives</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total Initiatives: {pagination.totalInitiatives.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="rounded-none border-black">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                All Initiatives
              </CardTitle>

              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search initiatives..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-64 rounded-none border-black"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg text-gray-600">Loading initiatives...</div>
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
                          onClick={() => handleSort('title')}
                        >
                          <div className="flex items-center gap-2">
                            Title
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="border-r border-gray-200">Status</TableHead>
                        <TableHead className="border-r border-gray-200">Participants</TableHead>
                        <TableHead className="border-r border-gray-200">Target Amount</TableHead>
                        <TableHead className="border-r border-gray-200">Featured</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center gap-2">
                            Created
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {initiatives.map((initiative) => (
                        <TableRow key={initiative.id} className="hover:bg-gray-50">
                          <TableCell className="border-r border-gray-100">
                            <div>
                              <div className="font-medium text-gray-900">{initiative.title}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {initiative.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <Badge className={`rounded-none ${getStatusColor(initiative.status)}`}>
                              {initiative.status.charAt(0).toUpperCase() + initiative.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>{initiative.currentParticipants.toLocaleString()}</span>
                              <span className="text-gray-400">/ {initiative.targetParticipants.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 h-1 mt-1">
                              <div
                                className="bg-[#cdf556] h-1"
                                style={{ width: `${getProgressPercentage(initiative.currentParticipants, initiative.targetParticipants)}%` }}
                              ></div>
                            </div>
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              {formatCurrency(initiative.targetAmount)}
                            </div>
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            {initiative.featured ? (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            ) : (
                              <Star className="h-4 w-4 text-gray-300" />
                            )}
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {formatDate(initiative.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(initiative)}
                                className="rounded-none border-blue-500 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-none border-red-500 text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-none">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Initiative</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete &quot;{initiative.title}&quot;?
                                      This action cannot be undone and will also delete all associated pledges.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteInitiative(initiative.id)}
                                      className="bg-red-600 hover:bg-red-700 rounded-none"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalInitiatives)} of{' '}
                    {pagination.totalInitiatives} initiatives
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

        {/* Edit Initiative Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="rounded-none max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Initiative</DialogTitle>
            </DialogHeader>
            {editingInitiative && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="rounded-none border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="rounded-none border-black"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Content (Optional)</label>
                  <Textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    className="rounded-none border-black"
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <Select
                      value={editForm.status}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="rounded-none border-black">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Featured</label>
                    <Select
                      value={editForm.featured.toString()}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, featured: value === 'true' }))}
                    >
                      <SelectTrigger className="rounded-none border-black">
                        <SelectValue placeholder="Select featured status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Participants</label>
                    <Input
                      type="number"
                      value={editForm.targetParticipants}
                      onChange={(e) => setEditForm(prev => ({ ...prev, targetParticipants: parseInt(e.target.value) || 0 }))}
                      className="rounded-none border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Target Amount (ZAR)</label>
                    <Input
                      type="number"
                      value={editForm.targetAmount}
                      onChange={(e) => setEditForm(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
                      className="rounded-none border-black"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    className="rounded-none border-black"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEditSubmit}
                    disabled={updating}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                  >
                    {updating ? 'Updating...' : 'Update Initiative'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InitiativeManagement;