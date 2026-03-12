import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t bg-white py-8 px-8 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded bg-blue-600" />
          <span className="text-lg font-bold tracking-tight text-slate-900">
            LocalVoice AI
          </span>
        </div>
        
        <div className="flex gap-8 text-sm text-slate-500">
          <Link href="#" className="hover:text-blue-600">Terms</Link>
          <Link href="#" className="hover:text-blue-600">Privacy</Link>
          <Link href="#" className="hover:text-blue-600">Contact</Link>
        </div>
        
        <p className="text-sm text-slate-400">
          &copy; {new Date().getFullYear()} LocalVoice AI. Built for the future of Africa.
        </p>
      </div>
    </footer>
  );
}
