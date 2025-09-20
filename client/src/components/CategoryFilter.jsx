import React, { useState } from 'react';
import './CategoryFilter.css';

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange }) => {
  return (
    <div className="category-filter">
      <button
        onClick={() => onCategoryChange('')}
        className={`category-filter-btn ${
          selectedCategory === '' ? 'active' : 'inactive'
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`category-filter-btn ${
            selectedCategory === category ? 'active' : 'inactive'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;


