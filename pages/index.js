import Head from "next/head";
import Product from "@/components/Product";
import Filters from "@/components/Filters";
import { initMongoose } from "@/lib/mongoose";
import { useState, useMemo } from "react";
import { findAllProducts } from "./api/products";
import Layout from "./Layout";

export default function Home({products}) {
  const [phrase, setPhrase] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('default');

  const categoriesNames = [...new Set(products.flatMap(p => p.categories))];
  const prices = products.map(p => p.price);
  const globalMin = prices.length ? Math.min(...prices) : 0;
  const globalMax = prices.length ? Math.max(...prices) : 0;

  const hasSearch = phrase.trim().length > 0;
  const hasFilters = selectedCategories.length > 0 || priceMin !== '' || priceMax !== '' || sortBy !== 'default';
  const showFilteredView = hasSearch || hasFilters;

  const filtered = useMemo(() => {
    let result = [...products];

    if (hasSearch) {
      const lower = phrase.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(lower) ||
        p.description?.toLowerCase().includes(lower)
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter(p =>
        p.categories.some(c => selectedCategories.includes(c))
      );
    }

    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    if (!isNaN(min)) result = result.filter(p => p.price >= min);
    if (!isNaN(max)) result = result.filter(p => p.price <= max);

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [products, phrase, selectedCategories, priceMin, priceMax, sortBy]);

  function clearFilters() {
    setSelectedCategories([]);
    setPriceMin('');
    setPriceMax('');
    setSortBy('default');
  }

  return (
    <Layout>
      <Head>
        <title>Technest - Home</title>
      </Head>
      <input
        value={phrase}
        onChange={e => setPhrase(e.target.value)}
        type="text"
        placeholder="Search for products..."
        className="bg-gray-100 py-2 px-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-emerald-300"
      />

      <div className="mt-4 mb-6">
        <Filters
          categories={categoriesNames}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          priceMin={priceMin}
          priceMax={priceMax}
          onPriceChange={(min, max) => { setPriceMin(min); setPriceMax(max); }}
          sortBy={sortBy}
          onSortChange={setSortBy}
          globalMin={globalMin}
          globalMax={globalMax}
          onClear={clearFilters}
          hasActiveFilters={hasFilters}
        />
      </div>

      {showFilteredView ? (
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-4">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(productInfo => (
                <Product key={productInfo._id} {...productInfo} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No products match your criteria.</p>
          )}
        </div>
      ) : (
        <>
          <div>
            {categoriesNames.map(categoryName => (
              <div key={categoryName}>
                {products.some(p => p.categories.includes(categoryName)) && (
                  <div>
                    <h2 className="text-2xl py-5 font-medium">{categoryName}</h2>
                    <div className="flex -mx-5 overflow-x-scroll snap-x scrollbar-hide">
                      {products.filter(p => p.categories.includes(categoryName))
                        .map(productInfo => (
                          <div key={productInfo._id} className="px-5 shrink-0 snap-start">
                            <Product {...productInfo} />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-medium mb-6">All Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(productInfo => (
                <Product key={productInfo._id} {...productInfo} />
              ))}
            </div>
          </div>
        </>
      )}

      </Layout>
  )
}

export async function getServerSideProps() 
{
  try {
    await initMongoose();
    const products = await findAllProducts();
    return {
      props: 
      {
        products: JSON.parse(JSON.stringify(products)),
      },
    };
  } catch (err) {
    console.error('Failed to load products:', err);
    return {
      props: { products: [] },
    };
  }  
}
