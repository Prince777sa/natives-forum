import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ShoppingCart, Wheat, Factory, ArrowRight, CircleDollarSign } from 'lucide-react';
import Link from 'next/link';

const ThePlanPage = () => {
  const steps = [
    {
      number: "01",
      title: "Build Our Bank",
      description: "Raise funds to establish a commercial bank, starting online then expanding to physical branches. Every depositor becomes a shareholder in our collective financial future.",
      icon: Building2,
      color: "bg-orange-600"
    },
    {
      number: "02", 
      title: "Reclaim The Informal Economy",
      description: "Take back control of the informal economy. Our bank will finance these businesses and provide all banking services, keeping every transaction within our community.",
      icon: ShoppingCart,
      color: "bg-black"
    },
    {
      number: "03",
      title: "Control the Supply Chain", 
      description: "Invest in the entire value chain - from production and packaging to storage and distribution. Natives will own every step that brings goods to our shops.",
      icon: Factory,
      color: "bg-[#cdf556] text-black"
    },
    {
      number: "04",
      title: "Move All Banking to Us",
      description: "Transfer car loans, home loans, and personal banking to our bank. This strengthens our financial foundation and keeps our money circulating among us.",
      icon: CircleDollarSign,
      color: "bg-orange-600"
    },
    {
      number: "05",
      title: "Control Our Food System",
      description: "Invest in high-quality food production (non-GMO) from farm to supermarket. We'll control what we eat and ensure it meets our standards.",
      icon: Wheat,
      color: "bg-black"
    },
    {
      number: "06",
      title: "Build Our Industries",
      description: "Identify what we consume and build capacity to produce it ourselves. Provide strategic education and bursaries to develop the skills we need for native-led industrial growth.",
      icon: Factory,
      color: "bg-[#cdf556] text-black"
    }
  ];

  const pillars = [
    { name: "Commercial Bank", icon: Building2, description: "The foundation of our economic independence", color: "bg-orange-600" },
    { name: "Food Value Chain", icon: Wheat, description: "From farm to table, controlled by us", color: "bg-black" },
    { name: "Industrialization", icon: Factory, description: "Producing what we consume", color: "bg-[#cdf556] text-black" },
    { name: "Informal Economy", icon: ShoppingCart, description: "Reclaiming our local markets", color: "bg-orange-600" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            The <span className="text-[#cdf556]">Plan</span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            A clear roadmap to economic empowerment through collective action
          </p>
          <div className="bg-white text-black p-6 text-left max-w-2xl mx-auto border border-white">
            <p className="text-gray-800">
              Here&apos;s the simple truth: for us to be economically empowered, money needs to circulate amongst ourselves. Every rand we spend should stay within our community. This is the foundation of our movement.
            </p>
          </div>
        </div>
      </section>

      {/* Core Principle Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">The Core Principle</h2>
            <p className="text-lg text-gray-600">Money circulation is the key to our economic empowerment</p>
          </div>
          
          <Card className="shadow-lg rounded-none border border-black bg-[#cdf556]">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-black flex items-center justify-center">
                  <CircleDollarSign className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-center text-black mb-4">Every Rand Stays With Us</h3>
              <p className="text-black text-center text-lg leading-relaxed">
                When we spend money with each other instead of outsiders, we create a cycle of wealth that strengthens our entire community. This is the cornerstone of our native-centric socio-economic movement.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Four Pillars Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">Our Four Strategic Pillars</h2>
            <p className="text-lg text-gray-600">Carefully chosen to build a solid foundation for our economy</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, index) => {
              const IconComponent = pillar.icon;
              return (
                <Card key={index} className="rounded-none text-center hover:shadow-lg transition-shadow duration-300 border border-black">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${pillar.color} flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-black mb-2">{pillar.name}</h3>
                    <p className="text-sm text-gray-600">{pillar.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Commercial Bank Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="rounded-none border border-black">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-black">Why a Commercial Bank?</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-600 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-black mb-3">The Central Piece</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    A commercial bank is more powerful than a mutual bank, especially for providing credit. This gives us the financial tools we need to fund our other initiatives and truly transform our economy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* The Steps Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black mb-4">The Action Steps</h2>
            <p className="text-lg text-gray-600">Here&apos;s exactly how we make this happen</p>
          </div>
          
          <div className="space-y-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <Card key={index} className="rounded-none border border-black hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row items-start gap-6">
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="w-16 h-16 bg-black text-white flex items-center justify-center text-xl font-bold">
                          {step.number}
                        </div>
                        <div className={`w-12 h-12 ${step.color} flex items-center justify-center lg:hidden`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h3 className="text-2xl font-bold text-black">{step.title}</h3>
                          <div className={`w-12 h-12 ${step.color} flex items-center justify-center hidden lg:flex`}>
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <p className="text-gray-600 text-lg leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-orange-600 py-20 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Build Our Future?
          </h2>
          <p className="text-xl mb-8">
            This plan only works if we all participate. Join thousands of natives who are already building consensus around these critical steps to economic independence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-white flex rounded-none text-orange-600 hover:bg-gray-100 px-8 py-3">
              Join the Movement <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/initiatives" className="border-1 border-white rounded-none text-white hover:bg-white hover:text-orange-600 px-8 py-3">
              See Our Initiatives
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ThePlanPage;