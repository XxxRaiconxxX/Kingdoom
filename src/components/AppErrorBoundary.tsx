import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Kingdoom UI crash:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 px-4 py-8 text-stone-200">
        <section className="w-full max-w-md rounded-[2rem] border border-amber-500/20 bg-stone-900/85 p-6 text-center shadow-2xl shadow-black/40">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-300">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
            Kingdoom
          </p>
          <h1 className="mt-2 text-2xl font-black text-stone-100">
            La interfaz se detuvo
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            Recarga la pagina para volver al reino sin perder tu perfil activo.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400"
          >
            Recargar
          </button>
        </section>
      </main>
    );
  }
}
