import React from 'react';
import PostCard from './PostCard';
import './PostList.css';

const PostList = ({ posts, featuredPost = null }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="post-list-empty">
        <div className="post-list-empty-title">No posts found</div>
        <p className="post-list-empty-subtitle">Check back later for new content!</p>
      </div>
    );
  }

  // Filter out the featured post from the regular posts to avoid duplication
  const regularPosts = featuredPost ? posts.filter(post => post.id !== featuredPost.id) : posts;

  return (
    <div className="post-list-grid">
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


