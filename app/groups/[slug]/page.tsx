"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Users, MapPin, Calendar, Plus, MessageCircle, Pin, UserPlus, UserCheck, Send, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import UserInfo from '@/components/UserInfo';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    membershipNumber: string;
    profileImageUrl?: string;
    userRole: string;
    verificationStatus: string;
  };
}

interface GroupPost {
  id: string;
  title: string;
  content: string;
  postType: 'announcement' | 'event' | 'discussion';
  eventDate?: string;
  eventLocation?: string;
  isPinned: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    membershipNumber: string;
    profileImageUrl?: string;
    userRole: string;
  };
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

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
    profileImageUrl?: string;
  };
  isMember: boolean;
  userRole?: string;
  createdAt: string;
  members: Array<{
    id: string;
    firstName: string;
    lastName: string;
    membershipNumber: string;
    profileImageUrl?: string;
    role: string;
    joinedAt: string;
  }>;
}

const GroupDetailPage = () => {
  const params = useParams();
  const slug = params.slug as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Create post dialog state
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'announcement' | 'event' | 'discussion'>('announcement');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Comments state
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});

  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchGroup();
    fetchPosts();
  }, [slug]);

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${slug}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setGroup(data.group);
      } else {
        toast.error('Branch not found');
      }
    } catch (error) {
      console.error('Error fetching group:', error);
      toast.error('Failed to load branch');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/groups/${slug}/posts`);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleJoinGroup = async () => {
    if (!group) return;

    try {
      const response = await fetch(`/api/groups/${group.slug}/join`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setGroup({ ...group, isMember: true, memberCount: group.memberCount + 1 });
        toast.success(`You've joined ${group.name}!`);
        fetchGroup(); // Refresh to get updated member list
      } else {
        const result = await response.json();
        toast.error(result.error || 'Failed to join branch');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!group) return;

    try {
      const response = await fetch(`/api/groups/${group.slug}/leave`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setGroup({ ...group, isMember: false, memberCount: Math.max(0, group.memberCount - 1) });
        toast.success(`You've left ${group.name}`);
        fetchGroup(); // Refresh to get updated member list
      } else {
        const result = await response.json();
        toast.error(result.error || 'Failed to leave branch');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) {
      toast.error('Please enter a title and content');
      return;
    }

    if (postType === 'event' && (!eventDate || !eventLocation.trim())) {
      toast.error('Please enter event date and location');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/groups/${slug}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: postTitle.trim(),
          content: postContent.trim(),
          postType,
          eventDate: postType === 'event' ? eventDate : null,
          eventLocation: postType === 'event' ? eventLocation.trim() : null,
          isPinned,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPosts([result.post, ...posts]);
        setPostTitle('');
        setPostContent('');
        setPostType('announcement');
        setEventDate('');
        setEventLocation('');
        setIsPinned(false);
        setCreatePostDialogOpen(false);
        toast.success('Post created successfully!');
      } else {
        toast.error(result.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchComments = async (postId: string) => {
    if (comments[postId]) return; // Already loaded

    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await fetch(`/api/groups/${slug}/posts/${postId}/comments`);
      const data = await response.json();
      setComments(prev => ({ ...prev, [postId]: data.comments || [] }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleComments = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      fetchComments(postId);
    }
  };

  const handleCommentChange = (postId: string, value: string) => {
    setNewComment(prev => ({ ...prev, [postId]: value }));
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to comment');
      return;
    }

    const commentText = newComment[postId]?.trim();
    if (!commentText) return;

    setSubmittingComment(postId);
    try {
      const response = await fetch(`/api/groups/${slug}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: commentText }),
      });

      const result = await response.json();

      if (response.ok) {
        setComments(prev => ({
          ...prev,
          [postId]: [result.comment, ...(prev[postId] || [])],
        }));
        setPosts(posts.map(p =>
          p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
        ));
        setNewComment(prev => ({ ...prev, [postId]: '' }));
        toast.success('Comment posted!');
      } else {
        toast.error(result.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const response = await fetch(`/api/groups/${slug}/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c.id !== commentId),
        }));
        setPosts(posts.map(p =>
          p.id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p
        ));
        toast.success('Comment deleted');
      } else {
        toast.error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'event':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'discussion':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const canCreatePost = group?.isMember;
  const canPinPost = group?.userRole === 'leader' || group?.userRole === 'moderator';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-12 h-12 animate-spin mx-auto">
              <Image src="/2.png" alt="Loading..." width={48} height={48} className="h-12 w-12" />
            </div>
            <p className="mt-2 text-gray-600">Loading branch...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center py-12 rounded-none">
            <CardContent>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Group not found</h3>
              <p className="text-gray-600 mb-4">The group you're looking for doesn't exist.</p>
              <Link href="/groups">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-none">
                  View All Groups
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Group Header */}
        <Card className="mb-8 border-l-4 border-l-orange-500 rounded-none">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  {group.name}
                </CardTitle>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="border-orange-400 text-orange-700">
                    <MapPin className="h-3 w-3 mr-1" />
                    {group.location}
                  </Badge>
                  <Badge variant="outline">{group.province}</Badge>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {group.memberCount} members
                  </Badge>
                </div>
                <p className="text-gray-700 mb-4">{group.description}</p>
                <div className="text-sm text-gray-600">
                  Group Leader: <span className="font-semibold">
                    {group.leader.firstName} {group.leader.lastName}
                  </span>
                </div>
              </div>

              {isAuthenticated && (
                <div>
                  {group.isMember ? (
                    <Button
                      onClick={handleLeaveGroup}
                      variant="outline"
                      className="rounded-none"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Member
                    </Button>
                  ) : (
                    <Button
                      onClick={handleJoinGroup}
                      className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Group
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Posts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post Button */}
            {canCreatePost && (
              <div>
                <Dialog open={createPostDialogOpen} onOpenChange={setCreatePostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-none w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl rounded-none">
                    <DialogHeader>
                      <DialogTitle>Create Post</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="post-type">Post Type</Label>
                        <select
                          id="post-type"
                          value={postType}
                          onChange={(e) => setPostType(e.target.value as 'announcement' | 'event' | 'discussion')}
                          className="w-full border border-black rounded-none px-3 py-2 bg-white"
                        >
                          <option value="announcement">Announcement</option>
                          <option value="event">Event</option>
                          <option value="discussion">Discussion</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="post-title">Title</Label>
                        <Input
                          id="post-title"
                          placeholder="Enter post title..."
                          value={postTitle}
                          onChange={(e) => setPostTitle(e.target.value)}
                          className="border-black rounded-none"
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <Label htmlFor="post-content">Content</Label>
                        <Textarea
                          id="post-content"
                          placeholder="Write your post content..."
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          className="border-black rounded-none resize-none min-h-[150px]"
                          maxLength={2000}
                        />
                      </div>
                      {postType === 'event' && (
                        <>
                          <div>
                            <Label htmlFor="event-date">Event Date & Time</Label>
                            <Input
                              id="event-date"
                              type="datetime-local"
                              value={eventDate}
                              onChange={(e) => setEventDate(e.target.value)}
                              className="border-black rounded-none"
                            />
                          </div>
                          <div>
                            <Label htmlFor="event-location">Event Location</Label>
                            <Input
                              id="event-location"
                              placeholder="Enter event location..."
                              value={eventLocation}
                              onChange={(e) => setEventLocation(e.target.value)}
                              className="border-black rounded-none"
                            />
                          </div>
                        </>
                      )}
                      {canPinPost && (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="pin-post"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                            className="rounded border-black"
                          />
                          <Label htmlFor="pin-post" className="cursor-pointer">
                            Pin this post to the top
                          </Label>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setCreatePostDialogOpen(false)}
                        className="rounded-none"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreatePost}
                        disabled={submitting}
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                      >
                        {submitting ? 'Creating...' : 'Create Post'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Posts List */}
            {posts.length === 0 ? (
              <Card className="text-center py-12 rounded-none">
                <CardContent>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-600">
                    {canCreatePost
                      ? 'Be the first to create a post!'
                      : 'Join this group to see posts and participate.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card
                  key={post.id}
                  className={`rounded-none ${post.isPinned ? 'border-2 border-orange-500' : 'border-l-4 border-l-orange-500'}`}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <UserInfo
                        user={{
                          id: post.author.id,
                          firstName: post.author.firstName,
                          lastName: post.author.lastName,
                          membershipNumber: post.author.membershipNumber,
                          userRole: post.author.userRole,
                          profileImageUrl: post.author.profileImageUrl,
                          verificationStatus: 'yes'
                        }}
                        avatarSize="md"
                        showRole={true}
                        showMembershipNumber={false}
                        layout="horizontal"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={getPostTypeColor(post.postType)}>
                            {post.postType}
                          </Badge>
                          {post.isPinned && (
                            <Badge className="bg-orange-600 text-white">
                              <Pin className="h-3 w-3 mr-1" />
                              Pinned
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {post.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.createdAt)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>

                    {post.postType === 'event' && post.eventDate && (
                      <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
                        <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                          <Calendar className="h-4 w-4" />
                          Event Details
                        </div>
                        <div className="text-sm text-green-700">
                          <p className="mb-1"><strong>Date:</strong> {formatEventDate(post.eventDate)}</p>
                          {post.eventLocation && (
                            <p><strong>Location:</strong> {post.eventLocation}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-4 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleComments(post.id)}
                        className="flex items-center gap-1 text-gray-600 hover:text-orange-600"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {expandedPostId === post.id && (
                      <div className="border-t mt-4 pt-4 space-y-4">
                        {/* Comment Input Form */}
                        {isAuthenticated && group?.isMember ? (
                          <div className="flex gap-3">
                            <Textarea
                              placeholder="Write a comment..."
                              value={newComment[post.id] || ''}
                              onChange={(e) => handleCommentChange(post.id, e.target.value)}
                              className="border-black rounded-none resize-none min-h-[80px] flex-1"
                              maxLength={1000}
                            />
                            <Button
                              onClick={() => handleCommentSubmit(post.id)}
                              disabled={!newComment[post.id]?.trim() || submittingComment === post.id}
                              className="bg-orange-600 hover:bg-orange-700 text-white rounded-none h-10"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-gray-50 rounded">
                            <p className="text-gray-600 text-sm">
                              {!isAuthenticated ? (
                                <>
                                  <Link href="/signin" className="text-orange-600 hover:text-orange-700 font-medium">
                                    Sign in
                                  </Link>
                                  {' '}to comment
                                </>
                              ) : (
                                'Join this group to comment'
                              )}
                            </p>
                          </div>
                        )}

                        {/* Comments List */}
                        {loadingComments[post.id] ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                          </div>
                        ) : comments[post.id]?.length > 0 ? (
                          <div className="space-y-3">
                            {comments[post.id].map((comment) => (
                              <div key={comment.id} className="bg-gray-50 rounded p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-start gap-3 flex-1">
                                    <UserInfo
                                      user={{
                                        id: comment.author.id,
                                        firstName: comment.author.firstName,
                                        lastName: comment.author.lastName,
                                        membershipNumber: comment.author.membershipNumber,
                                        userRole: comment.author.userRole,
                                        profileImageUrl: comment.author.profileImageUrl,
                                        verificationStatus: comment.author.verificationStatus
                                      }}
                                      avatarSize="sm"
                                      showRole={true}
                                      showMembershipNumber={false}
                                      layout="horizontal"
                                      className="flex-shrink-0"
                                    />
                                    <span className="text-xs text-gray-500 mt-1">
                                      {formatDate(comment.createdAt)}
                                    </span>
                                  </div>
                                  {isAuthenticated && user && (user.id === comment.author.id || user.id === group?.leader.id || user.userRole === 'admin') && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => handleDeleteComment(post.id, comment.id)}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <Trash2 className="h-3 w-3 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap ml-11">
                                  {comment.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 text-sm py-4">
                            No comments yet. Be the first to comment!
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Sidebar - Members */}
          <div className="lg:col-span-1">
            <Card className="rounded-none sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Members ({group.memberCount})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.members.slice(0, 10).map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="relative">
                        {member.profileImageUrl ? (
                          <Image
                            src={member.profileImageUrl}
                            alt={`${member.firstName} ${member.lastName}`}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-semibold text-sm">
                              {member.firstName[0]}{member.lastName[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/profile/${member.id}`}
                          className="font-semibold text-sm text-gray-900 hover:text-orange-600 truncate block"
                        >
                          {member.firstName} {member.lastName}
                        </Link>
                        <p className="text-xs text-gray-600">
                          {member.role === 'leader' && '👑 Branch Leader'}
                          {member.role === 'moderator' && '⭐ Moderator'}
                          {member.role === 'member' && 'Member'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {group.memberCount > 10 && (
                    <p className="text-sm text-gray-600 text-center pt-2">
                      +{group.memberCount - 10} more members
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;
