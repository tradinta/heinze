"use client";

import React, { useState } from "react";
import { subscribersList } from "@/data/mockData";
import { useToast } from "@/context/ToastContext";
import { 
  Users, Download, Plus, Mail, CheckCircle, Trash2, Send, Loader2 
} from "lucide-react";

interface SubscribersTabProps {
  searchQuery: string;
}

export default function SubscribersTab({ searchQuery }: SubscribersTabProps) {
  const toast = useToast();
  const [subscribers, setSubscribers] = useState(subscribersList);
  const [emailInput, setEmailInput] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleAddSubscriber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    if (subscribers.some(s => s.email === emailInput.trim())) {
      toast.warning("This email address is already subscribed.");
      return;
    }

    const newSub = {
      id: Math.random().toString(),
      email: emailInput.trim(),
      joinedDate: new Date().toISOString().split("T")[0]
    };

    setSubscribers([newSub, ...subscribers]);
    setEmailInput("");
    toast.success("Subscriber added manually to database.");
  };

  const handleDeleteSubscriber = async (id: string, email: string) => {
    const confirmed = await toast.confirm({
      title: "Remove Subscriber",
      message: `Unsubscribe "${email}"?`,
      confirmText: "Unsubscribe",
      cancelText: "Cancel",
      variant: "danger"
    });
    if (!confirmed) return;
    setSubscribers(subscribers.filter(s => s.id !== id));
    toast.success(`Removed ${email} from subscriber database.`);
  };

  const handleExportCSV = () => {
    toast.info("Compiling records into CSV format...");
    const headers = "id,email,joinedDate\n";
    const rows = subscribers.map(s => `${s.id},${s.email},${s.joinedDate}`).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `subscribers-${new Date().toISOString().split("T")[0]}.csv`);
    a.click();
    toast.success("CSV export downloaded successfully!");
  };

  const handleBroadcastNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeSubject.trim() || !composeBody.trim()) {
      toast.error("Subject and newsletter body cannot be empty.");
      return;
    }

    setSending(true);
    toast.info(`Broadcasting newsletter to ${subscribers.length} subscribers...`);

    setTimeout(() => {
      setSending(false);
      setComposeSubject("");
      setComposeBody("");
      toast.success("Editorial broadcast sent successfully!");
    }, 1500);
  };

  // Search filtering
  const filteredSubscribers = subscribers.filter((sub) =>
    sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.joinedDate.includes(searchQuery)
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-mono text-xs">
      {/* Left Columns: Subscribers Database List */}
      <div className="xl:col-span-2 border border-border bg-card-bg/40 p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-2">
          <h2 className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <Users className="h-4 w-4 text-emerald-500" />
            Subscriber Database ({subscribers.length})
          </h2>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 border border-border bg-background hover:text-foreground text-zinc-400 text-[10px] uppercase tracking-wider px-2.5 py-1 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        {/* Manual Addition Form */}
        <form onSubmit={handleAddSubscriber} className="flex gap-2 items-center">
          <input
            type="email"
            required
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Add email address..."
            className="flex-1 border border-border bg-background/50 px-2.5 py-1.5 text-foreground outline-hidden focus:border-primary"
          />
          <button
            type="submit"
            className="bg-primary text-white text-[10px] uppercase tracking-wider px-4 py-1.5 flex items-center gap-1 hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </form>

        {filteredSubscribers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-zinc-500 text-[10px] uppercase tracking-wider">
                  <th className="pb-2">Email Address</th>
                  <th className="pb-2">Joined Date</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-card-bg/25">
                    <td className="py-2.5 text-foreground">{sub.email}</td>
                    <td className="py-2.5 text-zinc-400">{sub.joinedDate}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                        className="p-1 hover:text-red-400 transition-colors"
                        title="Delete subscriber"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-zinc-500 py-12">
            No subscribers match the search criteria.
          </div>
        )}
      </div>

      {/* Right Column: Write Newsletter Broadcasting */}
      <div className="border border-border bg-card-bg/40 p-4 space-y-4 h-fit">
        <h3 className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-border pb-2">
          <Mail className="h-4 w-4 text-indigo-400" />
          Compose Broadcast
        </h3>

        <form onSubmit={handleBroadcastNewsletter} className="space-y-4">
          <div className="space-y-1">
            <label className="text-zinc-400 block font-bold">Email Subject</label>
            <input
              type="text"
              required
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              placeholder="E.g. Monthly Editorial: AI and the Self"
              className="w-full border border-border bg-background px-2.5 py-1.5 text-foreground outline-hidden focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 block font-bold">Newsletter Content</label>
            <textarea
              required
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              rows={6}
              placeholder="Write your editorial thoughts here..."
              className="w-full border border-border bg-background p-2.5 text-foreground outline-hidden focus:border-primary resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-primary text-white text-[10px] uppercase tracking-wider py-2 hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {sending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Transmitting signals...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Send to {subscribers.length} Subscribers</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
