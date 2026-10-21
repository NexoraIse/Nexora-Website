'use client';

import React from 'react';
import { Search, X, SlidersHorizontal, Tag } from 'lucide-react';
import { CATEGORIES } from '@/lib/events-data';
import { EventCategory } from '@/lib/types';

interface EventFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: EventCategory | 'All Events';
  onCategoryChange: (category: EventCategory | 'All Events') => void;
  totalFilteredCount: number;
  totalCount: number;
  onReset: () => void;
}

export default function EventFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  totalFilteredCount,
  totalCount,
  onReset,
}: EventFiltersProps) {
  const isFiltered = searchQuery.trim().length > 0 || selectedCategory !== 'All Events';

  return (
    <div className="w-full space-y-6">
      {/* Top Search & Results Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--theme-primary,#00f0ff)]">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            id="event-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events, workshops, hackathons..."
            className="w-full rounded-full border border-[var(--theme-primary,#00f0ff)]/30 bg-[#03080a] py-3 pl-11 pr-11 text-sm text-white placeholder-white/40 backdrop-blur-md transition-all duration-300 focus:border-[var(--theme-primary,#00f0ff)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary,#00f0ff)]/20 shadow-[0_0_15px_rgba(0, 240, 255,0.1)] font-cabinet"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search query"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--theme-primary,#00f0ff)] hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Counter & Clear Filter indicator */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
          <div className="flex items-center gap-2 text-[var(--theme-primary,#00f0ff)]/80 font-mono">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--theme-primary,#00f0ff)] animate-pulse" />
            <span>
              Showing <strong className="text-white">{totalFilteredCount}</strong> of {totalCount} events
            </span>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--theme-primary,#00f0ff)]/40 bg-[var(--theme-primary,#00f0ff)]/10 px-3 py-1 font-mono text-xs text-[var(--theme-primary,#00f0ff)] transition-colors hover:bg-[var(--theme-primary,#00f0ff)] hover:text-[var(--theme-bg-main,#060913)] cursor-pointer"
            >
              <X className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div className="mr-2 flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[var(--theme-primary,#00f0ff)]/70">
          <Tag className="h-3 w-3" />
          <span>Track:</span>
        </div>

        <button
          type="button"
          onClick={() => onCategoryChange('All Events')}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-clash font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            selectedCategory === 'All Events'
              ? 'bg-[var(--theme-primary,#00f0ff)] text-[var(--theme-bg-main,#060913)] shadow-[0_0_15px_rgba(0, 240, 255,0.4)]'
              : 'border border-[var(--theme-primary,#00f0ff)]/30 bg-[#03080a] text-white/80 hover:border-[var(--theme-primary,#00f0ff)] hover:text-white'
          }`}
        >
          All Events
        </button>

        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-clash font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-[var(--theme-primary,#00f0ff)] text-[var(--theme-bg-main,#060913)] shadow-[0_0_15px_rgba(0, 240, 255,0.4)]'
                  : 'border border-[var(--theme-primary,#00f0ff)]/30 bg-[#03080a] text-white/80 hover:border-[var(--theme-primary,#00f0ff)] hover:text-white'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
