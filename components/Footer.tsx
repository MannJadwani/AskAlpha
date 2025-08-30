import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-8 border-t border-white/10 text-white/60">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm">© {new Date().getFullYear()} Ask Alpha</p>
        <nav className="flex items-center gap-6 text-sm">
          <Link className="hover:text-white" href="/terms">Terms</Link>
          <Link className="hover:text-white" href="/privacy">Privacy</Link>
          <Link className="hover:text-white" href="/disclaimer">Disclaimer</Link>
        </nav>
      </div>
    </footer>
  );
}


