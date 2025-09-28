import React from 'react'
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  return (
    <div>
       <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
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
              <p className="text-gray-400 mb-4">
                Building consensus for native empowerment through democratic participation and community-driven policy development.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/initiatives" className="hover:text-white">Initiatives</a></li>
                <li><a href="/events" className="hover:text-white">Events</a></li>
                <li><a href="/polls" className="hover:text-white">Polls</a></li>
                <li><a href="/the-plan" className="hover:text-white">The Plan</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about#mission" className="hover:text-white">Our Mission</a></li>
                <li><a href="/leadership" className="hover:text-white">Leadership</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
                <li><a href="/about#privacy" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} NativesForum. All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Footer
