import { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { db } from "../firebase";
import { ref, get } from "firebase/database";

export default function CopilotPortal() {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! I am your Emergency AI Copilot. I have live access to Complaints, Hospitals, Ambulances, and IoT Alerts. How can I assist you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // 1. Fetch live operational data from Firebase
      const snapshot = await get(ref(db, '/'));
      const rawData = snapshot.val() || {};
      
      // 2. Build a clean AI context object (exclude passwords/emails/irrelevant data)
      const users = rawData.users || {};
      const officers = Object.values(users).filter(u => u.role === "officer").map(o => ({
        name: o.name || "Unknown",
        status: o.status || "Unknown",
        workload: o.workload || 0
      }));

      const contextData = {
        reports: rawData.reports || {},
        complaints: rawData.complaints || {},
        officers: officers,
        hospitals: rawData.hospitals || {},
        ambulances: rawData.ambulances || {},
        notifications: rawData.notifications || {},
        analytics: rawData.analytics || {}
      };

      const res = await fetch(`${import.meta.env.VITE_AI_URL}/copilot/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg.text, context: contextData }),
      });
      const data = await res.json();
      
      setMessages((prev) => [...prev, { sender: "ai", text: data.response }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: "ai", text: "Error connecting to AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">CrisisIQ Copilot</h1>
        <p className="text-gray-600 mb-6">AI-Powered Government Crisis Management Platform</p>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-5 rounded-2xl ${msg.sender === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-md"}`}>
                  {msg.sender === "user" ? (
                    msg.text
                  ) : (
                    (() => {
                      try {
                        const safeText = typeof msg?.text === "string" ? msg.text : String(msg?.text || "");
                        const formattedText = safeText
                          .replace(/\[High\]/gi, '<span class="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded shadow-sm border border-red-200">High</span>')
                          .replace(/\[Medium\]/gi, '<span class="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded shadow-sm border border-yellow-200">Medium</span>')
                          .replace(/\[Low\]/gi, '<span class="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded shadow-sm border border-green-200">Low</span>');

                        return (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="w-full text-sm text-left border-collapse rounded-lg overflow-hidden shadow-sm" {...props} /></div>,
                              th: ({node, ...props}) => <th className="bg-gray-100 border-b border-gray-200 p-3 font-bold text-gray-700" {...props} />,
                              td: ({node, ...props}) => <td className="border-b border-gray-100 p-3 text-gray-600 align-middle" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3 border-b pb-2" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-lg font-bold text-gray-800 mt-4 mb-2" {...props} />,
                              p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                              li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />
                            }}
                          >
                            {formattedText}
                          </ReactMarkdown>
                        );
                      } catch (err) {
                        return <span className="whitespace-pre-wrap">{msg?.text ?? ""}</span>;
                      }
                    })()
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-500 p-4 rounded-2xl rounded-bl-none shadow-sm italic">
                  Analyzing system data...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about urgent repairs, ambulance deployments, or hospital capacities..."
                className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
