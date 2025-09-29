import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Heart, Shield, MessageSquare, Vote, Zap, Calendar } from 'lucide-react';
import Link from 'next/link';

const AboutPage = () => {
  const nativeGroups = [
    "Coloured", "Khoi", "Ndebele", "Pedi", "San", "Swati", 
    "Sotho", "Tsonga", "Tswana", "Venda", "Xhosa", "Zulu"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white text-black py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            About <span className="text-black">NativesForum</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            A platform dedicated to uniting South African natives around key socio-economic initiatives that hold the key to our advancement as a people.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <div className="prose prose-lg text-gray-600">
                <p className="mb-6">
                  The global economic order thrives on extracting wealth from the developing world, with Africa bearing the heaviest burden. South Africa's colonial and apartheid-era economic structures remain largely intact, designed to maintain the marginalization of indigenous South Africans. Despite promises of transformation, the ANC has failed to dismantle these systems, leaving the fundamental economic architecture unchanged. Native South Africans now face a web of oppression: government corruption, an economy still shaped by apartheid priorities, and international systems that continue to treat Africa as merely a source of raw materials.
                </p>
                <p className="mb-6">
                  These systemic failures demand that we forge our own path forward. This platform creates a space where we can unite around a shared vision through a deliberate process: first, exchanging ideas and perspectives; second, analyzing what must be done; third, determining concrete actions; and fourth, mobilizing to implement them. This structured approach ensures we move beyond frustration to strategic action, building clarity and consensus before we act, making our efforts focused and effective
                </p>
                <p className="font-semibold text-gray-900">
                  This platform aims to unite us around key actions that we need to take. It is impossible for us to survive if we continue thinking as individuals.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="text-center rounded-none border border-black p-6">
                <CardContent className="flex flex-col items-center">
                  <Users className="h-12 w-12 text-orange-600 mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">Unity</h3>
                  <p className="text-sm text-gray-600">Bringing natives together for collective action</p>
                </CardContent>
              </Card>
              <Card className="text-center border border-black rounded-none p-6">
                <CardContent className="flex flex-col items-center">
                  <Target className="h-12 w-12 text-orange-600 mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">Focus</h3>
                  <p className="text-sm text-gray-600">Targeted initiatives for economic independence</p>
                </CardContent>
              </Card>
              <Card className="text-center border border-black rounded-none p-6">
                <CardContent className="flex flex-col items-center">
                  <Heart className="h-12 w-12 text-orange-600 mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">Community</h3>
                  <p className="text-sm text-gray-600">Building stronger native communities</p>
                </CardContent>
              </Card>
              <Card className="text-center border border-black rounded-none p-6">
                <CardContent className="flex flex-col items-center">
                  <Shield className="h-12 w-12 text-orange-600 mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">Protection</h3>
                  <p className="text-sm text-gray-600">Safeguarding native interests</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How We Work Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">From Conversation to Action</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We believe in democracy through dialogue, but our ultimate goal is action. Every conversation should lead to concrete steps that improve our communities. Here&apos;s how we transform ideas into reality:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1: Forum Discussion */}
            <Card className="rounded-none border-black text-center relative">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-3">Forum Discussion</h3>
                <p className="text-sm text-gray-600">
                  Ideas start in our forum where community members engage in open dialogue, share perspectives, and build understanding around important issues.
                </p>
              </CardContent>
            </Card>

            {/* Step 2: Community Poll */}
            <Card className="rounded-none border-black text-center relative">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Vote className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-3">Community Poll</h3>
                <p className="text-sm text-gray-600">
                  When discussions reach consensus, we move to democratic polling where every community member can vote to determine our collective direction.
                </p>
              </CardContent>
            </Card>

            {/* Step 3: Initiative or Event */}
            <Card className="rounded-none border-black text-center relative">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-3">Strategic Initiative</h3>
                <p className="text-sm text-gray-600">
                  Approved ideas become concrete initiatives—economic projects, policy advocacy, or community programs that address our collective needs.
                </p>
              </CardContent>
            </Card>

            {/* Step 4: Community Action */}
            <Card className="rounded-none border-black text-center relative">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">4</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-3">Community Events</h3>
                <p className="text-sm text-gray-600">
                  We organize events, workshops, and gatherings that bring our community together to implement solutions and build lasting connections.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <div className="bg-white border-1 border-black rounded-none p-8 max-w-4xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Our Action-Oriented Philosophy</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                We don&apos;t just talk—we act. Every forum discussion has the potential to become a poll, and every poll result can transform into a real-world initiative or community event. This is how we ensure that our conversations lead to meaningful change that advances our people&apos;s interests and builds the economic independence we deserve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Only Natives Section */}
      <section className="py-20 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why only natives?</h2>
          </div>
          
          <Card className="rounded-none border-0 bg-black">
            <CardContent className="p-8 lg:p-12">
              <div className="prose prose-lg text-white  max-w-none">
                <p className="mb-6 text-lg leading-relaxed">
                  In the history of this country, since colonialism, natives have never had a government that represents our interests. Colonialism and apartheid only cared about white people. The ANC government has only cared about the elite (white and native), leaving out millions of natives without a government that serves them.
                </p>
                
                <div className="bg-orange-50 border-l-4 border-orange-400 p-6 my-8">
                  <p className="text-gray-800 font-medium text-lg mb-0">
                    While this socio-economic movement is native-centric, we don&apos;t envisage a country where all other groups are oppressed or chased away. Our main focus is getting natives to create the life they deserve on their own terms.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Who is the Native Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Who is the native?</h2>
            <p className="text-lg text-gray-600">
              We recognize and celebrate the diversity of South African native peoples
            </p>
          </div>
          
          <Card className="border-0 shadow-none rounded-none">
            <CardContent className="p-8 lg:p-12">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {nativeGroups.map((group, index) => (
                  <div key={index} className="bg-black rounded-none p-4 text-center">
                    <span className="font-semibold text-white">{group}</span>
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <p className="text-gray-600 text-lg">
                  Of course there are sub-tribes under each of the aforementioned umbrella tribes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-orange-600 py-20 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Join the Movement
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Together, we can build the economic independence and political representation that our communities deserve. Your voice matters in shaping our collective future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-3  font-semibold transition-colors duration-200">
              Create Account
            </Link>
            <Link href="/the-plan" className="border-2 border-white text-white hover:bg-white hover:text-orange-600 px-8 py-3  font-semibold transition-colors duration-200">
              Learn About Our Pillars
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;