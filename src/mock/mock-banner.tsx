export function MockBanner() {
  return (
    <>
      {/* Espaço para a faixa fixa não cobrir o fim da página. */}
      <div aria-hidden className="h-7" />
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-amber-400 px-4 py-1 text-center text-sm font-medium text-amber-950"
        role="status"
      >
        Modo release: dados fictícios
      </div>
    </>
  );
}
