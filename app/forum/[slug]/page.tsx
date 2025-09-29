'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, ThumbsUp, ThumbsDown, MoreVertical, Edit, Trash2, Send, Share2, Copy, Twitter, Facebook, Linkedin, MessageSquare, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import UserInfo from '@/components/UserInfo';
import { shareOnTwitter, shareOnFacebook, shareOnLinkedIn, shareOnWhatsApp, copyToClipboard } from '@/lib/utils';

interface ForumPost {
  id: string;
  slug: string;
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
    verificationStatus: string;
  };
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  userReaction: boolean | null;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  dislikeCount: number;
  userReaction: boolean | null;
  author: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    membershipNumber: string;
    userRole: string;
    profileImageUrl?: string;
    verificationStatus: string;
  };
}

export default function ForumPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Edit post state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  // Comment edit/delete state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [submittingCommentEdit, setSubmittingCommentEdit] = useState(false);
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const { isAuthenticated, user } = useAuth();

  const fetchPost = useCallback(async () => {
    try {
      const response = await fetch(`/api/forum/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      } else if (response.status === 404) {
        toast.error('Post not found');
        router.push('/forum');
      } else {
        toast.error('Failed to load post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/forum/${slug}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchPost();
      fetchComments();
    }
  }, [slug, fetchPost, fetchComments]);

  const handleLikeDislike = async (isLike: boolean) => {
    if (!isAuthenticated || !post) {
      toast.error('Please sign in to react to posts');
      return;
    }

    // Calculate optimistic state changes
    let newLikeCount = post.likeCount || 0;
    let newDislikeCount = post.dislikeCount || 0;
    let newUserReaction: boolean | null = isLike;
    let action = 'added';

    if (post.userReaction === isLike) {
      // Same reaction - remove it (toggle off)
      newUserReaction = null;
      if (isLike) {
        newLikeCount = Math.max(0, newLikeCount - 1);
      } else {
        newDislikeCount = Math.max(0, newDislikeCount - 1);
      }
      action = 'removed';
    } else if (post.userReaction !== null && post.userReaction !== isLike) {
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

    // Store original state for potential rollback
    const originalPost = { ...post };

    // Optimistically update the UI immediately
    setPost(prev => prev ? {
      ...prev,
      likeCount: newLikeCount,
      dislikeCount: newDislikeCount,
      userReaction: newUserReaction
    } : null);

    // Show immediate feedback
    if (action === 'added') {
      toast.success(isLike ? 'Post liked!' : 'Post disliked!');
    } else if (action === 'updated') {
      toast.success(isLike ? 'Changed to like' : 'Changed to dislike');
    } else if (action === 'removed') {
      toast.success('Reaction removed');
    }

    try {
      const response = await fetch(`/api/forum/${slug}/like`, {
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
        setPost(prev => prev ? {
          ...prev,
          likeCount: result.likeCount,
          dislikeCount: result.dislikeCount,
          userReaction: result.userReaction
        } : null);
      } else {
        // Revert optimistic update on error
        setPost(originalPost);
        toast.error(result.error || 'Failed to react to post');
      }
    } catch (error) {
      // Revert optimistic update on network error
      setPost(originalPost);
      console.error('Error updating reaction:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const handleCommentSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/forum/${slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setPost(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : null);
        setNewComment('');
        toast.success('Comment posted successfully');
      } else {
        toast.error('Failed to post comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = (platform: string) => {
    if (!post) return;

    const url = window.location.href;

    switch (platform) {
      case 'twitter':
        shareOnTwitter(url, post.title);
        break;
      case 'facebook':
        shareOnFacebook(url);
        break;
      case 'linkedin':
        shareOnLinkedIn(url, post.title);
        break;
      case 'whatsapp':
        shareOnWhatsApp(url, post.title);
        break;
      case 'copy':
        copyToClipboard(url).then(success => {
          if (success) {
            toast.success('Link copied to clipboard!');
          } else {
            toast.error('Failed to copy link');
          }
        });
        break;
    }
    setShareDialogOpen(false);
  };

  const handleCommentLikeDislike = async (commentId: string, isLike: boolean) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to react to comments');
      return;
    }

    // Find the current comment to calculate optimistic updates
    const currentComment = comments.find(c => c.id === commentId);
    if (!currentComment) return;

    // Calculate optimistic state changes
    let newLikeCount = currentComment.likeCount || 0;
    let newDislikeCount = currentComment.dislikeCount || 0;
    let newUserReaction: boolean | null = isLike;
    let action = 'added';

    if (currentComment.userReaction === isLike) {
      // Same reaction - remove it (toggle off)
      newUserReaction = null;
      if (isLike) {
        newLikeCount = Math.max(0, newLikeCount - 1);
      } else {
        newDislikeCount = Math.max(0, newDislikeCount - 1);
      }
      action = 'removed';
    } else if (currentComment.userReaction !== null && currentComment.userReaction !== isLike) {
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

    // Store original state for potential rollback
    const originalComments = [...comments];

    // Optimistically update the UI immediately
    const optimisticComments = comments.map(comment =>
      comment.id === commentId
        ? {
            ...comment,
            likeCount: newLikeCount,
            dislikeCount: newDislikeCount,
            userReaction: newUserReaction
          }
        : comment
    );
    setComments(optimisticComments);

    // Show immediate feedback
    if (action === 'added') {
      toast.success(isLike ? 'Comment liked!' : 'Comment disliked!');
    } else if (action === 'updated') {
      toast.success(isLike ? 'Changed to like' : 'Changed to dislike');
    } else if (action === 'removed') {
      toast.success('Reaction removed');
    }

    try {
      // Send API request in the background
      const response = await fetch(`/api/forum/${slug}/comments/${commentId}/like`, {
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
        setComments(comments.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                likeCount: result.likeCount,
                dislikeCount: result.dislikeCount,
                userReaction: result.userReaction
              }
            : comment
        ));
      } else {
        // Revert optimistic update on error
        setComments(originalComments);
        toast.error(result.error || 'Failed to react to comment');
      }
    } catch (error) {
      // Revert optimistic update on network error
      setComments(originalComments);
      console.error('Like comment error:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const canModifyComment = (comment: Comment) => {
    if (!user) return false;
    // User can modify if they own the comment or if they are admin
    return comment.author.id === user.id || user.userRole === 'admin';
  };

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditCommentContent(currentContent);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editCommentContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setSubmittingCommentEdit(true);

    try {
      const response = await fetch(`/api/forum/${slug}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: editCommentContent.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        setComments(comments.map(comment =>
          comment.id === commentId
            ? { ...comment, content: result.comment.content }
            : comment
        ));
        setEditingCommentId(null);
        setEditCommentContent('');
        toast.success('Comment updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Edit comment error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSubmittingCommentEdit(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteCommentDialogOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      const response = await fetch(`/api/forum/${slug}/comments/${commentToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok) {
        setComments(comments.filter(comment => comment.id !== commentToDelete));
        if (post) {
          setPost(prev => prev ? { ...prev, commentCount: prev.commentCount - 1 } : null);
        }
        toast.success('Comment deleted successfully!');
      } else {
        toast.error(result.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setDeleteCommentDialogOpen(false);
      setCommentToDelete(null);
    }
  };

  const cancelDeleteComment = () => {
    setDeleteCommentDialogOpen(false);
    setCommentToDelete(null);
  };

  const handleEditPost = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditDialogOpen(true);
  };

  const handleCancelEditPost = () => {
    setEditDialogOpen(false);
    setEditTitle('');
    setEditContent('');
  };

  const handleSaveEditPost = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    if (editTitle.length > 200) {
      toast.error('Title must be 200 characters or less');
      return;
    }

    if (editContent.length > 2000) {
      toast.error('Content must be 2000 characters or less');
      return;
    }

    setSubmittingEdit(true);

    try {
      const response = await fetch(`/api/forum/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim()
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPost(prev => prev ? {
          ...prev,
          title: editTitle.trim(),
          content: editContent.trim(),
          updatedAt: result.post.updatedAt
        } : null);
        setEditDialogOpen(false);
        setEditTitle('');
        setEditContent('');
        toast.success('Post updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update post');
      }
    } catch (error) {
      console.error('Edit post error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeletePost = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeletePost = async () => {
    setDeletingPost(true);

    try {
      const response = await fetch(`/api/forum/${slug}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Post deleted successfully!');
        router.push('/forum');
      } else {
        toast.error(result.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Delete post error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setDeletingPost(false);
      setDeleteDialogOpen(false);
    }
  };

  const cancelDeletePost = () => {
    setDeleteDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Post not found</p>
          <Link href="/forum">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              Back to Forum
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/forum" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forum
        </Link>

        {/* Post Content */}
        <Card className="border-l-4 border-l-orange-500 mb-8 rounded-none">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-3">
                  {post.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
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
                    avatarSize="md"
                    showRole={true}
                    showMembershipNumber={false}
                    layout="horizontal"
                    className="flex-none"
                  />
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(post.createdAt)}
                  </div>
                  {post.updatedAt && post.updatedAt !== post.createdAt && (
                    <span className="text-xs">(edited)</span>
                  )}
                </div>
              </div>

              {/* Share Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>

              {/* Edit/Delete Dropdown - Only show for post author or admin */}
              {isAuthenticated && user && (user.id === post.author.id || user.userRole === 'admin') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEditPost}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDeletePost}
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
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                {post.content}
              </p>
            </div>
          </CardContent>

          <CardFooter className="bg-gray-50 border-t">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-4">
                {/* Like Button */}
                <button
                  onClick={() => handleLikeDislike(true)}
                  disabled={!isAuthenticated}
                  className={`flex items-center gap-1 text-sm px-3 py-2 rounded-none transition-colors ${
                    post.userReaction === true
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="font-medium">{post.likeCount}</span>
                </button>

                {/* Dislike Button */}
                <button
                  onClick={() => handleLikeDislike(false)}
                  disabled={!isAuthenticated}
                  className={`flex items-center gap-1 text-sm px-3 py-2 rounded-none transition-colors ${
                    post.userReaction === false
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span className="font-medium">{post.dislikeCount}</span>
                </button>

                {/* Comments Count */}
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">{post.commentCount} Comments</span>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Comments Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">Comments</h3>

          {/* Comment Form */}
          {isAuthenticated ? (
            <Card className="rounded-none">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="border-black rounded-none resize-none min-h-[100px]"
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {newComment.length}/1000 characters
                    </div>
                    <Button
                      onClick={handleCommentSubmit}
                      disabled={!newComment.trim() || submittingComment}
                      className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-none">
              <CardContent className="pt-6">
                <p className="text-gray-600 text-center">
                  <Link href="/signin" className="text-orange-600 hover:text-orange-700 font-medium">
                    Sign in
                  </Link>
                  {' '}to join the discussion
                </p>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <Card className="rounded-none">
                <CardContent className="pt-6">
                  <p className="text-gray-500 text-center">No comments yet. Be the first to share your thoughts!</p>
                </CardContent>
              </Card>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="rounded-none">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* User Information Row */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
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
                            avatarSize="md"
                            showRole={true}
                            showMembershipNumber={false}
                            layout="horizontal"
                            className="flex-shrink-0"
                          />
                          <span className="text-sm text-gray-500 mt-1">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        {isAuthenticated && canModifyComment(comment) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditComment(comment.id, comment.content)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      {/* Comment Content */}
                      <div className="w-full px-4 py-3 bg-gray-50 rounded-lg">
                        {editingCommentId === comment.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editCommentContent}
                              onChange={(e) => setEditCommentContent(e.target.value)}
                              className="border-black rounded-none resize-none min-h-[80px]"
                              maxLength={1000}
                            />
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                {editCommentContent.length}/1000 characters
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEditComment}
                                  className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-none"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEditComment(comment.id)}
                                  disabled={!editCommentContent.trim() || submittingCommentEdit}
                                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  {submittingCommentEdit ? 'Saving...' : 'Save'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                              {comment.content}
                            </p>

                            {/* Like/Dislike Buttons */}
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => handleCommentLikeDislike(comment.id, true)}
                                disabled={!isAuthenticated}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                                  comment.userReaction === true
                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                    : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                                } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              >
                                <ThumbsUp className="h-3 w-3" />
                                <span>{comment.likeCount || 0}</span>
                              </button>

                              <button
                                onClick={() => handleCommentLikeDislike(comment.id, false)}
                                disabled={!isAuthenticated}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                                  comment.userReaction === false
                                    ? 'bg-red-100 text-red-700 border border-red-300'
                                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              >
                                <ThumbsDown className="h-3 w-3" />
                                <span>{comment.dislikeCount || 0}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="max-w-md rounded-none">
            <DialogHeader>
              <DialogTitle>Share this post</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button
                variant="outline"
                onClick={() => handleShare('twitter')}
                className="flex items-center gap-2 justify-center rounded-none"
              >
                <Twitter className="h-4 w-4 text-blue-500" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare('facebook')}
                className="flex items-center gap-2 justify-center rounded-none"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare('linkedin')}
                className="flex items-center gap-2 justify-center rounded-none"
              >
                <Linkedin className="h-4 w-4 text-blue-700" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare('whatsapp')}
                className="flex items-center gap-2 justify-center rounded-none"
              >
                <MessageSquare className="h-4 w-4 text-green-600" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare('copy')}
                className="flex items-center gap-2 justify-center rounded-none col-span-2"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Post Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl rounded-none">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
              <DialogDescription>
                Make changes to your forum post. Click save when you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="border-black rounded-none"
                  maxLength={200}
                  placeholder="Enter post title..."
                />
                <div className="text-xs text-gray-500 text-right">
                  {editTitle.length}/200 characters
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="border-black rounded-none resize-none min-h-[200px]"
                  maxLength={2000}
                  placeholder="Share your thoughts..."
                />
                <div className="text-xs text-gray-500 text-right">
                  {editContent.length}/2000 characters
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelEditPost}
                className="rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditPost}
                disabled={!editTitle.trim() || !editContent.trim() || submittingEdit}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
              >
                {submittingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Post Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="rounded-none">
            <DialogHeader>
              <DialogTitle>Delete Post</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this post? This action cannot be undone and will also delete all comments.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={cancelDeletePost}
                disabled={deletingPost}
                className="rounded-none"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeletePost}
                disabled={deletingPost}
                className="rounded-none bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deletingPost ? 'Deleting...' : 'Delete Post'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Comment Confirmation Dialog */}
        <Dialog open={deleteCommentDialogOpen} onOpenChange={setDeleteCommentDialogOpen}>
          <DialogContent className="rounded-none">
            <DialogHeader>
              <DialogTitle>Delete Comment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this comment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={cancelDeleteComment}
                className="rounded-none"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteComment}
                className="rounded-none bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}