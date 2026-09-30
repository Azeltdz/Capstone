import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getIngredients, updateIngredient } from "../api/ingredients";

const withNumbers = (rows) => rows.map((r) => ({ ...r, unit_cost: Number(r.unit_cost) }));

export function useIngredients() {
  return useQuery({
    queryKey: ["ingredients"],
    queryFn: getIngredients,
    select: withNumbers,
    staleTime: 60 * 1000,
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => updateIngredient(id, payload),
    onSuccess: () => {
      for (const key of ["ingredients", "food-costing", "recipe", "inventory", "analytics"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}