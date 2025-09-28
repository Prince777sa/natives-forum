"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Building2,
  ShoppingCart,
  Wheat,
  Factory,
  Vote,
  ArrowRight,
  ArrowLeft,
  Target,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink,
  MessageCircle,
  Send,
  LogIn,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Edit,
  X,
  Check,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import UserInfo from '@/components/UserInfo';

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

interface InitiativeDetail {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  icon: React.ComponentType<{ className?: string; }>;
  color: string;
  category: string;
  status: string;
  targetAmount?: number;
  targetParticipants?: number;
  pledgeLink?: string;

  // Detailed content sections
  overview: string;
  objectives: string[];
  benefits: string[];
  implementation: {
    phase: string;
    description: string;
    timeline: string;
  }[];
  requirements: string[];
  impact: string;
  nextSteps: string[];
}

// Map initiative string identifiers to database UUIDs
const initiativeIdMap: { [key: string]: string } = {
  'commercial-bank': 'e29a2ad1-b1cc-4066-8772-e2dec9654976',
  // Add other initiative IDs as they are created in the database
  'spaza-shop': 'spaza-shop-uuid-placeholder',
  'food-value-chain': 'food-value-chain-uuid-placeholder',
  'industrial-development': 'industrial-development-uuid-placeholder',
  'political-representation': 'political-representation-uuid-placeholder'
};

