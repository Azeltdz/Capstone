import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getMenuItems } from "../api/menu";
import { getCategoryMeta } from "../constants/categoryMeta";

export function useMenuItems() {
  return useQuery({
    queryKey: ["menu-items"],
    queryFn: getMenuItems,
    staleTime: 60 * 1000, // menu doesn't change every few seconds
  });
}

export function useMenuCategories() {
  const { data: items, isLoading, error } = useMenuItems();

  const categories = useMemo(() => {
    if (!items) return [];
    const counts = {};
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return Object.entries(counts).map(([name, itemCount]) => ({
      key: name,
      name,
      itemCount,
      ...getCategoryMeta(name),
    }));
  }, [items]);

  return { categories, isLoading, error };
}

export function useMenuItemsByCategory(categoryKey) {
  const { data: items, isLoading, error } = useMenuItems();
  const filtered = useMemo(
    () => (items ? items.filter((i) => i.category === categoryKey) : []),
    [items, categoryKey]
  );
  return { items: filtered, isLoading, error };
}