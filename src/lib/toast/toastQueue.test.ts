import { describe, it, expect, vi } from 'vitest';
import { createToastStore } from './toastQueue';

describe('createToastStore', () => {
  it('emits new toast to subscribers', () => {
    const store = createToastStore();
    const sub = vi.fn();
    store.subscribe(sub);
    store.push({ message: '안녕' });
    expect(sub).toHaveBeenCalled();
    expect(store.snapshot()).toHaveLength(1);
    expect(store.snapshot()[0]?.message).toBe('안녕');
  });

  it('dismiss removes the toast', () => {
    const store = createToastStore();
    const id = store.push({ message: 'x' });
    store.dismiss(id);
    expect(store.snapshot()).toHaveLength(0);
  });

  it('assigns unique ids', () => {
    const store = createToastStore();
    const a = store.push({ message: 'a' });
    const b = store.push({ message: 'b' });
    expect(a).not.toBe(b);
  });
});
