import React from 'react';
import PostCard from './PostCard';

const PostList = ({ posts, featuredPost = null }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No posts found</div>
        <p className="text-gray-400 mt-2">Check back later for new content!</p>
      </div>
    );
  }

  // Filter out the featured post from the regular posts to avoid duplication
  const regularPosts = featuredPost ? posts.filter(post => post.id !== featuredPost.id) : posts;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {featuredPost && (
        <PostCard post={featuredPost} featured={true} />
      )}
      
      {regularPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PostList;


