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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Users,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Plus,
  UserCheck,
  Mail,
  MapPin,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  membership_number: string;
  province: string;
  sex: string;
  user_role: string;
  verification_status: 'yes' | 'no';
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const UserManagement = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    province: '',
    sex: '',
    userRole: '',
    verificationStatus: 'no' as 'yes' | 'no'
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updatingVerification, setUpdatingVerification] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!isLoading && (!isAuthenticated || user?.email !== 'admin@nativesforum.org')) {
      router.push('/admin');
      return;
    }

    if (isAuthenticated && user?.email === 'admin@nativesforum.org') {
      fetchUsers();
    }
  }, [isAuthenticated, user, isLoading, router, pagination.currentPage, searchTerm, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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

  const openEditDialog = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setEditForm({
      firstName: userToEdit.first_name,
      lastName: userToEdit.last_name,
      email: userToEdit.email,
      province: userToEdit.province,
      sex: userToEdit.sex,
      userRole: userToEdit.user_role,
      verificationStatus: userToEdit.verification_status
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingUser) return;

    try {
      setUpdating(true);

      // Update user details
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        // Also update verification status if it changed
        if (editForm.verificationStatus !== editingUser.verification_status) {
          await fetch(`/api/admin/users/${editingUser.id}/verification`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ verification_status: editForm.verificationStatus }),
          });
        }

        setEditDialogOpen(false);
        setEditingUser(null);
        fetchUsers(); // Refresh the users list
      } else {
        const error = await response.json();
        console.error('Failed to update user:', error);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers(); // Refresh the users list
      } else {
        const error = await response.json();
        console.error('Failed to delete user:', error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleVerificationToggle = async (userId: string, newStatus: 'yes' | 'no') => {
    try {
      setUpdatingVerification(userId);
      const response = await fetch(`/api/admin/users/${userId}/verification`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verification_status: newStatus }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the users list
      } else {
        const error = await response.json();
        console.error('Failed to update verification status:', error);
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
    } finally {
      setUpdatingVerification(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
              <div className="w-10 h-10 bg-blue-600 rounded-none flex items-center justify-center mr-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage all platform users</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total Users: {pagination.totalUsers.toLocaleString()}
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
                <UserCheck className="h-5 w-5" />
                All Users
              </CardTitle>

              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users..."
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
                <div className="text-lg text-gray-600">Loading users...</div>
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
                          onClick={() => handleSort('membership_number')}
                        >
                          <div className="flex items-center gap-2">
                            Member #
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                          onClick={() => handleSort('first_name')}
                        >
                          <div className="flex items-center gap-2">
                            Name
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                          onClick={() => handleSort('email')}
                        >
                          <div className="flex items-center gap-2">
                            Email
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="border-r border-gray-200">Province</TableHead>
                        <TableHead className="border-r border-gray-200">Sex</TableHead>
                        <TableHead className="border-r border-gray-200">Role</TableHead>
                        <TableHead className="border-r border-gray-200">Verification</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center gap-2">
                            Joined
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium border-r border-gray-100">
                            #{user.membership_number}
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold text-gray-600">
                                  {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                                </span>
                              </div>
                              {user.first_name} {user.last_name}
                            </div>
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4 text-gray-400" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {user.province}
                            </div>
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <Badge variant="outline" className="rounded-none">
                              {user.sex}
                            </Badge>
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <Badge
                              variant={user.user_role === 'admin' ? 'destructive' : 'default'}
                              className="rounded-none"
                            >
                              {user.user_role}
                            </Badge>
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerificationToggle(user.id, user.verification_status === 'yes' ? 'no' : 'yes')}
                                disabled={updatingVerification === user.id}
                                className={`rounded-none border ${user.verification_status === 'yes'
                                  ? 'border-green-500 text-green-600 hover:bg-green-50'
                                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {updatingVerification === user.id ? (
                                  'Updating...'
                                ) : (
                                  <>
                                    {user.verification_status === 'yes' && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {user.verification_status === 'yes' ? 'Verified' : 'Unverified'}
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="border-r border-gray-100">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {formatDate(user.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                                className="rounded-none border-blue-500 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              {user.email !== 'admin@nativesforum.org' && (
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
                                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete {user.first_name} {user.last_name}?
                                        This action cannot be undone and will also delete all associated data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="bg-red-600 hover:bg-red-700 rounded-none"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
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
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers)} of{' '}
                    {pagination.totalUsers} users
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

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="rounded-none max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <Input
                      value={editForm.firstName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="rounded-none border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <Input
                      value={editForm.lastName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="rounded-none border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="rounded-none border-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Province</label>
                    <Select
                      value={editForm.province}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, province: value }))}
                    >
                      <SelectTrigger className="rounded-none border-black">
                        <SelectValue placeholder="Select province" />
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

                  <div>
                    <label className="block text-sm font-medium mb-2">Sex</label>
                    <Select
                      value={editForm.sex}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, sex: value }))}
                    >
                      <SelectTrigger className="rounded-none border-black">
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Role</label>
                    <Select
                      value={editForm.userRole}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, userRole: value }))}
                    >
                      <SelectTrigger className="rounded-none border-black">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Verification Status</label>
                    <Select
                      value={editForm.verificationStatus}
                      onValueChange={(value: 'yes' | 'no') => setEditForm(prev => ({ ...prev, verificationStatus: value }))}
                    >
                      <SelectTrigger className="rounded-none border-black">
                        <SelectValue placeholder="Select verification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">Unverified</SelectItem>
                        <SelectItem value="yes">Verified</SelectItem>
                      </SelectContent>
                    </Select>
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
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-none"
                  >
                    {updating ? 'Updating...' : 'Update User'}
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

export default UserManagement;