import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAxisSelection,
  updateAxisSelection,
  deleteAxisSelection,
} from '@/lib/api/endpoints/axisSelection';
import type {
  CreateAxisSelectionRequest,
  UpdateAxisSelectionRequest,
} from '@/lib/api/schemas/axisSelection';
import { axisSelectionsKey } from './useAxisSelections';

// product-learning-tower Story 3-5 · 3-6. 컨테이너 create · update · delete (hard delete).

export function useCreateAxisSelection(axisId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAxisSelectionRequest) =>
      createAxisSelection(axisId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: axisSelectionsKey(axisId) });
    },
  });
}

export function useUpdateAxisSelection(axisId: string, selectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAxisSelectionRequest) =>
      updateAxisSelection(selectionId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: axisSelectionsKey(axisId) });
    },
  });
}

export function useDeleteAxisSelection(axisId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (selectionId: string) => deleteAxisSelection(selectionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: axisSelectionsKey(axisId) });
    },
  });
}
