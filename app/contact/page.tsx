'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <div className="w-10 h-10 bg-blue-600 rounded-none flex items-center justify-center mr-4">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contact Us</h1>
              <p className="text-gray-600">Get in touch with our team</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="rounded-none border-black max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Mail className="h-6 w-6" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div>
              <p className="text-gray-600 mb-4">
                For any questions, concerns, or feedback, please reach out to us:
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-none p-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Email Address</span>
                </div>
                <a
                  href="mailto:admin@nativesforum.org"
                  className="text-xl font-mono text-blue-600 hover:text-blue-800 hover:underline"
                >
                  admin@nativesforum.org
                </a>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>We typically respond within 24-48 hours during business days.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactPage;