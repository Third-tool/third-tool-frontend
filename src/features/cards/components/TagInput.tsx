import { KeywordInput } from './KeywordInput';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
}

export function TagInput({ value, onChange, label = '태그' }: Props) {
  return <KeywordInput value={value} onChange={onChange} label={label} placeholder="옵션 · Enter로 추가" />;
}
