import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFoodCosting } from "../api/analytics";
import { getRecipe, saveRecipe } from "../api/menu";

export function useFoodCosting() {
  return useQuery({ queryKey: ["food-costing"], queryFn: getFoodCosting, staleTime: 30 * 1000 });
}

const toLines = (rows) =>
  rows.map((r) => ({
    ingredient_id: r.ingredient_id,
    ingredient_name: r.ingredient_name,
    unit: r.ingredient_unit,
    unit_cost: Number(r.unit_cost),
    quantity: Number(r.quantity_per_unit),
  }));

export function useRecipe(itemId) {
  return useQuery({
    queryKey: ["recipe", itemId],
    queryFn: () => getRecipe(itemId),
    select: toLines,
    enabled: !!itemId,
    gcTime: 0,
  });
}

export function useSaveRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, ...payload }) => saveRecipe(itemId, payload),
    onSuccess: (_data, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ["food-costing"] });
      queryClient.invalidateQueries({ queryKey: ["recipe", itemId] });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] }); // the POS shows the price
      queryClient.invalidateQueries({ queryKey: ["analytics"] });  // procurement reads recipes
    },
  });
}