'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ShoppingCart, Wheat, Vote, ArrowRight, Heart, Factory } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Initiative {
  id: string;
  title: string;
  description: string;
  status: string;
  category: {
    name: string;
  };
  targetParticipants: number;
  currentParticipants: number;
  targetAmount: number;
  currentAmount: number;
}

interface InitiativesResponse {
  initiatives: Initiative[];
  total: number;
}

const InitiativesPage = () => {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitiatives = async () => {
      try {
        const response = await fetch('/api/initiatives');
        if (response.ok) {
          const data: InitiativesResponse = await response.json();
          // Sort initiatives: Active first, then other statuses
          const sortedInitiatives = data.initiatives.sort((a, b) => {
            const statusPriority = { 'active': 0, 'coming soon': 1, 'planning': 2, 'completed': 3, 'closed': 3 };
            const aPriority = statusPriority[a.status.toLowerCase() as keyof typeof statusPriority] ?? 4;
            const bPriority = statusPriority[b.status.toLowerCase() as keyof typeof statusPriority] ?? 4;
            return aPriority - bPriority;
          });
          setInitiatives(sortedInitiatives);
        }
      } catch (error) {
        console.error('Failed to fetch initiatives:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitiatives();
  }, []);
  // Helper functions to get icon and other styling based on category/title
  const getInitiativeIcon = (title: string, category: string) => {
    if (title.includes('Bank') || category === 'Banking') return Building2;
    if (title.includes('Spaza') || category === 'Informal Economy') return ShoppingCart;
    if (title.includes('Food') || category?.includes('Agriculture')) return Wheat;
    if (title.includes('Industrial') || category?.includes('Manufacturing') || category?.includes('Industry')) return Factory;
    if (title.includes('Political') || category?.includes('Politics')) return Vote;
    return Building2; // default
  };

  const getInitiativeColor = (title: string, category: string) => {
    if (title.includes('Food') || category?.includes('Agriculture')) return "bg-[#cdf556] text-black";
    if (title.includes('Bank') || title.includes('Political') || category === 'Banking' || category?.includes('Politics')) return "bg-orange-600";
    return "bg-black"; // default
  };

  const getInitiativeLink = (title: string) => {
    if (title.includes('Bank')) return '/initiatives/commercial-bank';
    if (title.includes('Spaza')) return '/initiatives/informal-economy';
    if (title.includes('Food')) return '/initiatives/food-value-chain';
    if (title.includes('Industrial')) return '/initiatives/industrial-development';
    if (title.includes('Political')) return '/initiatives/political-representation';
    return '/initiatives';
  };

  const getInitiativeDetails = (title: string) => {
    if (title.includes('Bank')) return [
      "Minimum pledge: R1,200",
      "Shareholder ownership for all depositors",
      "Start as online bank, expand to physical branches",
      "Focus on serving native community needs"
    ];
    if (title.includes('Spaza')) return [
      "Support for new the informal economy entrepreneurs",
      "Training and mentorship programs",
      "Access to bank financing",
      "Mobile payment integration"
    ];
    if (title.includes('Food')) return [
      "Sustainable farming practices",
      "Non-GMO food production",
      "Community-owned distribution",
      "Fair pricing for consumers"
    ];
    if (title.includes('Industrial')) return [
      "Strategic industry identification",
      "Technical skills development",
      "Manufacturing capacity building",
      "Education bursaries for priority skills"
    ];
    if (title.includes('Political')) return [
      "Policy proposal development",
      "Candidate vetting process",
      "Community consultation",
      "Electoral strategy planning"
    ];
    return ["Initiative details coming soon"];
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-[#cdf556] text-black";
      case "coming soon":
        return "bg-orange-600 text-white";
      case "planning":
        return "bg-black text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getProgressPercentage = (participants: number, target: number) => {
    return Math.min((participants / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 animate-spin mx-auto mb-4">
            <Image src="/2.png" alt="Loading..." width={48} height={48} className="h-12 w-12" />
          </div>
          <div className="text-2xl font-bold text-gray-900">Loading initiatives...</div>
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
            Our <span className="text-[#cdf556]">Initiatives</span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            Join collective actions that build our economic independence
          </p>
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#cdf556]">{initiatives.length}</div>
              <div className="text-gray-300">Total Initiatives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#cdf556]">
                {initiatives.reduce((total, init) => total + init.currentParticipants, 0)}
              </div>
              <div className="text-gray-300">Total Participants</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" className="border-black rounded-none text-black hover:bg-black hover:text-white">
              All Initiatives
            </Button>
            <Button variant="outline" className="border-black rounded-none text-black hover:bg-black hover:text-white">
              Banking
            </Button>
            <Button variant="outline" className="border-black rounded-none text-black hover:bg-black hover:text-white">
              Agriculture & Food
            </Button>
            <Button variant="outline" className="border-black rounded-none text-black hover:bg-black hover:text-white">
              Informal Economy
            </Button>
            <Button variant="outline" className="border-black rounded-none text-black hover:bg-black hover:text-white">
              Manufacturing & Industry
            </Button>
            <Button variant="outline" className="border-black rounded-none text-black hover:bg-black hover:text-white">
              Politics & Governance
            </Button>
          </div>
        </div>
      </section>

      {/* Initiatives Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {initiatives.map((initiative) => {
              const categoryName = initiative.category?.name || '';
              const IconComponent = getInitiativeIcon(initiative.title, categoryName);
              const progressPercentage = getProgressPercentage(initiative.currentParticipants, initiative.targetParticipants);
              const initiativeColor = getInitiativeColor(initiative.title, categoryName);
              const initiativeLink = getInitiativeLink(initiative.title);
              const initiativeDetails = getInitiativeDetails(initiative.title);

              return (
                <Card key={initiative.id} className="border rounded-none border-black hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${initiativeColor} flex items-center justify-center`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className={`px-3 py-1 text-xs font-bold ${getStatusColor(initiative.status)}`}>
                        {getStatusDisplay(initiative.status)}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-black mb-2">
                      {initiative.title}
                    </CardTitle>
                    <div className="text-sm text-gray-500 mb-4">
                      Category: {initiative.category?.name || 'General'}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {initiative.description}
                    </p>

                    {/* Progress Bar */}
                    {initiative.status.toLowerCase() === "active" && (
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>{initiative.currentParticipants.toLocaleString()} participants</span>
                          <span>Target: {initiative.targetParticipants.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2">
                          <div
                            className="bg-[#cdf556] h-2 transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {progressPercentage.toFixed(1)}% of target reached
                        </div>
                      </div>
                    )}

                    {/* Key Details */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-black mb-3">Key Details:</h4>
                      <ul className="space-y-2">
                        {initiativeDetails.map((detail, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="w-2 h-2 bg-orange-600 mt-2 mr-3 flex-shrink-0"></span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {initiative.status.toLowerCase() === "active" ? (
                        <Link href={initiativeLink} className="flex w-full justify-center items-center bg-orange-600 rounded-none hover:bg-orange-700 text-white px-4 py-2">
                          Join Initiative <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      ) : (
                        <Button variant="outline" className="flex-1 border-black rounded-none text-black hover:bg-black hover:text-white">
                          Get Notified <Heart className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                      <Link href={`/initiatives/learn-more?initiative=${initiative.title.includes('Bank') ? 'commercial-bank' : initiative.title.includes('Spaza') ? 'spaza-shop' : initiative.title.includes('Food') ? 'food-value-chain' : initiative.title.includes('Industrial') ? 'industrial-development' : 'political-representation'}`}>
                        <Button variant="outline" className="border-black rounded-none text-black hover:bg-black hover:text-white">
                          Learn More
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-[#cdf556] py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-6">
            Have an Initiative Idea?
          </h2>
          <p className="text-lg text-black mb-8">
            Help shape our collective future by proposing new initiatives that advance native economic empowerment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href='/propose-initiative'  className="bg-black rounded-none flex text-white hover:bg-gray-800 px-8 py-3">
              Propose Initiative <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href='/forum' className="border-black bg-white rounded-none text-black hover:bg-black hover:text-white px-8 py-3">
              Join Discussion
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InitiativesPage;
