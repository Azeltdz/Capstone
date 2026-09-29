import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInventoryByBranch, getAllInventory, getLowStockByBranch, getLowStockAllBranches,
  createInventoryEntry, updateInventoryEntry, adjustInventoryEntry, deleteInventoryEntry,
} from "../api/inventory";
import { getIngredients, createIngredient } from "../api/ingredients";

function withStatus(row) {
  return {
    ...row,
    status: Number(row.quantity_on_hand) <= Number(row.reorder_threshold) ? "Low" : "Good",
  };
}

export function useInventoryList(branchId) {
  const scope = branchId && branchId !== "all" ? branchId : "all";
  return useQuery({
    queryKey: ["inventory", scope],
    queryFn: () => (scope === "all" ? getAllInventory() : getInventoryByBranch(scope)),
    select: (rows) => rows.map(withStatus),
  });
}

export function useLowStock(branchId) {
  const scope = branchId && branchId !== "all" ? branchId : "all";
  return useQuery({
    queryKey: ["inventory", "low-stock", scope],
    queryFn: () => (scope === "all" ? getLowStockAllBranches() : getLowStockByBranch(scope)),
  });
}

function invalidateInventory(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["inventory"] });
}

export function useAddInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ branchId, name, unit, unitCost, onHand, reorder }) => {
      const ingredients = await getIngredients();
      const cleanName = name.trim();
      let ingredient = ingredients.find(
        (i) => i.ingredient_name.toLowerCase() === cleanName.toLowerCase()
      );

      if (!ingredient) {
        const res = await createIngredient({
          ingredient_name: cleanName,
          unit,
          unit_cost: unitCost,
        });
        ingredient = res.ingredient;
      }

      return createInventoryEntry(branchId, {
        ingredient_id: ingredient.ingredient_id,
        quantity_on_hand: onHand,
        reorder_threshold: reorder,
      });
    },
    onSuccess: () => {
      invalidateInventory(queryClient);
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity_on_hand, reorder_threshold }) =>
      updateInventoryEntry(id, { quantity_on_hand, reorder_threshold }),
    onSuccess: () => invalidateInventory(queryClient),
  });
}

export function useAdjustInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, delta }) => adjustInventoryEntry(id, delta),
    onSuccess: () => invalidateInventory(queryClient),
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteInventoryEntry(id),
    onSuccess: () => invalidateInventory(queryClient),
  });
}