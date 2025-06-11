'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  Timestamp,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface Post {
  id: string;
  content: string;
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'posted';
  createdAt: Date;
  userId: string;
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPosts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const q = query(
        collection(db, 'posts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        scheduledFor: doc.data().scheduledFor?.toDate(),
      })) as Post[];
      
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPost = async (content: string, scheduledFor?: Date) => {
    if (!user) return;

    try {
      const postData = {
        content,
        status: scheduledFor ? 'scheduled' as const : 'draft' as const,
        createdAt: Timestamp.now(),
        userId: user.uid,
        ...(scheduledFor && { scheduledFor: Timestamp.fromDate(scheduledFor) }),
      };

      await addDoc(collection(db, 'posts'), postData);
      await fetchPosts(); // Refresh the posts list
    } catch (error) {
      console.error('Error adding post:', error);
      throw error;
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'posts', postId));
      await fetchPosts(); // Refresh the posts list
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
    } else {
      setPosts([]);
      setLoading(false);
    }
  }, [user]);

  return { posts, loading, addPost, deletePost, refetch: fetchPosts };
}; 