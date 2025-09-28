"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Building2, Plus, Trash2, Users, MapPin, Target, LogIn, Info, MessageCircle, Send, ThumbsUp, ThumbsDown, MoreVertical, Edit, X, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import VerificationBadge from '@/components/VerificationBadge';

interface AdditionalPledge {
  id: number;
  name: string;
  relationship: string;
  amount: number;
  province: string;
  gender: string;
}

interface Comment {
  id: string;
  text: string;
  author: {
    name: string;
    role: string;
    membershipNumber: string;
  };
  created_at: string;
  likes: number;
  dislikes: number;
  hasLiked?: boolean;
  hasDisliked?: boolean;
  comment: string;
  user_id: string;
  first_name: string;
  last_name: string;
  user_role: string;
  profile_image_url?: string;
  verification_status?: string;
  like_count: number;
  dislike_count: number;
  user_reaction: boolean | null;
  updated_at?: string;
}

interface Initiative {
  id: string;
  title: string;
  description: string;
  currentAmount: number;
  targetAmount: number;
  currentParticipants: number;
  targetParticipants: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PledgeStats {
  totalAmount: number;
  totalParticipants: number;
  provinceBreakdown: ProvinceDataItem[];
  stats: {
    malePledges: number;
    femalePledges: number;
    otherPledges?: number;
  };
}

interface ProvinceDataItem {
  province: string;
  pledges: number;
  amount: number;
  percentage: number;
  province_amount: string;
  pledge_count: number;
}

interface CommentProps {
  comment: Comment;
  onLike: (commentId: string, isLike: boolean) => void;
  onEdit: (commentId: string, text: string) => void;
  onDelete: (commentId: string) => void;
  canModifyComment: (comment: Comment) => boolean;
  getRoleLabel: (role: string) => { text: string; color: string };
  editingCommentId: string | null;
  editingCommentText: string;
  setEditingCommentText: (text: string) => void;
  handleCancelEdit: () => void;
  handleSaveEdit: (commentId: string) => void;
  isAuthenticated: boolean;
}

const CommentComponent: React.FC<CommentProps> = ({
  comment,
  onLike,
  onEdit,
  onDelete,
  canModifyComment,
  getRoleLabel,
  editingCommentId,
  editingCommentText,
  setEditingCommentText,
  handleCancelEdit,
  handleSaveEdit,
  isAuthenticated
}) => {
  return (
    <div>
      <div className="flex items-start gap-3">
        <Link href={`/profile/${comment.user_id}`} className="relative flex-shrink-0 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
            {comment.profile_image_url ? (
              <Image
                src={comment.profile_image_url}
                alt={`${comment.first_name} ${comment.last_name}`}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <Users className="h-6 w-6 text-gray-500" />
            )}
          </div>
          <VerificationBadge
            isVerified={comment.verification_status === 'yes'}
            size="sm"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${comment.user_id}`} className="font-medium text-black hover:text-blue-600 transition-colors">
                {comment.first_name} {comment.last_name}
              </Link>
              {(() => {
                const roleInfo = getRoleLabel(comment.user_role);
                return (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded border ${roleInfo.color}`}>
                    {roleInfo.text}
                  </span>
                );
              })()}
              <span className="text-sm text-gray-500">
                {new Date(comment.created_at).toLocaleDateString()}
                {comment.updated_at && comment.updated_at !== comment.created_at && (
                  <span className="ml-1">(edited)</span>
                )}
              </span>
            </div>

            {canModifyComment(comment) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-none">
                  <DropdownMenuItem
                    onClick={() => onEdit(comment.id, comment.comment)}
                    className="cursor-pointer"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(comment.id)}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {editingCommentId === comment.id ? (
            <div className="mb-3">
              <Textarea
                value={editingCommentText}
                onChange={(e) => setEditingCommentText(e.target.value)}
                className="border-black rounded-none resize-none text-sm"
                rows={2}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {editingCommentText.length}/500 characters
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-none"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(comment.id)}
                    disabled={!editingCommentText.trim()}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              {comment.comment}
            </p>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(comment.id, true)}
              disabled={!isAuthenticated}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                comment.user_reaction === true
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
              } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <ThumbsUp className="h-3 w-3" />
              <span>{comment.like_count || 0}</span>
            </button>

            <button
              onClick={() => onLike(comment.id, false)}
              disabled={!isAuthenticated}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                comment.user_reaction === false
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
              } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <ThumbsDown className="h-3 w-3" />
              <span>{comment.dislike_count || 0}</span>
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};

