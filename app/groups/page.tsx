"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, MapPin, Calendar, Plus, Search, UserPlus, UserCheck, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

interface Group {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  province: string;
  memberCount: number;
  leader: {
    id: string;
    firstName: string;
    lastName: string;
    membershipNumber: string;
  };
  isMember: boolean;
  createdAt: string;
}

const GroupsPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create group dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupLocation, setGroupLocation] = useState('');
  const [groupProvince, setGroupProvince] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit group dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const { isAuthenticated, user } = useAuth();

  const provinces = [
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'North West',
    'Northern Cape',
    'Western Cape'
  ];

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups', {
        credentials: 'include',
      });
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !groupDescription.trim() || !groupLocation.trim() || !groupProvince) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim(),
          location: groupLocation.trim(),
          province: groupProvince,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setGroups([result.group, ...groups]);
        setGroupName('');
        setGroupDescription('');
        setGroupLocation('');
        setGroupProvince('');
        setCreateDialogOpen(false);
        toast.success('Group created successfully!');
      } else {
        toast.error(result.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinGroup = async (groupSlug: string, groupName: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to join groups');
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupSlug}/join`, {
        method: 'POST',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok) {
        setGroups(groups.map(g =>
          g.slug === groupSlug
            ? { ...g, isMember: true, memberCount: g.memberCount + 1 }
            : g
        ));
        toast.success(`You've joined ${groupName}!`);
      } else {
        toast.error(result.error || 'Failed to join group');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const handleLeaveGroup = async (groupSlug: string, groupName: string) => {
    try {
      const response = await fetch(`/api/groups/${groupSlug}/leave`, {
        method: 'POST',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok) {
        setGroups(groups.map(g =>
          g.slug === groupSlug
            ? { ...g, isMember: false, memberCount: Math.max(0, g.memberCount - 1) }
            : g
        ));
        toast.success(`You've left ${groupName}`);
      } else {
        toast.error(result.error || 'Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditDescription(group.description);
    setEditLocation(group.location);
    setEditProvince(group.province);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingGroup || !editName.trim() || !editDescription.trim() || !editLocation.trim() || !editProvince) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmittingEdit(true);
    try {
      const response = await fetch(`/api/groups/${editingGroup.slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
          location: editLocation.trim(),
          province: editProvince,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setGroups(groups.map(g =>
          g.id === editingGroup.id
            ? { ...g, name: editName, description: editDescription, location: editLocation, province: editProvince }
            : g
        ));
        setEditDialogOpen(false);
        setEditingGroup(null);
        toast.success('Group updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update group');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteGroup = (group: Group) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;

    setDeletingGroup(true);
    try {
      const response = await fetch(`/api/groups/${groupToDelete.slug}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok) {
        setGroups(groups.filter(g => g.id !== groupToDelete.id));
        toast.success('Group deleted successfully');
        setDeleteDialogOpen(false);
        setGroupToDelete(null);
      } else {
        toast.error(result.error || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setDeletingGroup(false);
    }
  };

  // Filter groups based on search
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return groups;

    const query = searchQuery.toLowerCase();
    return groups.filter(group =>
      group.name.toLowerCase().includes(query) ||
      group.description.toLowerCase().includes(query) ||
      group.location.toLowerCase().includes(query) ||
      group.province.toLowerCase().includes(query)
    );
  }, [groups, searchQuery]);

  const canCreateGroup = user && (user.userRole === 'staff' || user.userRole === 'admin');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-12 h-12 animate-spin mx-auto">
              <Image src="/2.png" alt="Loading..." width={48} height={48} className="h-12 w-12" />
            </div>
            <p className="mt-2 text-gray-600">Loading groups...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Community Groups
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join a local group to connect with members in your area, attend events, and participate in community activities.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{groups.length}</div>
              <div className="text-sm text-gray-600">Active Groups</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {groups.reduce((sum, g) => sum + g.memberCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search groups by name, location, or province..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-black rounded-none"
              />
            </div>
          </div>

          {/* Create Branch Button - Only for staff */}
          {canCreateGroup && (
            <div className="mb-8">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-none">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-none">
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Group Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Johannesburg Central Group"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="border-black rounded-none"
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your group and its purpose..."
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        className="border-black rounded-none resize-none min-h-[100px]"
                        maxLength={500}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="e.g., Sandton, Johannesburg"
                        value={groupLocation}
                        onChange={(e) => setGroupLocation(e.target.value)}
                        className="border-black rounded-none"
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Province</Label>
                      <select
                        id="province"
                        value={groupProvince}
                        onChange={(e) => setGroupProvince(e.target.value)}
                        className="w-full border border-black rounded-none px-3 py-2 bg-white"
                      >
                        <option value="">Select Province</option>
                        {provinces.map((province) => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      className="rounded-none"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateGroup}
                      disabled={submitting}
                      className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                    >
                      {submitting ? 'Creating...' : 'Create Group'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Edit Group Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl rounded-none">
              <DialogHeader>
                <DialogTitle>Edit Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Group Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="e.g., Johannesburg Central Branch"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border-black rounded-none"
                    maxLength={200}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Describe your group and its purpose..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="border-black rounded-none resize-none min-h-[100px]"
                    maxLength={500}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    placeholder="e.g., Sandton, Johannesburg"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="border-black rounded-none"
                    maxLength={200}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-province">Province</Label>
                  <select
                    id="edit-province"
                    value={editProvince}
                    onChange={(e) => setEditProvince(e.target.value)}
                    className="w-full border border-black rounded-none px-3 py-2 bg-white"
                  >
                    <option value="">Select Province</option>
                    {provinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="rounded-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSubmit}
                  disabled={submittingEdit}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                >
                  {submittingEdit ? 'Updating...' : 'Update Group'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="max-w-md rounded-none">
              <DialogHeader>
                <DialogTitle>Delete Group</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-gray-600">
                  Are you sure you want to delete <strong>{groupToDelete?.name}</strong>? This action cannot be undone and all group data will be lost.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  className="rounded-none"
                  disabled={deletingGroup}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteGroup}
                  disabled={deletingGroup}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-none"
                >
                  {deletingGroup ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Groups List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.length === 0 ? (
            <div className="col-span-full">
              <Card className="text-center py-12 rounded-none">
                <CardContent>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchQuery ? 'No groups found' : 'No groups yet'}
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery
                      ? 'Try adjusting your search'
                      : 'Be the first to create a group!'}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <Card
                key={group.id}
                className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow duration-200 rounded-none"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-900">
                        <Link
                          href={`/groups/${group.slug}`}
                          className="hover:text-orange-600 transition-colors"
                        >
                          {group.name}
                        </Link>
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="border-orange-400 text-orange-700">
                          <MapPin className="h-3 w-3 mr-1" />
                          {group.location}
                        </Badge>
                        <Badge variant="outline">
                          {group.province}
                        </Badge>
                      </div>
                    </div>

                    {/* Edit/Delete Dropdown - Only show for group leader or admin */}
                    {isAuthenticated && user && (user.id === group.leader.id || user.userRole === 'admin') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Group
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteGroup(group)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {group.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</span>
                    </div>
                    <div className="text-xs">
                      Led by {group.leader.firstName} {group.leader.lastName}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-gray-50 border-t flex gap-2">
                  <Link href={`/groups/${group.slug}`} className="flex-1">
                    <Button variant="outline" className="w-full rounded-none border-orange-500 text-orange-600 hover:bg-orange-50">
                      View Group
                    </Button>
                  </Link>
                  {isAuthenticated && (
                    group.isMember ? (
                      <Button
                        onClick={() => handleLeaveGroup(group.slug, group.name)}
                        variant="outline"
                        className="rounded-none"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Member
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleJoinGroup(group.slug, group.name)}
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Join
                      </Button>
                    )
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupsPage;
