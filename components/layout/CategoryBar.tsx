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
    // The list is the scroll container and carries the container gutter itself.
    // Nesting it inside .agrox-container doubled the horizontal padding, so the
    // first chip sat a full gutter further in than the logo above it.
    <nav className="agrox-category-strip">
      <ul className="agrox-category-list agrox-scroller">
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
    </nav>
  );
}