const CommercialBankPledgePage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [pledgeAmount, setPledgeAmount] = useState(1200);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [additionalPledges, setAdditionalPledges] = useState<AdditionalPledge[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [pledgeStats, setPledgeStats] = useState<PledgeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Commercial Bank Initiative ID
  const COMMERCIAL_BANK_ID = 'e29a2ad1-b1cc-4066-8772-e2dec9654976';

  // Load initiative data and pledge statistics
  useEffect(() => {
    loadInitiativeData();
  }, []);

  // Set user's province as default when authenticated
  useEffect(() => {
    if (user && !selectedProvince) {
      setSelectedProvince(user.province);
    }
  }, [user, selectedProvince]);

  const loadInitiativeData = async () => {
    try {
      setIsLoading(true);

      // Fetch initiative details
      const initiativeResponse = await fetch(`/api/initiatives/${COMMERCIAL_BANK_ID}`);
      if (!initiativeResponse.ok) {
        throw new Error('Failed to load initiative data');
      }
      const initiativeData = await initiativeResponse.json();
      setInitiative(initiativeData);

      // Fetch pledge statistics
      const pledgeResponse = await fetch(`/api/initiatives/${COMMERCIAL_BANK_ID}/pledges`);
      if (!pledgeResponse.ok) {
        throw new Error('Failed to load pledge statistics');
      }
      const pledgeData = await pledgeResponse.json();
      setPledgeStats(pledgeData);

      // Fetch comments
      const commentsResponse = await fetch(`/api/initiatives/${COMMERCIAL_BANK_ID}/comments`);
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        setComments(commentsData.comments);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load initiative data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPledge = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to make a pledge');
      return;
    }

    if (!selectedProvince) {
      toast.error('Please select your province');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    // Validate additional pledges
    for (const pledge of additionalPledges) {
      if (!pledge.name.trim()) {
        toast.error('Please fill in all names for additional pledges');
        return;
      }
      if (!pledge.relationship.trim()) {
        toast.error('Please fill in all relationships for additional pledges');
        return;
      }
      if (!pledge.province) {
        toast.error('Please select province for all additional pledges');
        return;
      }
      if (!pledge.gender) {
        toast.error('Please select gender for all additional pledges');
        return;
      }
      if (pledge.amount < 1200) {
        toast.error('All pledge amounts must be at least R1,200');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const pledgeData = {
        amount: pledgeAmount,
        province: selectedProvince,
        additionalPledges: additionalPledges.map(pledge => ({
          name: pledge.name,
          relationship: pledge.relationship,
          amount: pledge.amount,
          province: pledge.province,
          gender: pledge.gender
        }))
      };

      const response = await fetch(`/api/initiatives/${COMMERCIAL_BANK_ID}/pledges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(pledgeData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Pledge submitted successfully!');
        // Reset form
        setPledgeAmount(1200);
        setAdditionalPledges([]);
        setAgreedToTerms(false);
        // Reload data to show updated statistics
        await loadInitiativeData();
      } else {
        toast.error(result.error || 'Failed to submit pledge');
      }
    } catch (error) {
      console.error('Pledge submission error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/initiatives/${COMMERCIAL_BANK_ID}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ comment: newComment.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        setComments([result.comment, ...comments]);
        setNewComment('');
        toast.success('Comment added successfully!');
      } else {
        toast.error(result.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Comment submission error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLike: boolean) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to react to comments');
      return;
    }

    // Find the current comment to calculate optimistic updates
    const currentComment = comments.find(c => c.id === commentId);
    if (!currentComment) return;

    // Calculate optimistic state changes
    let newLikeCount = currentComment.like_count || 0;
    let newDislikeCount = currentComment.dislike_count || 0;
    let newUserReaction: boolean | null = isLike;
    let action = 'added';

    if (currentComment.user_reaction === isLike) {
      // Same reaction - remove it (toggle off)
      newUserReaction = null;
      if (isLike) {
        newLikeCount = Math.max(0, newLikeCount - 1);
      } else {
        newDislikeCount = Math.max(0, newDislikeCount - 1);
      }
      action = 'removed';
    } else if (currentComment.user_reaction !== null && currentComment.user_reaction !== isLike) {
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
    const optimisticComments = comments.map(comment =>
      comment.id === commentId
        ? {
            ...comment,
            like_count: newLikeCount,
            dislike_count: newDislikeCount,
            user_reaction: newUserReaction
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
      const response = await fetch(`/api/initiatives/comments/${commentId}/like`, {
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
                like_count: result.likeCount,
                dislike_count: result.dislikeCount,
                user_reaction: result.userReaction
              }
            : comment
        ));
      } else {
        // Revert optimistic update on error
        setComments(comments);
        toast.error(result.error || 'Failed to react to comment');
      }
    } catch (error) {
      // Revert optimistic update on network error
      setComments(comments);
      console.error('Like comment error:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const handleEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingCommentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/initiatives/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ comment: editingCommentText.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        setComments(comments.map(comment =>
          comment.id === commentId
            ? { ...comment, comment: result.comment, updated_at: result.updated_at }
            : comment
        ));
        setEditingCommentId(null);
        setEditingCommentText('');
        toast.success('Comment updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Edit comment error:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/initiatives/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok) {
        setComments(comments.filter(comment => comment.id !== commentId));
        toast.success('Comment deleted successfully!');
      } else {
        toast.error(result.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      toast.error('Network error. Please try again.');
    }
  };


  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return { text: 'Admin', color: 'bg-orange-100 text-orange-800 border-orange-300' };
      case 'staff':
        return { text: 'Staff', color: 'bg-green-100 text-green-800 border-green-300' };
      case 'volunteer':
        return { text: 'Volunteer', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'regular':
      case 'member':
      default:
        return { text: 'Member', color: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  };

  const canModifyComment = (comment: Comment) => {
    if (!user) return false;
    // User can modify if they own the comment or if they are admin/staff
    return comment.user_id === user.id || user.userRole === 'admin' || user.userRole === 'staff';
  };

  // Calculate real statistics from loaded data
  const totalPledged = initiative?.currentAmount || 0;
  const totalParticipants = initiative?.currentParticipants || 0;
  const targetAmount = initiative?.targetAmount || 1200000000;
  const progressPercentage = (totalPledged / targetAmount) * 100;

  // Use real province data if available, otherwise show empty
  const realProvinceData = pledgeStats?.provinceBreakdown || [];

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 animate-spin mx-auto mb-4">
            <Image src="/2.png" alt="Loading..." width={48} height={48} className="h-12 w-12" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Initiative...</h2>
          <p className="text-gray-600">Please wait while we load the pledge data.</p>
        </div>
      </div>
    );
  }

  const addAdditionalPledge = () => {
    setAdditionalPledges([...additionalPledges, {
      id: Date.now(),
      name: '',
      relationship: '',
      amount: 1200,
      province: '',
      gender: ''
    }]);
  };

  const removeAdditionalPledge = (id: number) => {
    setAdditionalPledges(additionalPledges.filter(pledge => pledge.id !== id));
  };

  const updateAdditionalPledge = (id: number, field: string, value: string | number) => {
    setAdditionalPledges(additionalPledges.map(pledge => 
      pledge.id === id ? { ...pledge, [field]: value } : pledge
    ));
  };

  const calculateTotalPledge = () => {
    const additionalTotal = additionalPledges.reduce((sum, pledge) => sum + pledge.amount, 0);
    return pledgeAmount + additionalTotal;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-black text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-600 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Commercial Bank <span className="text-[#cdf556]">Pledge Drive</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
              Join the movement to establish our own commercial bank. Every pledge brings us closer to financial independence.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/initiatives/learn-more?initiative=commercial-bank">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                  <Info className="h-4 w-4 mr-2" />
                  Learn More About This Initiative
                </Button>
              </Link>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white text-black rounded-none border-0">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  R{(totalPledged / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-gray-600">Total Pledged</div>
              </CardContent>
            </Card>
            <Card className="bg-white text-black rounded-none border-0">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-black mb-2">
                  {totalParticipants.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Participants</div>
              </CardContent>
            </Card>
            <Card className="bg-white text-black rounded-none border-0">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-[#cdf556] mb-2">
                  {progressPercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Progress</div>
              </CardContent>
            </Card>
            <Card className="bg-white text-black rounded-none border-0">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  R1.2B
                </div>
                <div className="text-sm text-gray-600">Target</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Pledge Form */}
          <div>
            <Card className="border border-black rounded-none">
              <CardHeader>
                <CardTitle className="text-2xl text-black">Make Your Pledge</CardTitle>
                <p className="text-gray-600">Minimum pledge amount is R1,200 per person</p>
                {!isAuthenticated && (
                  <div className="bg-orange-50 border border-orange-200 rounded-none p-4">
                    <div className="flex items-center gap-2 text-orange-800 mb-2">
                      <LogIn className="h-5 w-5" />
                      <span className="font-medium">Sign In Required</span>
                    </div>
                    <p className="text-sm text-orange-700 mb-3">
                      You need to be signed in to make a pledge. Join our community to participate.
                    </p>
                    <div className="flex gap-2">
                      <Link href="/signin">
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white rounded-none">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/signup">
                        <Button size="sm" variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white rounded-none">
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Pledge */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black">Your Pledge</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount (R)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min={1200}
                        value={pledgeAmount}
                        onChange={(e) => setPledgeAmount(Number(e.target.value))}
                        className="border-black rounded-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Province</Label>
                      <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                        <SelectTrigger className="border-black rounded-none">
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent className='rounded-none'>
                          <SelectItem className='rounded-none' value="eastern-cape">Eastern Cape</SelectItem>
                          <SelectItem className='rounded-none' value="free-state">Free State</SelectItem>
                          <SelectItem className='rounded-none' value="gauteng">Gauteng</SelectItem>
                          <SelectItem className='rounded-none' value="kwazulu-natal">KwaZulu-Natal</SelectItem>
                          <SelectItem className='rounded-none' value="limpopo">Limpopo</SelectItem>
                          <SelectItem className='rounded-none' value="mpumalanga">Mpumalanga</SelectItem>
                          <SelectItem className='rounded-none' value="northern-cape">Northern Cape</SelectItem>
                          <SelectItem className='rounded-none' value="north-west">North West</SelectItem>
                          <SelectItem className='rounded-none' value="western-cape">Western Cape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Additional Pledges */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-black">Additional Pledges</h3>
                    <Button 
                      onClick={addAdditionalPledge}
                      variant="outline" 
                      className="border-black text-black hover:bg-black rounded-none hover:text-white"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Person
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pledge for family members, unemployed relatives, children, etc. Each person can be in a different province.
                  </p>

                  {additionalPledges.map((pledge) => (
                    <Card key={pledge.id} className="border rounded-none border-gray-300 p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-black">Additional Person</h4>
                          <Button
                            onClick={() => removeAdditionalPledge(pledge.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-500 rounded-none hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Name</Label>
                              <Input
                                value={pledge.name}
                                onChange={(e) => updateAdditionalPledge(pledge.id, 'name', e.target.value)}
                                placeholder="Full name"
                                className="border-black rounded-none"
                              />
                            </div>
                            <div>
                              <Label>Relationship</Label>
                              <Input
                                value={pledge.relationship}
                                onChange={(e) => updateAdditionalPledge(pledge.id, 'relationship', e.target.value)}
                                placeholder="e.g. Son, Mother"
                                className="border-black rounded-none"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Amount (R)</Label>
                              <Input
                                type="number"
                                min={1200}
                                value={pledge.amount}
                                onChange={(e) => updateAdditionalPledge(pledge.id, 'amount', Number(e.target.value))}
                                className="border-black rounded-none"
                              />
                            </div>
                            <div>
                              <Label>Province</Label>
                              <Select
                                value={pledge.province}
                                onValueChange={(value) => updateAdditionalPledge(pledge.id, 'province', value)}
                              >
                                <SelectTrigger className="border-black rounded-none">
                                  <SelectValue placeholder="Select province" />
                                </SelectTrigger>
                                <SelectContent className='rounded-none'>
                                  <SelectItem className='rounded-none' value="eastern-cape">Eastern Cape</SelectItem>
                                  <SelectItem className='rounded-none' value="free-state">Free State</SelectItem>
                                  <SelectItem className='rounded-none' value="gauteng">Gauteng</SelectItem>
                                  <SelectItem className='rounded-none' value="kwazulu-natal">KwaZulu-Natal</SelectItem>
                                  <SelectItem className='rounded-none' value="limpopo">Limpopo</SelectItem>
                                  <SelectItem className='rounded-none' value="mpumalanga">Mpumalanga</SelectItem>
                                  <SelectItem className='rounded-none' value="northern-cape">Northern Cape</SelectItem>
                                  <SelectItem className='rounded-none' value="north-west">North West</SelectItem>
                                  <SelectItem className='rounded-none' value="western-cape">Western Cape</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <Label>Gender</Label>
                              <Select
                                value={pledge.gender}
                                onValueChange={(value) => updateAdditionalPledge(pledge.id, 'gender', value)}
                              >
                                <SelectTrigger className="border-black rounded-none">
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem className='rounded-none' value="male">Male</SelectItem>
                                  <SelectItem className='rounded-none' value="female">Female</SelectItem>
                                  <SelectItem className='rounded-none' value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Total and Terms */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-black">Total Pledge:</span>
                    <span className="text-2xl font-bold text-orange-600">
                      R{calculateTotalPledge().toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-6">
                    <Checkbox 
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the terms and conditions and understand this pledge is binding
                    </Label>
                  </div>

                  <Button
                    onClick={handleSubmitPledge}
                    className="w-full bg-orange-600 rounded-none hover:bg-orange-700 text-white"
                    disabled={!isAuthenticated || !agreedToTerms || calculateTotalPledge() < 1200 || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Pledge'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard */}
          <div className="space-y-6">
            {/* Progress Chart */}
            <Card className="border border-black rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  <Target className="h-5 w-5" />
                  Progress to Target
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-200 h-4 mb-4">
                  <div 
                    className="bg-[#cdf556] h-4 transition-all duration-300"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600">
                  R{(totalPledged / 1000000).toFixed(1)}M of R1,200M target ({progressPercentage.toFixed(1)}%)
                </div>
              </CardContent>
            </Card>

            {/* Province Breakdown */}
            <Card className="border border-black rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  <MapPin className="h-5 w-5" />
                  Pledges by Province
                </CardTitle>
              </CardHeader>
              <CardContent>
                {realProvinceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={realProvinceData.map((item: ProvinceDataItem) => ({
                      province: item.province.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                      amount: parseFloat(item.province_amount),
                      participants: item.pledge_count
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="province" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name) => [
                          name === 'amount' ? `R${(Number(value) / 1000).toFixed(0)}k` : value,
                          name === 'amount' ? 'Amount' : 'Participants'
                        ]}
                      />
                      <Bar dataKey="amount" fill="#ea580c" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No provincial data available yet.</p>
                    <p className="text-sm">Be the first to make a pledge!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gender Breakdown */}
            <Card className="border border-black rounded-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  <Users className="h-5 w-5" />
                  Pledges by Gender
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pledgeStats?.stats && (pledgeStats.stats.malePledges > 0 || pledgeStats.stats.femalePledges > 0) ? (
                  <>
                    <ChartContainer
                      config={{
                        male: {
                          label: "Male",
                          color: "#ea580c",
                        },
                        female: {
                          label: "Female",
                          color: "#000000",
                        },
                      }}
                      className="h-[250px]"
                    >
                      <PieChart>
                        <Pie
                          data={[
                            {
                              gender: 'Male',
                              amount: pledgeStats.stats.malePledges,
                              color: '#ea580c'
                            },
                            {
                              gender: 'Female',
                              amount: pledgeStats.stats.femalePledges,
                              color: '#000000'
                            }
                          ].filter(item => item.amount > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="amount"
                          nameKey="gender"
                        >
                          {[
                            { color: '#ea580c' },
                            { color: '#000000' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>

                    <div className="mt-4 space-y-2">
                      {pledgeStats.stats.malePledges > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-600"></div>
                            <span className="font-medium">Male</span>
                          </div>
                          <div className="text-right">
                            <div>{pledgeStats.stats.malePledges} pledges</div>
                          </div>
                        </div>
                      )}
                      {pledgeStats.stats.femalePledges > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-black"></div>
                            <span className="font-medium">Female</span>
                          </div>
                          <div className="text-right">
                            <div>{pledgeStats.stats.femalePledges} pledges</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No gender data available yet.</p>
                    <p className="text-sm">Pledge data will appear here as people participate.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comments Section */}
        <section className="mt-16 max-w-4xl mx-auto">
          <Card className="border border-black rounded-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <MessageCircle className="h-5 w-5" />
                Discussion ({comments.length})
              </CardTitle>
              <p className="text-gray-600">Share your thoughts and questions about this initiative</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comment Form */}
              <div className="space-y-4">
                {!isAuthenticated ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-none p-4">
                    <div className="flex items-center gap-2 text-orange-800 mb-2">
                      <LogIn className="h-5 w-5" />
                      <span className="font-medium">Sign In to Join Discussion</span>
                    </div>
                    <p className="text-sm text-orange-700 mb-3">
                      You need to be signed in to comment. Join our community to participate in discussions.
                    </p>
                    <div className="flex gap-2">
                      <Link href="/signin">
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white rounded-none">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/signup">
                        <Button size="sm" variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white rounded-none">
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Share your thoughts about this initiative..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="border-black rounded-none resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {newComment.length}/500 characters
                      </span>
                      <Button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || isSubmittingComment}
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                      >
                        {isSubmittingComment ? (
                          'Posting...'
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Post Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No comments yet.</p>
                    <p className="text-sm">Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <CommentComponent
                      key={comment.id}
                      comment={comment}
                      onLike={handleLikeComment}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                      canModifyComment={canModifyComment}
                      getRoleLabel={getRoleLabel}
                      editingCommentId={editingCommentId}
                      editingCommentText={editingCommentText}
                      setEditingCommentText={setEditingCommentText}
                      handleCancelEdit={handleCancelEdit}
                      handleSaveEdit={handleSaveEdit}
                      isAuthenticated={isAuthenticated}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default CommercialBankPledgePage;