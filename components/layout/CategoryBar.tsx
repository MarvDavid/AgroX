'use client';

import React from 'react';
import { CATEGORIES } from '@/lib/data';
import { ProductCategory } from '@/types';

interface CategoryBarProps {
  activeCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
}

export default function CategoryBar({
  activeCategory,
  onSelectCategory,
}: CategoryBarProps) {
  return (
    <nav className="agrox-category-strip">
      <div className="agrox-container">
        <ul className="agrox-category-list">
          {CATEGORIES.map((category) => (
            <li key={category} className="agrox-category-item">
              <button
                className={activeCategory === category ? 'active' : ''}
                onClick={() => onSelectCategory(category as ProductCategory)}
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
