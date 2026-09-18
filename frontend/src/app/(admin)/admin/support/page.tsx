"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  HelpCircle, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Send,
  ArrowLeft,
  User,
  Filter,
  Check
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
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  user: {
    name: string | null;
    email: string;
    planTier: string;
  };
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Admin reply form
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    axios.get("/api/support?all=true")
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

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      const res = await axios.post(`/api/support/${selectedTicket.id}/reply`, {
        newStatus: status
      });
      if (res.data?.data) {
        setSelectedTicket(res.data.data);
        fetchTickets();
      }
    } catch (err: any) {
      alert("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === "ALL") return true;
    return t.status === statusFilter;
  });

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
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">URGENT</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">HIGH</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-400">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Developer Support Desk (§8.3.12)
          </h1>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-900 text-white rounded">
            ADMIN
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Review developer help tickets, debug calculation questions, and dispatch resolution updates directly to users.
        </p>
      </div>

      {selectedTicket ? (
        /* Conversation Thread View */
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
                  <span className="font-semibold text-slate-700">{selectedTicket.user.email}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 font-mono text-[10px]">{selectedTicket.user.planTier}</span>
                  <span>•</span>
                  <span>Category: {selectedTicket.category.replace(/_/g, " ")}</span>
                  <span>•</span>
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
              </div>
            </div>

            {/* Quick Status Toggles for Admin */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateStatus("IN_PROGRESS")}
                disabled={updatingStatus || selectedTicket.status === "IN_PROGRESS"}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
              >
                Mark In Progress
              </button>
              <button
                onClick={() => handleUpdateStatus("RESOLVED")}
                disabled={updatingStatus || selectedTicket.status === "RESOLVED"}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
              >
                Mark Resolved
              </button>
              <button
                onClick={() => handleUpdateStatus("CLOSED")}
                disabled={updatingStatus || selectedTicket.status === "CLOSED"}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Close
              </button>
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
                      ? "bg-slate-900 text-slate-100 ml-8 shadow-xs" 
                      : "bg-slate-50 border border-slate-200 mr-8 text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isAdmin ? "text-white flex items-center gap-1.5" : "text-slate-900"}`}>
                      {isAdmin ? "⚡ Support Engineer (Admin)" : `${selectedTicket.user.name || selectedTicket.user.email} (User)`}
                    </span>
                    <span className={`text-[10px] ${isAdmin ? "text-slate-400" : "text-slate-400"}`}>
                      {new Date(msg.createdAt).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed font-sans">
                    {msg.message}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Admin Reply Form */}
          <form onSubmit={handleSendReply} className="pt-2 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              placeholder="Type official support reply to the developer..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={sendingReply || !replyText.trim()}
              className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Reply as Admin</span>
            </button>
          </form>
        </div>
      ) : (
        /* Admin Ticket List Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Developer Tickets ({filteredTickets.length})
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open Only</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading tickets...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span>No tickets matching the selected status.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Updated</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTickets.map((t) => (
                    <tr 
                      key={t.id} 
                      onClick={() => setSelectedTicket(t)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.ticketNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div>{t.user.email}</div>
                        <span className="text-[10px] font-mono text-slate-400">{t.user.planTier}</span>
                      </td>
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
                        Resolve / Reply →
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
