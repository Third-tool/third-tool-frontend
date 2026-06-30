import { SplitAuthLayout } from './components/SplitAuthLayout';
import { SignupForm } from './components/SignupForm';

export function SignupPage() {
  return (
    <SplitAuthLayout
      eyebrow="Create account"
      title="곁에 앉을 자리를 만들어요"
      subtitle="몇 가지만 적으면 첫 카드를 펼 수 있어요."
      switchText="이미 계정이 있으신가요?"
      switchAction="로그인"
      switchTo="/login"
    >
      <SignupForm />
    </SplitAuthLayout>
  );
}
