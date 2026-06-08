interface FiltersProps {
  categories: string[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  priceMin: string;
  priceMax: string;
  onPriceChange: (min: string, max: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  globalMin: number;
  globalMax: number;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export default function Filters({
  categories,
  selectedCategories,
  onCategoriesChange,
  priceMin,
  priceMax,
  onPriceChange,
  sortBy,
  onSortChange,
  globalMin,
  globalMax,
  onClear,
  hasActiveFilters,
}: FiltersProps) {
  function toggleCategory(cat: string) {
    if (selectedCategories.includes(cat)) {
      onCategoriesChange(selectedCategories.filter(c => c !== cat));
    } else {
      onCategoriesChange([...selectedCategories, cat]);
    }
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoriesChange([])}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedCategories.length === 0
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategories.includes(cat)
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Price:</label>
          <input
            type="number"
            placeholder={String(globalMin)}
            value={priceMin}
            onChange={e => onPriceChange(e.target.value, priceMax)}
            className="w-20 bg-gray-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            placeholder={String(globalMax)}
            value={priceMax}
            onChange={e => onPriceChange(priceMin, e.target.value)}
            className="w-20 bg-gray-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Sort:</label>
          <select
            value={sortBy}
            onChange={e => onSortChange(e.target.value)}
            className="bg-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            <option value="default">Default</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="name-asc">Name A–Z</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-red-500 hover:text-red-600 underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
