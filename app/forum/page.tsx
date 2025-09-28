"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MessageCircle, User, Calendar, Plus, ThumbsUp, ThumbsDown, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import UserInfo from '@/components/UserInfo';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    membershipNumber: string;
    userRole: string;
    profileImageUrl?: string;
    verificationStatus: 'yes' | 'no';
  };
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  userReaction?: boolean | null;
  createdAt: string;
  updatedAt?: string;
}


const ForumPage = () => {
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Post creation state
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  // Edit post state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState(false);

  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchForumPosts();
  }, []);


  const fetchForumPosts = async () => {
    try {
      const response = await fetch('/api/forum');
      const data = await response.json();
      setForumPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching forum posts:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleLikeDislike = async (postId: string, isLike: boolean) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to react to posts');
      return;
    }

    // Find the current post to calculate optimistic updates
    const currentPost = forumPosts.find(p => p.id === postId);
    if (!currentPost) return;

    // Calculate optimistic state changes
    let newLikeCount = currentPost.likeCount || 0;
    let newDislikeCount = currentPost.dislikeCount || 0;
    let newUserReaction: boolean | null = isLike;
    let action = 'added';

    if (currentPost.userReaction === isLike) {
      // Same reaction - remove it (toggle off)
      newUserReaction = null;
      if (isLike) {
        newLikeCount = Math.max(0, newLikeCount - 1);
      } else {
        newDislikeCount = Math.max(0, newDislikeCount - 1);
      }
      action = 'removed';
    } else if (currentPost.userReaction !== null && currentPost.userReaction !== isLike) {
      // Different reaction - update it
      if (isLike) {
        newLikeCount += 1;
        newDislikeCount = Math.max(0, newDislikeCount - 1);
      } else {
        newDislikeCount += 1;
        newLikeCount = Math.max(0, newLikeCount - 1);
      }
      action = 'updated';
    } else {
      // No existing reaction - add new one
      if (isLike) {
        newLikeCount += 1;
      } else {
        newDislikeCount += 1;
      }
      action = 'added';
    }

    // Optimistically update the UI immediately
    const optimisticPosts = forumPosts.map(post =>
      post.id === postId
        ? {
            ...post,
            likeCount: newLikeCount,
            dislikeCount: newDislikeCount,
            userReaction: newUserReaction
          }
        : post
    );
    setForumPosts(optimisticPosts);

    // Show immediate feedback
    if (action === 'added') {
      toast.success(isLike ? 'Post liked!' : 'Post disliked!');
    } else if (action === 'updated') {
      toast.success(isLike ? 'Changed to like' : 'Changed to dislike');
    } else if (action === 'removed') {
      toast.success('Reaction removed');
    }

    try {
      const response = await fetch(`/api/forum/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isLike }),
      });

      const result = await response.json();

      if (response.ok) {
        // Update with server response to ensure consistency
        setForumPosts(posts =>
          posts.map(post =>
            post.id === postId
              ? {
                  ...post,
                  likeCount: result.likeCount,
                  dislikeCount: result.dislikeCount,
                  userReaction: result.userReaction
                }
              : post
          )
        );
      } else {
        // Revert optimistic update on error
        setForumPosts(forumPosts);
        toast.error(result.error || 'Failed to react to post');
      }
    } catch (error) {
      // Revert optimistic update on network error
      setForumPosts(forumPosts);
      console.error('Like post error:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const handleCreatePost = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create posts');
      return;
    }

    if (!newPostTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!newPostContent.trim()) {
      toast.error('Please enter content');
      return;
    }

    setSubmittingPost(true);

    try {
      const response = await fetch('/api/forum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newPostTitle.trim(),
          content: newPostContent.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setForumPosts([result.post, ...forumPosts]);
        setNewPostTitle('');
        setNewPostContent('');
        setCreatePostDialogOpen(false);
        toast.success('Post created successfully!');
      } else {
        toast.error(result.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Create post error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSubmittingPost(false);
    }
  };



  const handleEditPost = (post: ForumPost) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditDialogOpen(true);
  };

  const handleDeletePost = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;

    setDeletingPost(true);
    try {
      const response = await fetch(`/api/forum/${postToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setForumPosts(posts => posts.filter(post => post.id !== postToDelete));
        toast.success('Post deleted successfully');
        setDeleteDialogOpen(false);
        setPostToDelete(null);
      } else {
        toast.error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setDeletingPost(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingPost || !editTitle.trim() || !editContent.trim()) return;

    setSubmittingEdit(true);
    try {
      const response = await fetch(`/api/forum/${editingPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();

        setForumPosts(posts =>
          posts.map(post =>
            post.id === editingPost.id
              ? {
                  ...post,
                  title: data.post.title,
                  content: data.post.content,
                  excerpt: data.post.content.length > 300 ? data.post.content.substring(0, 300) + '...' : data.post.content,
                  updatedAt: data.post.updatedAt
                }
              : post
          )
        );

        setEditDialogOpen(false);
        setEditingPost(null);
        setEditTitle('');
        setEditContent('');
        toast.success('Post updated successfully');
      } else {
        toast.error('Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPosts = forumPosts.length;
  const totalLikes = forumPosts.reduce((sum, post) => sum + post.likeCount, 0);
  const totalComments = forumPosts.reduce((sum, post) => sum + post.commentCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-12 h-12 animate-spin mx-auto">
              <Image src="/2.png" alt="Loading..." width={48} height={48} className="h-12 w-12" />
            </div>
            <p className="mt-2 text-gray-600">Loading forum posts...</p>
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
            Community Forum
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with fellow community members, share ideas, and engage in meaningful discussions.
            This is where conversations happen and connections are made.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{totalPosts}</div>
              <div className="text-sm text-gray-600">Forum Posts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{totalLikes}</div>
              <div className="text-sm text-gray-600">Total Likes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{totalComments}</div>
              <div className="text-sm text-gray-600">Comments</div>
            </div>
          </div>

          {/* Create Post Button */}
          {isAuthenticated ? (
            <div className="mb-8">
              <Dialog open={createPostDialogOpen} onOpenChange={setCreatePostDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-none">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-none">
                  <DialogHeader>
                    <DialogTitle>Create New Forum Post</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter your post title..."
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                        className="border-black rounded-none"
                        maxLength={200}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {newPostTitle.length}/200 characters
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        placeholder="Share your thoughts with the community..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="border-black rounded-none resize-none min-h-[200px]"
                        maxLength={2000}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {newPostContent.length}/2000 characters
                      </div>
                    </div>
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
                      disabled={!newPostTitle.trim() || !newPostContent.trim() || submittingPost}
                      className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                    >
                      {submittingPost ? 'Creating...' : 'Create Post'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <p className="text-orange-800">
                <Link href="/signin" className="text-orange-600 hover:text-orange-700 font-medium">
                  Sign in
                </Link>
                {' '}to create posts, like, and join the discussion!
              </p>
            </div>
          )}

          {/* Edit Post Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl rounded-none">
              <DialogHeader>
                <DialogTitle>Edit Forum Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    placeholder="Enter your post title..."
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="border-black rounded-none"
                    maxLength={200}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {editTitle.length}/200 characters
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-content">Content</Label>
                  <Textarea
                    id="edit-content"
                    placeholder="Share your thoughts with the community..."
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="border-black rounded-none resize-none min-h-[200px]"
                    maxLength={2000}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {editContent.length}/2000 characters
                  </div>
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
                  disabled={!editTitle.trim() || !editContent.trim() || submittingEdit}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                >
                  {submittingEdit ? 'Updating...' : 'Update Post'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="max-w-md rounded-none">
              <DialogHeader>
                <DialogTitle>Delete Post</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-gray-600">
                  Are you sure you want to delete this post? This action cannot be undone.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  className="rounded-none"
                  disabled={deletingPost}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeletePost}
                  disabled={deletingPost}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-none"
                >
                  {deletingPost ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Forum Posts */}
        <div className="space-y-8">
          {forumPosts.length === 0 ? (
            <Card className="text-center py-12 rounded-none">
              <CardContent>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No forum posts yet</h3>
                <p className="text-gray-600">Be the first to start a discussion with the community!</p>
              </CardContent>
            </Card>
          ) : (
            forumPosts.map((post) => (
              <Card key={post.id} className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow duration-200 rounded-none">
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
                        verificationStatus: post.author.verificationStatus
                      }}
                      avatarSize="lg"
                      showRole={true}
                      showMembershipNumber={false}
                      layout="horizontal"
                    />

                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        <Link href={`/forum/${post.id}`} className="hover:text-blue-600 transition-colors">
                          {post.title}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(post.createdAt)}
                        </div>
                        {post.updatedAt && post.updatedAt !== post.createdAt && (
                          <span className="text-xs">(edited)</span>
                        )}
                      </div>
                    </div>

                    {/* Edit/Delete Dropdown - Only show for post author or admin */}
                    {isAuthenticated && user && (user.id === post.author.id || user.userRole === 'admin') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditPost(post)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Post
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="prose max-w-none mb-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {post.excerpt || post.content.substring(0, 300) + (post.content.length > 300 ? '...' : '')}
                    </p>
                    {(post.content.length > 300 || post.excerpt) && (
                      <Link href={`/forum/${post.id}`}>
                        <Button variant="outline" size="sm" className="mt-3 rounded-none border-orange-500 text-orange-600 hover:bg-orange-50">
                          Read More
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="bg-gray-50 border-t">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4">
                      {/* Like Button */}
                      <button
                        onClick={() => handleLikeDislike(post.id, true)}
                        disabled={!isAuthenticated}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                          post.userReaction === true
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                        } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.likeCount || 0}</span>
                      </button>

                      {/* Dislike Button */}
                      <button
                        onClick={() => handleLikeDislike(post.id, false)}
                        disabled={!isAuthenticated}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                          post.userReaction === false
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                        } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span>{post.dislikeCount || 0}</span>
                      </button>

                      <Link href={`/forum/${post.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.commentCount}</span>
                        </Button>
                      </Link>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Forum Post</Badge>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumPage;
