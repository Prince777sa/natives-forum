'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, ShoppingCart, Wheat, Vote, Factory, Lightbulb, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FormData {
  title: string;
  description: string;
  content: string;
  categoryId: string;
  targetParticipants: string;
  targetAmount: string;
  startDate: string;
  endDate: string;
}

const ProposeInitiativePage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    content: '',
    categoryId: '',
    targetParticipants: '',
    targetAmount: '',
    startDate: '',
    endDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    // Fetch categories
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.includes('Banking')) return Building2;
    if (categoryName.includes('Agriculture')) return Wheat;
    if (categoryName.includes('Informal')) return ShoppingCart;
    if (categoryName.includes('Politics')) return Vote;
    if (categoryName.includes('Industry')) return Factory;
    return Lightbulb;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/initiatives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          targetParticipants: parseInt(formData.targetParticipants) || 0,
          targetAmount: parseFloat(formData.targetAmount) || 0,
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({
          title: '',
          description: '',
          content: '',
          categoryId: '',
          targetParticipants: '',
          targetAmount: '',
          startDate: '',
          endDate: ''
        });
      } else {
        const error = await response.json();
        alert(`Failed to submit initiative: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting initiative:', error);
      alert('Failed to submit initiative. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 animate-spin mx-auto mb-4">
            <Image src="/2.png" alt="Loading..." width={48} height={48} className="h-12 w-12" />
          </div>
          <div className="text-2xl font-bold text-gray-900">Loading...</div>
        </div>
      </div>
    );
  }

  // Check authentication and role
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md mx-auto border-red-200">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>You must be signed in to propose initiatives.</p>
            <div className="space-y-2">
              <Link href="/signin">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" className="w-full border-black">
                  Sign Up
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has permission (admin or staff)
  if (user?.userRole !== 'admin' && user?.userRole !== 'staff') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md mx-auto border-red-200">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>Only admin and staff members can propose new initiatives.</p>
            <p className="text-sm text-gray-600">
              Current role: <span className="font-semibold">{user?.userRole}</span>
            </p>
            <Link href="/initiatives">
              <Button variant="outline" className="border-black">
                View Existing Initiatives
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md mx-auto border-green-200">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">Initiative Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>Your initiative proposal has been submitted successfully and is now under review.</p>
            <div className="space-y-2">
              <Link href="/initiatives">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  View All Initiatives
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setSubmitSuccess(false)}
                className="w-full border-black"
              >
                Propose Another Initiative
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-black text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <Link href="/initiatives" className="flex items-center text-gray-300 hover:text-white mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Initiatives
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Propose New <span className="text-[#cdf556]">Initiative</span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Shape our collective future by proposing initiatives that advance native economic empowerment
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-black rounded-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Initiative Details</CardTitle>
              <p className="text-gray-600">
                Provide comprehensive information about your proposed initiative.
                All fields marked with * are required.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Initiative Title *
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Community Solar Energy Program"
                    className="mt-1 rounded-none border-black"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Category *
                  </Label>
                  <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                    <SelectTrigger className="mt-1 rounded-none border-black">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => {
                        const IconComponent = getCategoryIcon(category.name);
                        return (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center">
                              <IconComponent className="h-4 w-4 mr-2" />
                              {category.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Short Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Provide a brief, compelling description of your initiative (2-3 sentences)"
                    className="mt-1 rounded-none border-black"
                    rows={3}
                    maxLength={500}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Content */}
                <div>
                  <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                    Detailed Proposal *
                  </Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Provide a comprehensive explanation of your initiative including goals, implementation strategy, expected outcomes, and community benefits..."
                    className="mt-1 rounded-none border-black"
                    rows={8}
                    required
                  />
                </div>

                {/* Targets Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="targetParticipants" className="text-sm font-medium text-gray-700">
                      Target Participants
                    </Label>
                    <Input
                      id="targetParticipants"
                      type="number"
                      value={formData.targetParticipants}
                      onChange={(e) => handleInputChange('targetParticipants', e.target.value)}
                      placeholder="e.g., 1000"
                      className="mt-1 rounded-none border-black"
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetAmount" className="text-sm font-medium text-gray-700">
                      Target Amount (ZAR)
                    </Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      value={formData.targetAmount}
                      onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                      placeholder="e.g., 500000"
                      className="mt-1 rounded-none border-black"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Dates Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                      Proposed Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="mt-1 rounded-none border-black"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                      Proposed End Date
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="mt-1 rounded-none border-black"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Link href="/initiatives">
                    <Button type="button" variant="outline" className="border-black rounded-none">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.title || !formData.description || !formData.content}
                    className="bg-orange-600 hover:bg-orange-700 rounded-none"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Initiative
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Guidelines Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-black rounded-none">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Initiative Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">What makes a good initiative?</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Advances native economic empowerment and community self-reliance</li>
                    <li>• Has clear, measurable goals and realistic timelines</li>
                    <li>• Benefits the broader native community, not just individuals</li>
                    <li>• Is financially sustainable and has a viable implementation plan</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Review Process</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• All proposals are reviewed by the admin team within 7 business days</li>
                    <li>• Community feedback may be requested before final approval</li>
                    <li>• Approved initiatives will be published and opened for participation</li>
                    <li>• You will be notified via email about the status of your proposal</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default ProposeInitiativePage;