// Detailed initiative data
const initiativeDetails: { [key: string]: InitiativeDetail } = {
    'commercial-bank': {
      id: 'commercial-bank',
      title: 'Commercial Bank Initiative',
      description: 'Establish our own commercial bank to serve the native community with fair, accessible financial services.',
      longDescription: 'The Commercial Bank Initiative aims to create a fully-licensed commercial bank owned and operated by the native community. This bank will provide traditional banking services while prioritizing community development, fair lending practices, and wealth building within our communities.',
      icon: Building2,
      color: 'bg-orange-600',
      category: 'Banking & Finance',
      status: 'Active',
      targetAmount: 1200000000, // R1.2 billion
      targetParticipants: 1000000,
      pledgeLink: '/initiatives/commercial-bank',

      overview: 'Financial institutions have historically excluded and exploited our communities. By establishing our own commercial bank, we take control of our financial destiny. This bank will offer competitive rates, community-focused lending, and will reinvest profits back into native economic development.',

      objectives: [
        'Establish a fully-licensed commercial bank with SARB approval',
        'Provide affordable banking services to underserved communities',
        'Create sustainable financing for black-owned businesses',
        'Build wealth within native communities through responsible banking',
        'Offer competitive interest rates and minimal fees',
        'Develop financial literacy programs for community empowerment'
      ],

      benefits: [
        'Access to fair and affordable banking services',
        'Community ownership and democratic governance',
        'Profits reinvested in community development',
        'Support for local businesses and entrepreneurs',
        'Creation of high-quality jobs in banking sector',
        'Economic independence from exploitative institutions',
        'Platform for collective wealth building',
        'Financial services designed for our community needs'
      ],

      implementation: [
        {
          phase: 'Phase 1: Capital Raising',
          description: 'Collect pledges and initial capital from community members',
          timeline: 'Months 1-12'
        },
        {
          phase: 'Phase 2: Regulatory Approval',
          description: 'Apply for banking license with South African Reserve Bank',
          timeline: 'Months 6-18'
        },
        {
          phase: 'Phase 3: Infrastructure Development',
          description: 'Build banking technology, hire staff, establish branches',
          timeline: 'Months 12-24'
        },
        {
          phase: 'Phase 4: Launch Operations',
          description: 'Begin offering banking services to community members',
          timeline: 'Month 24+'
        }
      ],

      requirements: [
        'Minimum R1.2 billion in committed capital',
        'SARB banking license approval',
        'Experienced banking leadership team',
        'Robust technology and security infrastructure',
        'Physical branch network in key communities',
        'Strong governance and risk management systems'
      ],

      impact: 'A community-owned bank will transform how we access and use financial services. It will create a pathway to homeownership, business development, and wealth accumulation that has been denied to our communities for generations. The bank will serve as an anchor institution, keeping money circulating within our communities and funding our collective growth.',

      nextSteps: [
        'Reach pledge target of R1.2 billion',
        'Engage banking consultants and legal experts',
        'Submit formal application to SARB',
        'Establish interim board of directors',
        'Begin recruitment of executive leadership',
        'Develop detailed business plan and financial projections'
      ]
    },

    'spaza-shop': {
      id: 'spaza-shop',
      title: 'Spaza Shop Network',
      description: 'Reclaim the informal economy by creating a network of native-owned spaza shops.',
      longDescription: 'The Spaza Shop Network Initiative focuses on supporting and expanding native-owned spaza shops to reclaim control of the informal economy in our communities.',
      icon: ShoppingCart,
      color: 'bg-black',
      category: 'Informal Economy',
      status: 'Planning',
      targetParticipants: 2000,

      overview: 'Spaza shops are the economic backbone of our communities, yet many are now owned by foreign nationals. This initiative aims to support native entrepreneurs in establishing and running successful spaza shops, creating a network of community-owned businesses.',

      objectives: [
        'Support 2000 new native-owned spaza shops',
        'Provide training and mentorship for spaza shop owners',
        'Establish supply chain networks for better pricing',
        'Create access to business financing through our bank',
        'Implement modern payment systems and inventory management',
        'Build cooperative buying power for bulk purchasing'
      ],

      benefits: [
        'Job creation in local communities',
        'Profits remain within native communities',
        'Improved access to essential goods and services',
        'Skills development in entrepreneurship',
        'Strengthened local economic ecosystems',
        'Reduced dependency on external suppliers'
      ],

      implementation: [
        {
          phase: 'Phase 1: Program Development',
          description: 'Create training curriculum and support systems',
          timeline: 'Months 1-6'
        },
        {
          phase: 'Phase 2: Pilot Launch',
          description: 'Launch pilot program with 50 shops in select areas',
          timeline: 'Months 6-12'
        },
        {
          phase: 'Phase 3: Network Expansion',
          description: 'Scale successful model to 500 shops',
          timeline: 'Months 12-24'
        },
        {
          phase: 'Phase 4: Full Rollout',
          description: 'Reach target of 2000 network shops',
          timeline: 'Months 24-36'
        }
      ],

      requirements: [
        'Business training and mentorship programs',
        'Access to startup capital and financing',
        'Supply chain partnerships and bulk purchasing agreements',
        'Technology systems for inventory and payments',
        'Ongoing business support and advisory services'
      ],

      impact: 'A thriving network of native-owned spaza shops will reclaim economic control at the grassroots level, creating thousands of jobs and keeping money circulating within our communities.',

      nextSteps: [
        'Develop comprehensive business training program',
        'Establish partnerships with suppliers and wholesalers',
        'Create financing mechanisms through the bank',
        'Identify and recruit initial participants',
        'Set up technology and payment systems'
      ]
    },

    'food-value-chain': {
      id: 'food-value-chain',
      title: 'Food Value Chain Initiative',
      description: 'Control our food system from farm to table through sustainable, community-owned food production and distribution.',
      longDescription: 'The Food Value Chain Initiative aims to establish complete control over food production, processing, and distribution within native communities, ensuring food security and economic benefits.',
      icon: Wheat,
      color: 'bg-[#cdf556]',
      category: 'Agriculture & Food',
      status: 'Planning',
      targetParticipants: 3000,

      overview: 'Food security is national security. By controlling our entire food value chain from agricultural production to retail distribution, we ensure access to healthy, affordable food while creating economic opportunities throughout the system.',

      objectives: [
        'Establish 500 community-supported farms',
        'Build food processing and packaging facilities',
        'Create distribution networks to communities',
        'Develop organic and sustainable farming practices',
        'Train 3000 people in agricultural and food industry skills',
        'Ensure food security for participating communities'
      ],

      benefits: [
        'Food security and sovereignty for communities',
        'Thousands of jobs across the agricultural value chain',
        'Access to fresh, healthy, affordable food',
        'Environmental sustainability through organic farming',
        'Skills development in agriculture and food processing',
        'Export opportunities for surplus production'
      ],

      implementation: [
        {
          phase: 'Phase 1: Land Acquisition',
          description: 'Secure agricultural land through purchase or partnerships',
          timeline: 'Months 1-12'
        },
        {
          phase: 'Phase 2: Farming Operations',
          description: 'Begin food production on acquired land',
          timeline: 'Months 6-18'
        },
        {
          phase: 'Phase 3: Processing Infrastructure',
          description: 'Build food processing and packaging facilities',
          timeline: 'Months 12-24'
        },
        {
          phase: 'Phase 4: Distribution Network',
          description: 'Establish distribution to spaza shops and communities',
          timeline: 'Months 18-30'
        }
      ],

      requirements: [
        'Access to agricultural land and water rights',
        'Farming equipment and technology',
        'Seeds, fertilizers, and organic inputs',
        'Food processing and packaging equipment',
        'Cold storage and distribution vehicles',
        'Skilled farmers and agricultural technicians'
      ],

      impact: 'Complete control of our food system will eliminate food insecurity, create thousands of jobs, and build sustainable wealth in rural and urban communities while ensuring environmental sustainability.',

      nextSteps: [
        'Identify and acquire suitable agricultural land',
        'Develop partnerships with agricultural institutions',
        'Create farmer training and support programs',
        'Establish processing facility locations',
        'Build distribution agreements with spaza shop network'
      ]
    },

    'industrial-development': {
      id: 'industrial-development',
      title: 'Industrial Development Initiative',
      description: 'Build manufacturing capacity to produce what we consume and develop technical skills for economic self-sufficiency.',
      longDescription: 'The Industrial Development Initiative focuses on establishing manufacturing capabilities in strategic industries to reduce import dependency and create high-value jobs.',
      icon: Factory,
      color: 'bg-black',
      category: 'Manufacturing & Industry',
      status: 'Planning',
      targetParticipants: 5000,

      overview: 'True economic independence requires the ability to produce what we consume. This initiative will establish manufacturing facilities in strategic industries while developing the technical skills needed for modern industrial production.',

      objectives: [
        'Establish manufacturing facilities in 5 key industries',
        'Create 10,000 high-skilled manufacturing jobs',
        'Develop technical training and apprenticeship programs',
        'Build supply chains for raw materials and components',
        'Achieve 30% import substitution in target industries',
        'Develop export capabilities for surplus production'
      ],

      benefits: [
        'High-paying jobs in manufacturing sector',
        'Reduced dependency on imports',
        'Technical skills development for communities',
        'Industrial capacity for economic independence',
        'Export revenue and foreign exchange earnings',
        'Technology transfer and innovation capabilities'
      ],

      implementation: [
        {
          phase: 'Phase 1: Industry Analysis',
          description: 'Identify priority industries and market opportunities',
          timeline: 'Months 1-6'
        },
        {
          phase: 'Phase 2: Facility Development',
          description: 'Establish manufacturing facilities and equipment',
          timeline: 'Months 6-24'
        },
        {
          phase: 'Phase 3: Skills Development',
          description: 'Train workforce in technical and manufacturing skills',
          timeline: 'Months 12-30'
        },
        {
          phase: 'Phase 4: Production Launch',
          description: 'Begin commercial production and sales',
          timeline: 'Months 24-36'
        }
      ],

      requirements: [
        'Industrial land and facilities',
        'Manufacturing equipment and technology',
        'Skilled technicians and engineers',
        'Access to raw materials and supply chains',
        'Quality control and certification systems',
        'Market access and distribution channels'
      ],

      impact: 'Industrial capacity will create thousands of high-paying jobs, reduce import dependency, and build the technical foundation for long-term economic independence and prosperity.',

      nextSteps: [
        'Complete detailed industry and market analysis',
        'Identify suitable industrial sites',
        'Develop partnerships with technology providers',
        'Create technical training and education programs',
        'Establish financing mechanisms for equipment'
      ]
    },

    'political-representation': {
      id: 'political-representation',
      title: 'Political Representation Initiative',
      description: 'Build a political movement that truly represents native interests through community-driven policy development.',
      longDescription: 'The Political Representation Initiative aims to create authentic political representation through community participation in policy development and candidate selection.',
      icon: Vote,
      color: 'bg-orange-600',
      category: 'Politics & Governance',
      status: 'Planning',
      targetParticipants: 10000,

      overview: 'Political representation that serves our communities requires active participation in policy development and candidate selection. This initiative creates mechanisms for community-driven political engagement.',

      objectives: [
        'Engage 10,000 community members in political process',
        'Develop community-driven policy proposals',
        'Establish candidate vetting and selection processes',
        'Create voter education and mobilization programs',
        'Build coalitions across different communities',
        'Advocate for policies that benefit native communities'
      ],

      benefits: [
        'Authentic political representation of community interests',
        'Community-driven policy development',
        'Increased political participation and engagement',
        'Better advocacy for economic and social issues',
        'Stronger democratic participation',
        'Policy outcomes that benefit our communities'
      ],

      implementation: [
        {
          phase: 'Phase 1: Community Engagement',
          description: 'Build grassroots participation and awareness',
          timeline: 'Months 1-12'
        },
        {
          phase: 'Phase 2: Policy Development',
          description: 'Create community-driven policy proposals',
          timeline: 'Months 6-18'
        },
        {
          phase: 'Phase 3: Candidate Development',
          description: 'Identify and prepare candidates for office',
          timeline: 'Months 12-24'
        },
        {
          phase: 'Phase 4: Electoral Engagement',
          description: 'Participate in elections and advocacy',
          timeline: 'Ongoing'
        }
      ],

      requirements: [
        'Community organizing and mobilization capacity',
        'Policy research and development expertise',
        'Voter education and registration systems',
        'Candidate training and development programs',
        'Coalition building and partnership capacity'
      ],

      impact: 'True political representation will ensure that government policies and programs serve the interests of native communities, creating the political foundation for economic and social transformation.',

      nextSteps: [
        'Establish community organizing infrastructure',
        'Develop policy research and analysis capacity',
        'Create voter education and mobilization programs',
        'Build partnerships with civil society organizations',
        'Begin community consultations on priority issues'
      ]
    }
  };

