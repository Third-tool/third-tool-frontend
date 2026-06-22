import { Dialog } from '@/components/Dialog';
import { Button } from '@/components/Button';
import { CreateCardForm } from './CreateCardForm';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateCardDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="새 카드 펴기">
      <CreateCardForm
        onSuccess={onClose}
        footerSlot={({ canSubmit, isPending, submit }) => (
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isPending}>
              취소
            </Button>
            <Button onClick={submit} disabled={!canSubmit || isPending}>
              카드 펴기
            </Button>
          </div>
        )}
      />
    </Dialog>
  );
}
