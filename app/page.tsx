'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Building2, ShoppingCart, Wheat, Factory } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Stats {
  activeMembers: number;
  totalInitiatives: number;
  consensusRate: number;
  provincesRepresented: number;
}

const LandingPage = () => {
  const [stats, setStats] = useState<Stats>({
    activeMembers: 247,
    totalInitiatives: 5,
    consensusRate: 89,
    provincesRepresented: 9
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);
  const initiatives = [
    {
      icon: Building2,
      title: "Commercial Bank",
      description: "Establishing a native-owned financial institution to serve our community's banking needs and foster economic independence.",
      color: "bg-gray-800"
    },
    {
      icon: ShoppingCart,
      title: "Cooperative Business Networks",
      description: "Create interconnected worker-owned cooperatives across sectors—manufacturing, retail and distribution, services (cleaning, security, transport), and tech/digital services—including control of the informal economy (spaza shops, etc.). These businesses trade preferentially with each other, keeping wealth circulating internally.",
      color: "bg-gray-800"
    },
    {
      icon: Wheat,
      title: "Food Value Chain",
      description: "Controlling our food systems from production to distribution, ensuring food security and economic sustainability.",
      color: "bg-gray-800"
    },
    {
      icon: Factory,
      title: "Industrial Development",
      description: "We need to set up special funds and organizations that will help natives be at the very front of South Africa's push to refresh and grow its industries.",
      color: "bg-gray-800"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <section className="relative flex flex-col justify-center items-center h-screen bg-white text-black font-bold">
        <div className="w-300 flex items-center justify-center text-4xl mb-8">
            <Image src="/beware.jpg" alt="Beware of Natives" width={600} height={600}  />
        </div>
        <div className="text-center">
          <Button
            size="lg"
            className="bg-black text-white hover:bg-gray-800 px-8 py-3 rounded-none text-lg font-semibold"
            onClick={() => window.location.href = '/the-plan'}
          >
            View The Plan <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="bg-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#cdf556] mb-2">{stats.activeMembers.toLocaleString()}</div>
              <div className="text-white">Active members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#cdf556] mb-2">{stats.totalInitiatives}</div>
              <div className="text-white">Initiatives</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#cdf556] mb-2">{stats.consensusRate}%</div>
              <div className="text-white">Consensus rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#cdf556] mb-2">{stats.provincesRepresented}</div>
              <div className="text-white">Provinces represented</div>
            </div>
          </div>
        </div>
      </section>

      {/* Four Pillars Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Four Pillars of Change
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These are the foundation stones of our movement. Each pillar represents a critical area where native consensus and action can create lasting change.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {initiatives.map((initiative, index) => {
              const IconComponent = initiative.icon;
              return (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border border-black rounded-none">
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 bg-gradient-to-br ${initiative.color} rounded-none flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{initiative.title}</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">{initiative.description}</p>
                    <Link href="/initiatives">
                      <Button variant="outline" className="group-hover:bg-gray-900 group-hover:text-white transition-colors rounded-none duration-300">
                        Join discussion <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How consensus is built
            </h2>
            <p className="text-xl text-gray-600">
              A democratic process that amplifies every voice
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-black rounded-none flex items-center justify-center mx-auto mb-6">
                <div className="text-2xl font-bold text-white">1</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Propose & Discuss</h3>
              <p className="text-gray-600">Community members submit policy proposals and engage in structured discussions around each initiative.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-black rounded-none flex items-center justify-center mx-auto mb-6">
                <div className="text-2xl font-bold text-white">2</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Vote & Deliberate</h3>
              <p className="text-gray-600">Members vote on proposals while continuing dialogue to refine ideas and build broader support.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-black rounded-none flex items-center justify-center mx-auto mb-6">
                <div className="text-2xl font-bold text-white">3</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Implement & Act</h3>
              <p className="text-gray-600">Consensus-backed proposals are transformed into actionable plans with community support and resources.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#cdf556] py-20 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl text-black font-bold mb-6">
            Your voice matters in shaping our future
          </h2>
          <p className="text-xl text-black mb-8">
            Join thousands of natives building consensus around the policies that will define our economic independence and political representation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href='/signup' className="bg-white rounded-none text-orange-600 hover:bg-gray-100 px-8 py-3">
              Create account
            </Link>
            <Link href='/forum' className="border-white bg-orange-600 rounded-none text-black hover:bg-white hover:text-orange-600 px-8 py-3">
              Join discussion
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
     
    </div>
  );
};

export default LandingPage;