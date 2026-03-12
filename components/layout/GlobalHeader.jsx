import Link from 'next/link';

export default function GlobalHeader() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      <Link href="/" className="text-xl font-bold flex items-center gap-2">
        <span className="text-blue-600">🎙️</span> LocalVoice AI
      </Link>
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
        <Link href="/assistant" className="hover:text-blue-600 transition-colors">Assistant</Link>
        <Link href="/conversations" className="hover:text-blue-600 transition-colors">Conversations</Link>
        <Link href="/business" className="hover:text-blue-600 transition-colors">Business</Link>
      </nav>
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Login</Link>
        <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-md">Get Started</Link>
      </div>
    </header>
  );
}
