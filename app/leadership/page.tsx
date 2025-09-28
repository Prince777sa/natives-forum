'use client';
import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Twitter, Instagram, Linkedin } from 'lucide-react';

const LeadershipPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <div className="w-10 h-10 bg-blue-600 rounded-none flex items-center justify-center mr-4">
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leadership</h1>
              <p className="text-gray-600">Meet the people leading our movement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Leadership Team</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Dedicated leaders committed to building consensus for native empowerment through
            democratic participation and community-driven policy development.
          </p>
        </div>

        {/* Founder Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Founder</h3>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>

          <div className="flex justify-center">
            <Card className="rounded-none border-black max-w-lg w-full">
              <CardContent className="p-8">
                <div className="text-center">
                  {/* Profile Photo */}
                  <div className="w-32 h-32 mx-auto mb-6 overflow-hidden rounded-full">
                    <Image
                      src="/founder.jpg"
                      alt="Zukisa Sogoni - Founder"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Name and Title */}
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Zukisa Sogoni</h4>
                  <p className="text-blue-600 font-medium mb-4">Founder & Leader</p>

                  {/* Location */}
                  <div className="flex items-center justify-center gap-2 mb-6 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>Cape Town, South Africa</span>
                  </div>

                  {/* Bio */}
                  <div className="text-gray-600 mb-6 text-left">
                    <p className="mb-4">
                      Zukisa Sogoni is the visionary founder of NativesForum, dedicated to creating
                      a platform for democratic participation and community-driven policy development
                      for native empowerment.
                    </p>
                    <p>
                      Based in Cape Town, Zukisa brings together communities to build consensus
                      on critical issues affecting native populations through innovative digital
                      engagement and grassroots organizing.
                    </p>
                  </div>

                  {/* Social Media Links */}
                  <div className="flex justify-center gap-3 flex-wrap">
                    <a
                      href="https://twitter.com/ZuksSogoni"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-none hover:bg-gray-50 transition-colors"
                    >
                      <Twitter className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-700">Twitter</span>
                    </a>
                    <a
                      href="https://instagram.com/tazuks_sa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-none hover:bg-gray-50 transition-colors"
                    >
                      <Instagram className="h-4 w-4 text-pink-500" />
                      <span className="text-sm text-gray-700">Instagram</span>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/zukisa-sogoni-56b44346/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-none hover:bg-gray-50 transition-colors"
                    >
                      <Linkedin className="h-4 w-4 text-blue-700" />
                      <span className="text-sm text-gray-700">LinkedIn</span>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Future Leadership Message */}
        <div className="text-center">
          <div className="bg-white border border-gray-200 rounded-none p-8 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Growing Our Team</h3>
            <p className="text-gray-600">
              We are continuously building our leadership team with individuals who share our
              commitment to native empowerment and democratic participation. If you're passionate
              about making a difference in your community, we'd love to hear from you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadershipPage;