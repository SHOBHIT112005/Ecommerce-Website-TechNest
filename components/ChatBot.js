import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

export default function ChatBot({ currentProductId }) {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const isSignedIn = status === "authenticated";
  const [open, setOpen] = useState(Boolean(currentProductId));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Ask me about products, availability, or what pairs well with an item.",
    },
  ]);
  const seededProductRecommendation = useRef(false);

  async function sendMessage(message, silent = false) {
    const cleanMessage = String(message || "").trim();
    if (!cleanMessage || loading) return;

    if (!silent) {
      setMessages((prev) => [...prev, { role: "user", content: cleanMessage }]);
      setInput("");
    }

    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cleanMessage, currentProductId }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || "Chat request failed");

      setMessages((prev) => [...prev, { role: "assistant", content: body.answer }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I could not answer that right now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!currentProductId || seededProductRecommendation.current) return;
    seededProductRecommendation.current = true;
    sendMessage("Recommend products that pair well with this product.", true);
  }, [currentProductId]);

  if (!isSignedIn || isAdmin) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-100 max-w-sm">
      {open && (
        <div className="mb-3 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-emerald-500 text-white px-4 py-3 flex items-center justify-between">
            <div className="font-bold">Technest Assistant</div>
            <button onClick={() => setOpen(false)} className="text-white font-bold px-2" aria-label="Close chat">
              x
            </button>
          </div>
          <div className="h-72 overflow-y-auto p-3 space-y-3 text-sm">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-lg px-3 py-2 whitespace-pre-line ${
                  message.role === "user"
                    ? "bg-emerald-50 text-emerald-900 ml-8"
                    : "bg-gray-100 text-gray-700 mr-8"
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading && <div className="bg-gray-100 text-gray-500 rounded-lg px-3 py-2 mr-8">Thinking...</div>}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="border-t border-gray-200 p-3 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-gray-100 rounded-lg px-3 py-2 flex-grow focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Ask about products..."
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 text-white rounded-lg px-3 py-2 font-semibold hover:bg-emerald-600 disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="ml-auto block bg-emerald-500 text-white rounded-full px-5 py-3 font-bold shadow-xl hover:bg-emerald-600 transition-colors"
        >
          Chat
        </button>
      )}
    </div>
  );
}
