interface Props {
  title: string;
  note?: string;
}

export function PlaceholderPage({ title, note }: Props) {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-6 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-3xl text-cream">{title}</h1>
        <p className="text-cream-mute">{note ?? '준비 중인 공간이에요. 곧 만나요.'}</p>
      </div>
    </main>
  );
}
