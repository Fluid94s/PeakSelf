import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import './SearchBar.css';

const SearchBar = ({ onSearch, placeholder = "Search articles..." }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar-form">
      <div className="search-bar-container">
        <div className="search-bar-icon-container">
          <Search className="search-bar-icon" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar-input"
          placeholder={placeholder}
        />
        {searchTerm && (
          <div className="search-bar-clear-container">
            <button
              type="button"
              onClick={handleClear}
              className="search-bar-clear-btn"
            >
              <X className="search-bar-clear-icon" />
            </button>
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchBar;


