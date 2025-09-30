// components/Navbar.tsx - Updated navbar with auth integration
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { NavbarAvatar } from './Avatar';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
              <Image
                src="/logo2.png"
                alt="Community Forum Logo"
                width={200}
                height={60}
                className="h-8 w-auto"
              />
            </Link>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 animate-spin">
                <Image src="/2.png" alt="Loading..." width={32} height={32} className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b-1 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image
                src="/logo.png"
                alt="Community Forum Logo"
                width={200}
                height={60}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden xl:block">
            <div className="ml-10 flex items-baseline space-x-6">
              <Link 
                href="/" 
                className="text-black hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Home
              </Link>
              <Link 
                href="/initiatives" 
                className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Initiatives
              </Link>
              <Link 
                href="/events" 
                className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Events
              </Link>
              <Link
                href="/forum"
                className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Forum
              </Link>
              <Link
                href="/groups"
                className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Groups
              </Link>
              <Link
                href="/polls"
                className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Polls
              </Link>
              <Link
                href="/about"
                className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                About
              </Link>
              {/* Admin Link - only show for admin users */}
              {isAuthenticated && user?.email === 'admin@nativesforum.org' && (
                <Link
                  href="/admin"
                  className="text-red-600 hover:text-red-700 px-3 py-2 text-sm font-medium transition-colors duration-200 border border-red-600 rounded-none"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden xl:flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <NavbarAvatar user={user!} />
                <Link 
                      href="/user"
                      className="block  py-2 text-sm text-black hover:text-orange-600 transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      {user?.firstName}
                    </Link>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="border-black text-black rounded-none hover:bg-black hover:text-white"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2 " />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white rounded-none">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-none">
                    Join Forum
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="xl:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-black p-2 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="xl:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-black">
              <Link
                href="/"
                className="block px-3 py-2 text-base font-medium text-black hover:text-orange-600 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/initiatives"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-orange-600 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Initiatives
              </Link>
              <Link
                href="/events"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-orange-600 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Events
              </Link>
              <Link
                href="/forum"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-orange-600 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Forum
              </Link>
              <Link
                href="/groups"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-orange-600 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Groups
              </Link>
              <Link
                href="/polls"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-orange-600 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Polls
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-orange-600 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>

              {/* Admin Link - only show for admin users */}
              {isAuthenticated && user?.email === 'admin@nativesforum.org' && (
                <Link
                  href="/admin"
                  className="block px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 border-l-4 border-red-600"
                  onClick={() => setIsOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}

              {/* Mobile Auth Section */}
              <div className="border-t border-gray-200 pt-3">
                {isAuthenticated ? (
                  <>
                    <Link 
                      href="/user"
                      className="block px-3 py-2 text-sm text-gray-700 hover:text-orange-600 transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      Welcome, {user?.firstName} #{user?.membershipNumber}
                    </Link>
                    <Button 
                      onClick={handleLogout}
                      className="w-full mx-3 mb-2 bg-black text-white hover:bg-gray-800"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="px-3 py-2 space-y-2">
                      <Link href="/signin">
                        <Button 
                          variant="outline" 
                          className="w-full border-black text-black hover:bg-black hover:text-white rounded-none"
                          onClick={() => setIsOpen(false)}
                        >
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/signup">
                        <Button 
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-none"
                          onClick={() => setIsOpen(false)}
                        >
                          Join Forum
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;