import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-12 border-t bg-gray-50 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-gray-900 font-bold">
          <span className="text-blue-600 text-xl">🎙️</span> LocalVoice AI
        </div>
        <div className="text-sm text-gray-500 text-center">
          © {new Date().getFullYear()} LocalVoice AI. Empowering small businesses across Africa.
        </div>
        <div className="flex gap-6 text-sm text-gray-500">
          <Link href="/settings" className="hover:text-blue-600 transition-colors">Settings</Link>
          <a href="#" className="hover:text-blue-600">Privacy Policy</a>
          <a href="#" className="hover:text-blue-600">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
