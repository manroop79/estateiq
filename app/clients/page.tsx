"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Plus, Search, Users, Building, User, Phone, Mail, MapPin, X, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  client_type?: string; // Optional - column doesn't exist in database
  status: string;
  created_at: string;
  documents?: { count: number }[];
  compliance_cases?: { count: number }[];
}

export default function ClientsPage(){
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
      fetchClients();
    }, [statusFilter]);

    const fetchClients = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);

      const { data } = await supabaseClient
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setClients(data);
      }
      setLoading(false);
    };

    const filteredClients = clients.filter((client) => {
      // Apply status filter
      if (statusFilter !== "all" && client.status !== statusFilter) {
        return false;
      }
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          client.name.toLowerCase().includes(searchLower) ||
          client.email?.toLowerCase().includes(searchLower) ||
          client.company?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });

    const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);

      const formData = new FormData(e.currentTarget);
      
      // Helper function to get value or null if empty
      const getValue = (key: string): string | null => {
        const value = formData.get(key) as string;
        return value && value.trim() !== "" ? value.trim() : null;
      };

      const name = getValue("name");
      
      // Validate name is present
      if (!name) {
        setError("Client name is required");
        setSubmitting(false);
        return;
      }

      const clientData = {
        name,
        email: getValue("email"),
        phone: getValue("phone"),
        company: getValue("company"),
        address: getValue("address"),
        city: getValue("city"),
        state: getValue("state"),
        pincode: getValue("pincode"),
        // Note: client_type column doesn't exist in database, so we're not sending it
        notes: getValue("notes"),
      };

      try {
        const response = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clientData),
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to create client");
        }

        // Refresh the client list
        await fetchClients();
        setShowAddModal(false);
        setError(null);
        
        // Show success toast
        toast({
          title: "Client created successfully",
          description: `${clientData.name} has been added to your client list.`,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create client";
        setError(errorMessage);
        
        // Show error toast
        toast({
          title: "Failed to create client",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    };

    return (
        <div className="relative min-h-screen">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pt-16 sm:pt-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Clients</h1>
                <p className="text-sm sm:text-base text-gray-400">Manage your client portfolio and track their documents</p>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-black text-white hover:bg-[var(--primary)] hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/10 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="sm:inline">Add Client</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <StatsCard
                icon={<Users className="w-6 h-6" />}
                label="Total Clients"
                value={clients.length}
                color="blue"
              />
              <StatsCard
                icon={<Building className="w-6 h-6" />}
                label="Companies"
                value={clients.filter((c) => (c.client_type || "").toLowerCase() === "company" || c.company).length}
                color="purple"
              />
              <StatsCard
                icon={<User className="w-6 h-6" />}
                label="Individuals"
                value={clients.filter((c) => (c.client_type || "").toLowerCase() === "individual" && !c.company).length}
                color="green"
              />
              <StatsCard
                icon={<Users className="w-6 h-6" />}
                label="Active"
                value={clients.filter((c) => c.status === "active").length}
                color="cyan"
              />
            </div>

            {/* Filters & Search */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 z-10" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 transition-all"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 pr-8 sm:pr-10 text-sm sm:text-base bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 transition-all appearance-none cursor-pointer [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="all" className="bg-slate-800 text-white">All Status</option>
                    <option value="active" className="bg-slate-800 text-white">Active</option>
                    <option value="inactive" className="bg-slate-800 text-white">Inactive</option>
                    <option value="archived" className="bg-slate-800 text-white">Archived</option>
                  </select>
                  <ChevronDown className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Clients List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No clients found</h3>
                <p className="text-gray-400 mb-6">
                  {search ? "Try adjusting your search" : "Get started by adding your first client"}
                </p>
                {!search && (
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-black text-white hover:bg-[var(--primary)] hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/10"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredClients.map((client, index) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ClientCard client={client} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Add Client Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/20 shadow-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md md:max-w-2xl my-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Add New Client</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setError(null);
                    }}
                    className="text-[var(--primary)] hover:text-[var(--accent)] transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddClient} className="space-y-3 sm:space-y-4">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
                      {error}
                    </div>
                  )}

                  {/* Name - Required */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                      Client Name <span className="text-red-400">*</span>
                    </label>
                    <Input
                      name="name"
                      required
                      placeholder="Enter client name"
                      className="bg-slate-700/50 border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 transition-all text-sm sm:text-base h-9 sm:h-10"
                    />
                  </div>

                  {/* Client Type - Required */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                      Client Type <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="client_type"
                        required
                        defaultValue="individual"
                        className="w-full h-9 sm:h-10 rounded-md border border-white/10 bg-slate-700/50 px-3 py-1 pr-8 sm:pr-10 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 transition-all [&>option]:bg-slate-800 [&>option]:text-white appearance-none"
                      >
                        <option value="individual" className="bg-slate-800 text-white">Individual</option>
                        <option value="company" className="bg-slate-800 text-white">Company</option>
                        <option value="partnership" className="bg-slate-800 text-white">Partnership</option>
                      </select>
                      <ChevronDown className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Email - Required */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <Input
                      name="email"
                      type="email"
                      required
                      placeholder="client@example.com"
                      className="bg-slate-700/50 border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 transition-all text-sm sm:text-base h-9 sm:h-10"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                      Phone
                    </label>
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="bg-slate-700/50 border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 transition-all text-sm sm:text-base h-9 sm:h-10"
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                      Company Name
                    </label>
                    <Input
                      name="company"
                      placeholder="Company name (if applicable)"
                      className="bg-slate-700/50 border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 transition-all text-sm sm:text-base h-9 sm:h-10"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                      Address
                    </label>
                    <Input
                      name="address"
                      placeholder="Street address"
                      className="bg-slate-700/50 border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 transition-all text-sm sm:text-base h-9 sm:h-10"
                    />
                  </div>

                  {/* City, State, Pincode in a row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                        City
                      </label>
                      <Input
                        name="city"
                        placeholder="City"
                        className="bg-slate-700/50 border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 transition-all text-sm sm:text-base h-9 sm:h-10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                        State
                      </label>
                      <Input
                        name="state"
                        placeholder="State"
                        className="bg-slate-700/50 border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 transition-all text-sm sm:text-base h-9 sm:h-10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                        Pincode
                      </label>
                      <Input
                        name="pincode"
                        placeholder="ZIP/Postal"
                        className="bg-slate-700/50 border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 transition-all text-sm sm:text-base h-9 sm:h-10"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      placeholder="Additional notes about this client..."
                      rows={3}
                      className="w-full rounded-md border border-white/10 bg-slate-700/50 px-3 py-2 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 transition-all resize-none"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/10">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowAddModal(false);
                        setError(null);
                      }}
                      className="bg-gray-200 text-black hover:bg-[var(--primary)] hover:text-white transition-all duration-300 border border-white/10 w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-black text-white hover:bg-[var(--primary)] hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-black border border-white/10 w-full sm:w-auto"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Client
                        </>
                      )}
                    </Button>
              </div>
                </form>
              </motion.div>
            </div>
          )}
        </div>
    );
}

function StatsCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorClasses = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400",
    green: "from-green-500/10 to-green-600/5 border-green-500/20 text-green-400",
    cyan: "from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 text-cyan-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border rounded-lg sm:rounded-xl p-3 sm:p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="opacity-50 scale-75 sm:scale-100">{icon}</div>
      </div>
    </div>
  );
}

function ClientCard({ client }: { client: Client }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 p-4 sm:p-6 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            {(client.client_type === "company" || client.company) ? (
              <Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : (
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-white truncate">{client.name}</h3>
            {client.company && (
              <p className="text-xs sm:text-sm text-gray-400 truncate">{client.company}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {client.email && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Mail className="w-4 h-4" />
            {client.email}
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Phone className="w-4 h-4" />
            {client.phone}
          </div>
        )}
        {(client.city || client.state) && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="w-4 h-4" />
            {[client.city, client.state].filter(Boolean).join(", ")}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-white/10">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          client.status === "active"
            ? "bg-green-500/20 text-green-300"
            : "bg-gray-500/20 text-gray-300"
        }`}>
          {client.status}
        </span>
        {client.client_type && (
        <span className="text-xs text-gray-500">
          {client.client_type}
        </span>
        )}
            </div>
        </div>
    );
}