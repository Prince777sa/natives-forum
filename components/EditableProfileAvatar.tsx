"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';
import { ProfileAvatar } from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Image from 'next/image';

interface EditableProfileAvatarProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profile_image_url?: string | null;
  };
  onImageUpdate: (newImageUrl: string) => void;
}

export function EditableProfileAvatar({ user, onImageUpdate }: EditableProfileAvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshUser } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image must be smaller than 10MB.');
      return;
    }

    setIsUploading(true);
    setShowUploadOptions(false);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Profile image updated successfully!');
        onImageUpdate(result.imageUrl);
        // Refresh user data in auth context
        await refreshUser();
      } else {
        toast.error(result.error || 'Failed to update profile image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCameraClick = () => {
    setShowUploadOptions(!showUploadOptions);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative inline-block">
      {/* Profile Avatar */}
      <div className="relative">
        <ProfileAvatar user={user} />
        
        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="w-12 h-12 animate-spin">
                <Image src="/2.png" width={48} height={48} alt="Loading..." className="h-12 w-12 text-white" />
            </div>
          </div>
        )}
        
        {/* Camera button */}
        <button
          onClick={handleCameraClick}
          disabled={isUploading}
          className="absolute bottom-0 right-0 w-8 h-8 bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center transition-colors duration-200 border-2 border-white disabled:opacity-50"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      {/* Upload options */}
      {showUploadOptions && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-black shadow-lg z-10 min-w-[200px]">
          <div className="p-2">
            <Button
              onClick={handleUploadClick}
              variant="outline"
              className="w-full justify-start border-black text-black hover:bg-black hover:text-white mb-2"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload new photo
            </Button>
            
            {user.profile_image_url && (
              <Button
                onClick={() => {
                  // TODO: Implement remove photo functionality
                  toast.info('Remove photo feature coming soon');
                  setShowUploadOptions(false);
                }}
                variant="outline"
                className="w-full justify-start border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                disabled={isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove photo
              </Button>
            )}
            
            <div className="border-t border-gray-200 mt-2 pt-2">
              <button
                onClick={() => setShowUploadOptions(false)}
                className="text-sm text-gray-500 hover:text-gray-700 w-full text-center py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}