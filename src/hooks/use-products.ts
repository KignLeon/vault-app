import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type Product } from '@/lib/data';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('products').select('*').then(({ data, error }) => {
      if (data) {
        setProducts(data as any as Product[]); // Mapping to type Product simply since JSON structures match
      }
      setLoading(false);
    });
  }, []);

  return { products, loading };
}
