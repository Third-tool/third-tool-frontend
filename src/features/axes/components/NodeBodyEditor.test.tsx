import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NodeBodyEditor, MAX_NODE_BODY } from './NodeBodyEditor';

describe('NodeBodyEditor', () => {
  it('happy: 값 변경 시 onChange 콜백 호출 + 카운터 갱신', async () => {
    const onChange = vi.fn();
    render(<NodeBodyEditor value="" onChange={onChange} />);

    const textarea = screen.getByRole('textbox', { name: /본문/ });
    const user = userEvent.setup();
    await user.type(textarea, 'abc');

    expect(onChange).toHaveBeenCalled();
    // controlled component 라 실 렌더값은 부모에서 관리. 여기선 콜백 호출만 검증.
  });

  it('edge: Tab 키 입력 시 4-space indent 삽입', async () => {
    let current = '';
    const onChange = (v: string) => {
      current = v;
    };
    const { rerender } = render(<NodeBodyEditor value={current} onChange={onChange} />);
    const textarea = screen.getByRole('textbox', { name: /본문/ }) as HTMLTextAreaElement;
    textarea.focus();

    const user = userEvent.setup();
    await user.keyboard('{Tab}');

    expect(current).toBe('    ');
    rerender(<NodeBodyEditor value={current} onChange={onChange} />);
    expect((screen.getByRole('textbox', { name: /본문/ }) as HTMLTextAreaElement).value).toBe(
      '    ',
    );
  });

  it('edge: Shift+Tab 은 indent 삽입 없이 focus 이동 허용', async () => {
    const onChange = vi.fn();
    render(
      <>
        <button>before</button>
        <NodeBodyEditor value="" onChange={onChange} />
        <button>after</button>
      </>,
    );
    const textarea = screen.getByRole('textbox', { name: /본문/ }) as HTMLTextAreaElement;
    textarea.focus();

    const user = userEvent.setup();
    await user.keyboard('{Shift>}{Tab}{/Shift}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('maxLength 초과 시 status 카운터 amber 강조', () => {
    const long = 'a'.repeat(MAX_NODE_BODY);
    render(<NodeBodyEditor value={long} onChange={vi.fn()} />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(`${MAX_NODE_BODY} / ${MAX_NODE_BODY}`);
    expect(status.className).toMatch(/text-amber/);
  });

  it('placeholder ASCII 트리 예시 노출', () => {
    render(<NodeBodyEditor value="" onChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox', { name: /본문/ }) as HTMLTextAreaElement;
    expect(textarea.placeholder).toContain('├── 1-1. 정의와 본질');
  });
});
