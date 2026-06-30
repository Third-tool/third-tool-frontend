import { SplitAuthLayout } from './components/SplitAuthLayout';
import { LoginForm } from './components/LoginForm';

export function LoginPage() {
  return (
    <SplitAuthLayout
      eyebrow="Welcome back"
      title="다시 오셨네요"
      subtitle="오늘도 옆자리에서 카드를 펴고 있었어요."
      switchText="아직 계정이 없으신가요?"
      switchAction="회원가입"
      switchTo="/signup"
    >
      <LoginForm />
    </SplitAuthLayout>
  );
}
