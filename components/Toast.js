export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 right-4 z-50 animate-bounce bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg">
      {message}
    </div>
  );
}
