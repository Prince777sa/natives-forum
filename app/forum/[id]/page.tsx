'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, ThumbsUp, ThumbsDown, MoreVertical, Edit, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
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
  const postId = params.id as string;

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

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
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/forum/${postId}`);
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
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/forum/${postId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLikeDislike = async (isLike: boolean) => {
    if (!isAuthenticated || !post) {
      toast.error('Please sign in to react to posts');
      return;
    }

    try {
      const response = await fetch(`/api/forum/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isLike }),
      });

      if (response.ok) {
        const data = await response.json();
        setPost(prev => prev ? {
          ...prev,
          likeCount: data.likeCount,
          dislikeCount: data.dislikeCount,
          userReaction: data.userReaction
        } : null);
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast.error('Failed to update reaction');
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
      const response = await fetch(`/api/forum/${postId}/comments`, {
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

  const handleEditPost = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!post || !editTitle.trim() || !editContent.trim()) return;

    setSubmittingEdit(true);
    try {
      const response = await fetch(`/api/forum/${postId}`, {
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
        setPost(prev => prev ? {
          ...prev,
          title: data.post.title,
          content: data.post.content,
          excerpt: data.post.content.length > 300 ? data.post.content.substring(0, 300) + '...' : data.post.content,
          updatedAt: data.post.updatedAt
        } : null);

        setEditDialogOpen(false);
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

  const confirmDeletePost = async () => {
    if (!post) return;

    setDeletingPost(true);
    try {
      const response = await fetch(`/api/forum/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Post deleted successfully');
        router.push('/forum');
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

  // Comment edit/delete handlers
  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleCommentEditSubmit = async (commentId: string) => {
    if (!editCommentContent.trim()) return;

    setSubmittingCommentEdit(true);
    try {
      const response = await fetch(`/api/forum/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editCommentContent.trim()
        }),
      });

      if (response.ok) {
        // Update the comment in the comments array
        setComments(prev => prev.map(comment =>
          comment.id === commentId
            ? { ...comment, content: editCommentContent.trim() }
            : comment
        ));
        setEditingCommentId(null);
        setEditCommentContent('');
        toast.success('Comment updated successfully');
      } else {
        toast.error('Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    } finally {
      setSubmittingCommentEdit(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      const response = await fetch(`/api/forum/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the comment from the comments array
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        toast.success('Comment deleted successfully');
      } else {
        toast.error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setDeletingCommentId(null);
    }
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
                      onClick={() => setDeleteDialogOpen(true)}
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
                      <div className="flex items-center justify-between">
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
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                          {/* Edit/Delete Dropdown - Only show for comment author or admin */}
                          {isAuthenticated && user && (user.id === comment.author.id || user.userRole === 'admin') && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditComment(comment)}>
                                  <Edit className="h-3 w-3 mr-2" />
                                  Edit Comment
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-red-600 focus:text-red-600"
                                  disabled={deletingCommentId === comment.id}
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  {deletingCommentId === comment.id ? 'Deleting...' : 'Delete Comment'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            className="border-black rounded-none resize-none min-h-[80px]"
                            maxLength={1000}
                            placeholder="Edit your comment..."
                          />
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              {editCommentContent.length}/1000 characters
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditCommentContent('');
                                }}
                                className="rounded-none"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleCommentEditSubmit(comment.id)}
                                disabled={!editCommentContent.trim() || submittingCommentEdit}
                                className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                              >
                                {submittingCommentEdit ? 'Updating...' : 'Update'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

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
    </div>
  );
}