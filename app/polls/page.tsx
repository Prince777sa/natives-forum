'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Vote,
  Calendar,
  User,
  TrendingUp,
  Eye,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Poll {
  id: string;
  title: string;
  description: string;
  content?: string;
  status: string;
  author: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  totalVotes: number;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    membershipNumber: string;
  };
}

const PollsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<{ [pollId: string]: string | null }>({});
  const [pollComments, setPollComments] = useState<{ [pollId: string]: Comment[] }>({});
  const [commentsDialogOpen, setCommentsDialogOpen] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/polls');
      if (response.ok) {
        const data = await response.json();
        setPolls(data.polls);

        // Fetch user votes for each poll if authenticated
        if (isAuthenticated) {
          const votes: { [pollId: string]: string | null } = {};
          for (const poll of data.polls) {
            const voteResponse = await fetch(`/api/polls/${poll.id}/vote`);
            if (voteResponse.ok) {
              const voteData = await voteResponse.json();
              votes[poll.id] = voteData.userVote;
            }
          }
          setUserVotes(votes);
        }
      }
    } catch (error) {
      console.error('Failed to fetch polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, voteType: 'up' | 'down') => {
    if (!isAuthenticated) {
      alert('Please sign in to vote');
      return;
    }

    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update poll vote counts
        setPolls(prev => prev.map(poll =>
          poll.id === pollId
            ? {
                ...poll,
                upvotes: data.upvotes,
                downvotes: data.downvotes,
                totalVotes: data.upvotes + data.downvotes
              }
            : poll
        ));

        // Update user vote
        setUserVotes(prev => ({
          ...prev,
          [pollId]: data.userVote
        }));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to submit vote');
    }
  };

  const fetchComments = async (pollId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setPollComments(prev => ({
          ...prev,
          [pollId]: data.comments
        }));
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleCommentSubmit = async (pollId: string) => {
    if (!isAuthenticated) {
      alert('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await fetch(`/api/polls/${pollId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update comments
        setPollComments(prev => ({
          ...prev,
          [pollId]: [data.comment, ...(prev[pollId] || [])]
        }));

        // Update comment count
        setPolls(prev => prev.map(poll =>
          poll.id === pollId
            ? { ...poll, commentCount: poll.commentCount + 1 }
            : poll
        ));

        setNewComment('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const openCommentsDialog = (pollId: string) => {
    setCommentsDialogOpen(pollId);
    fetchComments(pollId);
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

  const getVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 animate-spin mx-auto mb-4">
            <Image src="/2.png" alt="Loading..." width={48} height={48} className="h-12 w-12" />
          </div>
          <div className="text-2xl font-bold text-gray-900">Loading polls...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Community <span className="text-[#cdf556]">Polls</span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            Voice your opinion on issues that matter to our community
          </p>
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#cdf556]">{polls.length}</div>
              <div className="text-gray-300">Active Polls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#cdf556]">
                {polls.reduce((total, poll) => total + poll.totalVotes, 0)}
              </div>
              <div className="text-gray-300">Total Votes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#cdf556]">
                {polls.reduce((total, poll) => total + poll.commentCount, 0)}
              </div>
              <div className="text-gray-300">Comments</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" className="border-black rounded-none text-black hover:bg-black hover:text-white">
              <Filter className="h-4 w-4 mr-2" />
              All Polls
            </Button>
            <Button variant="outline" className="border-black rounded-none text-black hover:bg-black hover:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Most Popular
            </Button>
            <Button variant="outline" className="border-black rounded-none text-black hover:bg-black hover:text-white">
              <Calendar className="h-4 w-4 mr-2" />
              Recent
            </Button>
          </div>
        </div>
      </section>

      {/* Polls Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {polls.length === 0 ? (
            <div className="text-center py-16">
              <Vote className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No polls available</h3>
              <p className="text-gray-600">Check back later for community polls to participate in.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {polls.map((poll) => {
                const userVote = userVotes[poll.id];
                const upvotePercentage = getVotePercentage(poll.upvotes, poll.totalVotes);
                const downvotePercentage = getVotePercentage(poll.downvotes, poll.totalVotes);

                return (
                  <Card key={poll.id} className="border rounded-none border-black hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-600 rounded-none flex items-center justify-center">
                          <Vote className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {formatDate(poll.createdAt)}
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold text-black mb-2">
                        {poll.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <User className="h-4 w-4" />
                        By {poll.author}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="text-gray-600 leading-relaxed mb-6">
                        {poll.description}
                      </p>

                      {/* Voting Section */}
                      <div className="mb-6">
                        <div className="flex items-center gap-4 mb-4">
                          <Button
                            variant={userVote === 'up' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleVote(poll.id, 'up')}
                            className={`rounded-none ${
                              userVote === 'up'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'border-green-600 text-green-600 hover:bg-green-50'
                            }`}
                            disabled={!isAuthenticated}
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            {poll.upvotes}
                          </Button>

                          <Button
                            variant={userVote === 'down' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleVote(poll.id, 'down')}
                            className={`rounded-none ${
                              userVote === 'down'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'border-red-600 text-red-600 hover:bg-red-50'
                            }`}
                            disabled={!isAuthenticated}
                          >
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            {poll.downvotes}
                          </Button>

                          <div className="text-sm text-gray-500">
                            {poll.totalVotes} total votes
                          </div>
                        </div>

                        {/* Vote Progress Bars */}
                        {poll.totalVotes > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-gray-200 h-2">
                                <div
                                  className="bg-green-500 h-2 transition-all duration-300"
                                  style={{ width: `${upvotePercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 min-w-12">{upvotePercentage}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-gray-200 h-2">
                                <div
                                  className="bg-red-500 h-2 transition-all duration-300"
                                  style={{ width: `${downvotePercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 min-w-12">{downvotePercentage}%</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Comments Section */}
                      <div className="border-t border-gray-200 pt-4">
                        <Dialog
                          open={commentsDialogOpen === poll.id}
                          onOpenChange={(open) => setCommentsDialogOpen(open ? poll.id : null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCommentsDialog(poll.id)}
                              className="rounded-none border-black text-black hover:bg-black hover:text-white"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              {poll.commentCount} Comments
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-none max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Comments - {poll.title}</DialogTitle>
                            </DialogHeader>

                            {/* Add Comment */}
                            {isAuthenticated ? (
                              <div className="space-y-4 border-b border-gray-200 pb-4">
                                <Textarea
                                  placeholder="Share your thoughts..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="rounded-none border-black"
                                  rows={3}
                                />
                                <Button
                                  onClick={() => handleCommentSubmit(poll.id)}
                                  disabled={submittingComment || !newComment.trim()}
                                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                                  size="sm"
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  {submittingComment ? 'Posting...' : 'Post Comment'}
                                </Button>
                              </div>
                            ) : (
                              <div className="text-center py-4 border-b border-gray-200 mb-4">
                                <p className="text-gray-600 mb-2">Sign in to join the discussion</p>
                                <Link href="/signin">
                                  <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-none">
                                    Sign In
                                  </Button>
                                </Link>
                              </div>
                            )}

                            {/* Comments List */}
                            <div className="space-y-4">
                              {(pollComments[poll.id] || []).map((comment) => (
                                <div key={comment.id} className="border-b border-gray-100 pb-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-semibold text-gray-600">
                                        {comment.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">{comment.author.name}</div>
                                      <div className="text-sm text-gray-500">#{comment.author.membershipNumber}</div>
                                    </div>
                                    <div className="ml-auto text-sm text-gray-500">
                                      {formatDate(comment.createdAt)}
                                    </div>
                                  </div>
                                  <p className="text-gray-700">{comment.content}</p>
                                </div>
                              ))}

                              {pollComments[poll.id]?.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                  No comments yet. Be the first to share your thoughts!
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {!isAuthenticated && (
                        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-none">
                          <p className="text-sm text-orange-800">
                            <Link href="/signin" className="font-medium underline">Sign in</Link> to vote and comment on polls
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-[#cdf556] py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-6">
            Have a Question for the Community?
          </h2>
          <p className="text-lg text-black mb-8">
            Help shape our collective decisions by proposing new polls and engaging in meaningful discussions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-black text-white rounded-none hover:bg-gray-800 px-8 py-3">
              Propose Poll <Vote className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-black rounded-none text-black hover:bg-black hover:text-white px-8 py-3">
              Join Discussion
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PollsPage;