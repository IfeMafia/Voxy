import Navbar from './Navbar';

export default function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Navbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
}
