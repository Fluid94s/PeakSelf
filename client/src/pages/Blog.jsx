import React, { useState, useMemo } from 'react';
import { blogPosts, categories } from '../data/blogPosts';
import PostList from '../components/PostList';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filteredPosts = useMemo(() => {
    let filtered = blogPosts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    return filtered;
  }, [searchTerm, selectedCategory]);

  const featuredPost = filteredPosts.find(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our collection of articles covering technology, personal growth, 
            productivity, and lifestyle topics to help you reach your peak potential.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="mb-6">
            <SearchBar 
              onSearch={setSearchTerm}
              placeholder="Search articles, tags, or topics..."
            />
          </div>
          
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredPosts.length === 0 
              ? 'No articles found' 
              : `Showing ${filteredPosts.length} article${filteredPosts.length !== 1 ? 's' : ''}`
            }
            {searchTerm && ` for "${searchTerm}"`}
            {selectedCategory && ` in ${selectedCategory}`}
          </p>
        </div>

        {/* Posts */}
        <PostList posts={regularPosts} featuredPost={featuredPost} />

        {/* No Results Message */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No articles found</div>
            <p className="text-gray-400 mb-6">
              Try adjusting your search terms or browse different categories
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;


