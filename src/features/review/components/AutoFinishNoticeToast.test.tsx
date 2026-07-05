import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { AutoFinishNoticeToast } from './AutoFinishNoticeToast';
import { toastStore } from '@/lib/toast/toastQueue';

describe('<AutoFinishNoticeToast> (Story 2-2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('happy · show=true 시 toastStore push · "이전 세션이 정리되어" 문구', () => {
    const push = vi.spyOn(toastStore, 'push');
    render(<AutoFinishNoticeToast show />);
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0]![0]!.message).toMatch(/이전 세션/);
  });

  it('edge · show=false → push 미호출', () => {
    const push = vi.spyOn(toastStore, 'push');
    render(<AutoFinishNoticeToast show={false} />);
    expect(push).not.toHaveBeenCalled();
  });
});