const InitiativeLearnMore = () => {
  const searchParams = useSearchParams();
  const initiativeParam = searchParams.get('initiative') || 'commercial-bank';
  const { user, isAuthenticated } = useAuth();

  const [selectedInitiative, setSelectedInitiative] = useState<InitiativeDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const loadComments = useCallback(async (initiativeKey: string) => {
    const initiativeId = initiativeIdMap[initiativeKey];
    if (!initiativeId || initiativeId.includes('placeholder')) {
      // If no real database ID exists, don't try to load comments
      setComments([]);
      return;
    }

    try {
      const response = await fetch(`/api/initiatives/${initiativeId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments([]);
    }
  }, []);

  useEffect(() => {
    const initiative = initiativeDetails[initiativeParam];
    if (initiative) {
      setSelectedInitiative(initiative);
      loadComments(initiativeParam);
    } else {
      setSelectedInitiative(initiativeDetails['commercial-bank']); // Default fallback
      loadComments('commercial-bank');
    }
  }, [initiativeParam, loadComments]);

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    const initiativeId = initiativeIdMap[initiativeParam];
    if (!initiativeId || initiativeId.includes('placeholder')) {
      toast.error('Comments are not available for this initiative yet');
      return;
    }

    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/initiatives/${initiativeId}/comments`, {
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

  const handleDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      const response = await fetch(`/api/initiatives/comments/${commentToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok) {
        setComments(comments.filter(comment => comment.id !== commentToDelete));
        toast.success('Comment deleted successfully!');
      } else {
        toast.error(result.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    }
  };

  const cancelDeleteComment = () => {
    setDeleteDialogOpen(false);
    setCommentToDelete(null);
  };


  const canModifyComment = (comment: Comment) => {
    if (!user) return false;
    // User can modify if they own the comment or if they are admin/staff
    return comment.user_id === user.id || user.userRole === 'admin' || user.userRole === 'staff';
  };

  if (!selectedInitiative) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-orange-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Initiative Not Found</h2>
          <p className="text-gray-600">The requested initiative could not be found.</p>
          <Link href="/initiatives">
            <Button className="mt-4 bg-orange-600 rounded-none hover:bg-orange-700 text-white">
              View All Initiatives
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = selectedInitiative.icon;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-black text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/initiatives">
              <Button variant="outline" size="sm" className="border-white rounded-none text-black hover:bg-white hover:text-black">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Initiatives
              </Button>
            </Link>
            <Badge className={`${selectedInitiative.color} text-white border-0 rounded-none`}>
              {selectedInitiative.category}
            </Badge>
          </div>

          <div className="flex items-start gap-6">
            <div className={`w-16 h-16 ${selectedInitiative.color} flex items-center justify-center`}>
              <IconComponent className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4">{selectedInitiative.title}</h1>
              <p className="text-xl text-gray-300 mb-6">{selectedInitiative.longDescription}</p>

              <div className="flex flex-wrap gap-4">
                {selectedInitiative.pledgeLink && (
                  <Link href={selectedInitiative.pledgeLink}>
                    <Button className="bg-[#cdf556] rounded-none text-black hover:bg-[#bde345]">
                      <Target className="h-4 w-4 mr-2" />
                      Make a Pledge
                    </Button>
                  </Link>
                )}
                <Link href="/blog">
                  <Button variant="outline" className="border-white rounded-none text-black hover:bg-white hover:text-black">
                    <Users className="h-4 w-4 mr-2" />
                    Join Discussion
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Overview */}
        <Card className="border border-black rounded-none mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <Info className="h-5 w-5" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{selectedInitiative.overview}</p>
          </CardContent>
        </Card>

        {/* Objectives */}
        <Card className="border border-black rounded-none mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <Target className="h-5 w-5" />
              Key Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {selectedInitiative.objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#cdf556] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{objective}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="border border-black rounded-none mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <Users className="h-5 w-5" />
              Community Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedInitiative.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50">
                  <div className="w-2 h-2 bg-orange-600 mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Implementation Timeline */}
        <Card className="border border-black rounded-none mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <Calendar className="h-5 w-5" />
              Implementation Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedInitiative.implementation.map((phase, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-orange-600 text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    {index < selectedInitiative.implementation.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-300 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <h4 className="font-semibold text-black mb-1">{phase.phase}</h4>
                    <p className="text-gray-700 mb-2">{phase.description}</p>
                    <Badge variant="outline" className="border-orange-600 rounded-none text-orange-600">
                      {phase.timeline}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="border border-black rounded-none mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <CheckCircle className="h-5 w-5" />
              Key Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {selectedInitiative.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-black mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{requirement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Expected Impact */}
        <Card className="border border-black rounded-none mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <Target className="h-5 w-5" />
              Expected Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed italic">{selectedInitiative.impact}</p>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="border border-black rounded-none mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <ArrowRight className="h-5 w-5" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {selectedInitiative.nextSteps.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <div className="w-6 h-6 bg-[#cdf556] text-black flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Comments Section */}
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
                  {initiativeIdMap[initiativeParam]?.includes('placeholder') ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-none p-4">
                      <p className="text-gray-600 text-center">
                        Comments will be available when this initiative becomes active.
                      </p>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
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
                  <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <UserInfo
                        user={{
                          id: comment.user_id,
                          firstName: comment.first_name,
                          lastName: comment.last_name,
                          userRole: comment.user_role,
                          profileImageUrl: comment.profile_image_url,
                          verificationStatus: comment.verification_status || 'no'
                        }}
                        avatarSize="md"
                        showRole={true}
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString()}
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
                                <DropdownMenuItem onClick={() => handleEditComment(comment.id, comment.comment)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {editingCommentId === comment.id ? (
                          <div className="space-y-3 mb-3">
                            <Textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              className="border-black rounded-none resize-none"
                              rows={3}
                              maxLength={500}
                            />
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                {editingCommentText.length}/500 characters
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-none"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(comment.id)}
                                  disabled={!editingCommentText.trim()}
                                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                                >
                                  <Check className="h-4 w-4 mr-1" />
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

                        {/* Like/Dislike Buttons */}
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLikeComment(comment.id, true)}
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
                            onClick={() => handleLikeComment(comment.id, false)}
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
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="border border-black rounded-none bg-[#cdf556]">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-black mb-4">Ready to Get Involved?</h3>
            <p className="text-black mb-6">
              Join thousands of community members working together to build our collective future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {selectedInitiative.pledgeLink && (
                <Link href={selectedInitiative.pledgeLink}>
                  <Button size="lg" className="bg-black rounded-none text-white hover:bg-gray-800">
                    <Target className="h-5 w-5 mr-2" />
                    Make a Pledge
                  </Button>
                </Link>
              )}
              <Link href="/blog">
                <Button size="lg" variant="outline" className="border-black rounded-none text-black hover:bg-black hover:text-white">
                  <Users className="h-5 w-5 mr-2" />
                  Join Community Discussion
                </Button>
              </Link>
              <Link href="/initiatives">
                <Button size="lg" variant="outline" className="border-black rounded-none text-black hover:bg-black hover:text-white">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  View All Initiatives
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
  );
};

export default function InitiativeLearnMorePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InitiativeLearnMore />
    </Suspense>
  );
}