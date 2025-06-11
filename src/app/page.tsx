'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/hooks/usePosts';
import { useSettings } from '@/hooks/useSettings';
import { areSettingsConfigured } from '@/utils/settingsUtils';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import LoginForm from '@/components/LoginForm';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { posts, loading: postsLoading, refetch, deletePost } = usePosts();
  const { settings } = useSettings();
  const [postingToX, setPostingToX] = useState<{[key: string]: boolean}>({});
  const [deletingPost, setDeletingPost] = useState<string | null>(null);

  const handlePostToX = async (postId: string, content: string) => {
    setPostingToX(prev => ({ ...prev, [postId]: true }));
    
    try {
      const postToX = httpsCallable(functions, 'postToX');
      await postToX({ postId, content });
      
      // Refresh posts to show updated status
      await refetch();
    } catch (error: any) {
      console.error('Error posting to X:', error);
      alert(`Failed to post to X: ${error.message}`);
    } finally {
      setPostingToX(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(postId);
      } catch (error: any) {
        console.error('Error deleting post:', error);
        alert(`Failed to delete post: ${error.message}`);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <>
      <Navigation />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Posts</h1>
        
        {!areSettingsConfigured(settings) && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  X API Credentials Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    To post to X (Twitter), you need to configure your API credentials.{' '}
                    <Link href="/settings" className="font-medium underline hover:text-yellow-600">
                      Go to Settings
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {postsLoading ? (
          <div className="text-center">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No posts yet!</p>
            <a 
              href="/add-post" 
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Create your first post
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {post.createdAt.toLocaleDateString()}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                </div>
                
                {post.scheduledFor && (
                  <div className="text-sm text-gray-600 mb-3">
                    Scheduled for: {post.scheduledFor.toLocaleString()}
                  </div>
                )}
                
                {/* Post actions */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {post.status === 'draft' && areSettingsConfigured(settings) && (
                      <button
                        onClick={() => handlePostToX(post.id, post.content)}
                        disabled={postingToX[post.id]}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {postingToX[post.id] ? 'Posting...' : 'Post to X'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
                    >
                      Delete
                    </button>
                    
                    {post.status === 'posted' && (
                      <span className="text-green-600 text-sm">✅ Posted to X</span>
                    )}
                    
                    {post.status === 'draft' && !areSettingsConfigured(settings) && (
                      <Link 
                        href="/settings" 
                        className="text-blue-600 hover:text-blue-700 text-sm underline"
                      >
                        Configure X API to post
                      </Link>
                    )}
                  </div>
                  
                  {(post as any).lastError && (
                    <div className="text-red-600 text-xs">
                      Error: {(post as any).lastError}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
