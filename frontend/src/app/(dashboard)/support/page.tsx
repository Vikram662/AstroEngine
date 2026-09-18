"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  HelpCircle, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Send,
  ArrowLeft,
  Filter
} from "lucide-react";

interface TicketMessage {
  id: string;
  senderRole: "USER" | "ADMIN";
  senderName?: string;
  message: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: "API_INTEGRATION" | "BILLING_PAYMENTS" | "ACCURACY_CALCULATION" | "FEATURE_REQUEST" | "OTHER";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export default function UserSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // New ticket form
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("API_INTEGRATION");
  const [priority, setPriority] = useState("MEDIUM");
  const [initialMessage, setInitialMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reply form
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    axios.get("/api/support")
      .then((res) => {
        if (res.data?.data) {
          setTickets(res.data.data);
          if (selectedTicket) {
            const found = res.data.data.find((t: SupportTicket) => t.id === selectedTicket.id);
            if (found) setSelectedTicket(found);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !initialMessage) return;
    setSubmitting(true);
    try {
      const res = await axios.post("/api/support", {
        subject,
        category,
        priority,
        message: initialMessage
      });
      if (res.data?.data) {
        setIsCreating(false);
        setSubject("");
        setInitialMessage("");
        fetchTickets();
        setSelectedTicket(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await axios.post(`/api/support/${selectedTicket.id}/reply`, {
        message: replyText
      });
      if (res.data?.data) {
        setReplyText("");
        setSelectedTicket(res.data.data);
        fetchTickets();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to send message");
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">OPEN</span>;
      case "IN_PROGRESS":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">IN PROGRESS</span>;
      case "RESOLVED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">RESOLVED</span>;
      case "CLOSED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">CLOSED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <span className="text-[10px] font-bold text-rose-600 uppercase">URGENT</span>;
      case "HIGH":
        return <span className="text-[10px] font-bold text-amber-600 uppercase">HIGH</span>;
      case "MEDIUM":
        return <span className="text-[10px] font-medium text-slate-500 uppercase">MEDIUM</span>;
      default:
        return <span className="text-[10px] font-medium text-slate-400 uppercase">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Developer Support & Tickets</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              SLA Active
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Need help with Kundli calculations, ephemeris accuracy, webhook signatures, or billing? Raise a ticket directly with our core engineering team.
          </p>
        </div>
        <button
          onClick={() => { setIsCreating(true); setSelectedTicket(null); }}
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Main Content: Split List / Detail view */}
      {isCreating ? (
        /* Create New Ticket Form */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Create New Support Request</h2>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Issue Summary</label>
              <input
                type="text"
                required
                placeholder="e.g. Discrepancy in Lahiri Ayanamsha degree or Webhook timeout"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-hidden"
                >
                  <option value="API_INTEGRATION">API Integration & SDK</option>
                  <option value="ACCURACY_CALCULATION">Astronomical / Ephemeris Calculation</option>
                  <option value="BILLING_PAYMENTS">Billing, Recharge & Invoices</option>
                  <option value="FEATURE_REQUEST">Feature Request</option>
                  <option value="OTHER">Other Query</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-hidden"
                >
                  <option value="LOW">Low (General guidance)</option>
                  <option value="MEDIUM">Medium (Standard query)</option>
                  <option value="HIGH">High (Production impact)</option>
                  <option value="URGENT">Urgent (System outage)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description & Steps to Reproduce</label>
              <textarea
                rows={5}
                required
                placeholder="Provide endpoint URL, payload snippet, headers, or expected vs received output..."
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Submit Ticket</span>
              </button>
            </div>
          </form>
        </div>
      ) : selectedTicket ? (
        /* Ticket Conversation View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">{selectedTicket.ticketNumber}</span>
                  <h2 className="text-base font-bold text-slate-900">{selectedTicket.subject}</h2>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span>Category: {selectedTicket.category.replace(/_/g, " ")}</span>
                  <span>•</span>
                  <span>Priority: {getPriorityBadge(selectedTicket.priority)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(selectedTicket.status)}
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {selectedTicket.messages.map((msg) => {
              const isAdmin = msg.senderRole === "ADMIN";
              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl text-xs space-y-1.5 ${
                    isAdmin 
                      ? "bg-blue-50/70 border border-blue-200 ml-6" 
                      : "bg-slate-50 border border-slate-200 mr-6"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isAdmin ? "text-blue-900" : "text-slate-900"}`}>
                      {isAdmin ? "⚡ Engineering Support Team" : msg.senderName || "You"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {msg.message}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Box */}
          {selectedTicket.status !== "CLOSED" ? (
            <form onSubmit={handleSendReply} className="pt-2 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Type your reply or follow-up question..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
              >
                {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send</span>
              </button>
            </form>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-xs text-center">
              This ticket is closed. If you still have questions, please create a new ticket.
            </div>
          )}
        </div>
      ) : (
        /* Ticket List Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Your Support History ({tickets.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching tickets...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span>No support tickets opened yet. Need assistance? Click &quot;New Support Ticket&quot; above.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Update</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tickets.map((t) => (
                    <tr 
                      key={t.id} 
                      onClick={() => setSelectedTicket(t)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.ticketNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {t.subject}
                        <div className="text-[11px] text-slate-400">
                          {t.messages.length} message{t.messages.length > 1 ? "s" : ""}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{t.category.replace(/_/g, " ")}</td>
                      <td className="py-3 px-4">{getPriorityBadge(t.priority)}</td>
                      <td className="py-3 px-4">{getStatusBadge(t.status)}</td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(t.updatedAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-600 hover:text-blue-800">
                        View Thread →
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
