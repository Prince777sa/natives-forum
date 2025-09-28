"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, MapPin, Users, MessageCircle, User, Hash, Clock, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  endDate?: string;
  maxAttendees?: number;
  organizer: {
    name: string;
    membershipNumber: string;
  };
  rsvpCount: number;
  commentCount: number;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    membershipNumber: string;
  };
  createdAt: string;
}

interface RsvpCounts {
  attending: number;
  maybe: number;
  notAttending: number;
}

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentDialogOpen, setCommentDialogOpen] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userRsvps, setUserRsvps] = useState<{ [key: string]: string | null }>({});
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (isAuthenticated && events.length > 0) {
      fetchUserRsvps();
    }
  }, [isAuthenticated, events]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRsvps = async () => {
    if (!isAuthenticated) return;

    const rsvpPromises = events.map(async (event) => {
      try {
        const response = await fetch(`/api/events/${event.id}/rsvp`);
        const data = await response.json();
        return { eventId: event.id, userRsvp: data.userRsvp };
      } catch (error) {
        console.error('Error fetching user RSVP:', error);
        return { eventId: event.id, userRsvp: null };
      }
    });

    const rsvpResults = await Promise.all(rsvpPromises);
    const rsvpsMap = rsvpResults.reduce((acc, { eventId, userRsvp }) => {
      acc[eventId] = userRsvp;
      return acc;
    }, {} as { [key: string]: string | null });

    setUserRsvps(rsvpsMap);
  };

  const handleRsvp = async (eventId: string, status: 'attending' | 'not_attending' | 'maybe') => {
    if (!isAuthenticated) {
      alert('Please sign in to RSVP');
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const data = await response.json();

        setEvents(events =>
          events.map(event =>
            event.id === eventId
              ? { ...event, rsvpCount: data.rsvpCounts.attending }
              : event
          )
        );

        setUserRsvps(prev => ({
          ...prev,
          [eventId]: data.userRsvp
        }));
      }
    } catch (error) {
      console.error('Error submitting RSVP:', error);
    }
  };

  const fetchComments = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/comments`);
      const data = await response.json();
      setComments(prev => ({
        ...prev,
        [eventId]: data.comments || []
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCommentSubmit = async (eventId: string) => {
    if (!isAuthenticated) {
      alert('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/events/${eventId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        const data = await response.json();

        setComments(prev => ({
          ...prev,
          [eventId]: [data.comment, ...(prev[eventId] || [])]
        }));

        setEvents(events =>
          events.map(event =>
            event.id === eventId
              ? { ...event, commentCount: event.commentCount + 1 }
              : event
          )
        );

        setNewComment('');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const openCommentDialog = (eventId: string) => {
    setCommentDialogOpen(eventId);
    if (!comments[eventId]) {
      fetchComments(eventId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isEventPast = (eventDate: string) => {
    return new Date(eventDate) < new Date();
  };

  const isEventToday = (eventDate: string) => {
    const today = new Date();
    const event = new Date(eventDate);
    return today.toDateString() === event.toDateString();
  };

  const getRsvpButtonVariant = (status: string, userRsvp: string | null) => {
    if (userRsvp === status) {
      switch (status) {
        case 'attending': return 'default';
        case 'maybe': return 'secondary';
        case 'not_attending': return 'destructive';
        default: return 'outline';
      }
    }
    return 'outline';
  };

  const totalEvents = events.length;
  const upcomingEvents = events.filter(event => !isEventPast(event.eventDate)).length;
  const totalRsvps = events.reduce((sum, event) => sum + event.rsvpCount, 0);
  const totalComments = events.reduce((sum, event) => sum + event.commentCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-12 h-12 animate-spin mx-auto">
              <Image src="/2.png" alt="Loading..." width={48} height={48} className="h-12 w-12" />
            </div>
            <p className="mt-2 text-gray-600">Loading events...</p>
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
            Community Events
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join our community events and connect with fellow members. RSVP to events you're interested in
            and participate in discussions about upcoming activities.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{totalEvents}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{upcomingEvents}</div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{totalRsvps}</div>
              <div className="text-sm text-gray-600">Total RSVPs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{totalComments}</div>
              <div className="text-sm text-gray-600">Comments</div>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <p className="text-orange-800">
                <Link href="/signin" className="text-orange-600 hover:text-orange-700 font-medium">
                  Sign in
                </Link>
                {' '}to RSVP to events and join the discussion!
              </p>
            </div>
          )}
        </div>

        {/* Events */}
        <div className="space-y-8">
          {events.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No events scheduled</h3>
                <p className="text-gray-600">Check back soon for upcoming community events!</p>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <Card key={event.id} className={`border-l-4 hover:shadow-lg transition-shadow duration-200 ${
                isEventPast(event.eventDate)
                  ? 'border-l-gray-400 bg-gray-50'
                  : isEventToday(event.eventDate)
                  ? 'border-l-green-500'
                  : 'border-l-orange-500'
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-2xl font-bold text-gray-900">
                          {event.title}
                        </CardTitle>
                        {isEventPast(event.eventDate) && (
                          <Badge variant="secondary">Past Event</Badge>
                        )}
                        {isEventToday(event.eventDate) && (
                          <Badge className="bg-green-600 hover:bg-green-700">Today</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {event.organizer.name}
                        </div>
                        <div className="flex items-center">
                          <Hash className="h-4 w-4 mr-1" />
                          {event.organizer.membershipNumber}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(event.eventDate)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTime(event.eventDate)}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {event.location}
                        </div>
                        {event.maxAttendees && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {event.rsvpCount}/{event.maxAttendees} attending
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="prose max-w-none mb-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="bg-gray-50 border-t">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4">
                      {!isEventPast(event.eventDate) && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant={getRsvpButtonVariant('attending', userRsvps[event.id])}
                            size="sm"
                            onClick={() => handleRsvp(event.id, 'attending')}
                            className={`flex items-center space-x-1 ${
                              userRsvps[event.id] === 'attending'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : ''
                            }`}
                            disabled={!isAuthenticated}
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Going</span>
                          </Button>

                          <Button
                            variant={getRsvpButtonVariant('maybe', userRsvps[event.id])}
                            size="sm"
                            onClick={() => handleRsvp(event.id, 'maybe')}
                            className={`flex items-center space-x-1 ${
                              userRsvps[event.id] === 'maybe'
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : ''
                            }`}
                            disabled={!isAuthenticated}
                          >
                            <HelpCircle className="h-4 w-4" />
                            <span>Maybe</span>
                          </Button>

                          <Button
                            variant={getRsvpButtonVariant('not_attending', userRsvps[event.id])}
                            size="sm"
                            onClick={() => handleRsvp(event.id, 'not_attending')}
                            className={`flex items-center space-x-1 ${
                              userRsvps[event.id] === 'not_attending'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : ''
                            }`}
                            disabled={!isAuthenticated}
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Can't Go</span>
                          </Button>
                        </div>
                      )}

                      <Dialog open={commentDialogOpen === event.id} onOpenChange={(open) => setCommentDialogOpen(open ? event.id : null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCommentDialog(event.id)}
                            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>{event.commentCount}</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Comments on "{event.title}"</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4">
                            {isAuthenticated ? (
                              <div className="border-b pb-4">
                                <Textarea
                                  placeholder="Share your thoughts about this event..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="mb-3"
                                />
                                <Button
                                  onClick={() => handleCommentSubmit(event.id)}
                                  disabled={!newComment.trim() || submittingComment}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  {submittingComment ? 'Posting...' : 'Post Comment'}
                                </Button>
                              </div>
                            ) : (
                              <div className="border-b pb-4 text-center">
                                <p className="text-gray-600 mb-3">Sign in to join the discussion</p>
                                <Link href="/signin">
                                  <Button className="bg-orange-600 hover:bg-orange-700">
                                    Sign In
                                  </Button>
                                </Link>
                              </div>
                            )}

                            <div className="space-y-3">
                              {comments[event.id]?.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>
                              ) : (
                                comments[event.id]?.map((comment) => (
                                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium text-gray-900">{comment.author.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          #{comment.author.membershipNumber}
                                        </Badge>
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {formatDate(comment.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {event.rsvpCount} attending
                      </Badge>
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

export default EventsPage;