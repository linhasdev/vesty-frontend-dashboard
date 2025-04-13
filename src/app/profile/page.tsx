"use client";

import { useAuth } from '../../lib/hooks/useAuth';

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth();

  return (
    <div className="w-full py-6">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      
      {loading ? (
        <div className="animate-pulse bg-gray-100 rounded-lg p-8">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-8">
          {isAuthenticated ? (
            <>
              <div className="flex items-center mb-6">
                <div className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold">{user?.email || 'User'}</h2>
                  <p className="text-gray-500 text-sm">User ID: {user?.id || 'Not available'}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Account Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p>{user?.email || 'Not available'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Sign In</p>
                    <p>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Not available'}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-600">Please log in to view your profile information.</p>
          )}
        </div>
      )}
    </div>
  );
} 