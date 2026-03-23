"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, UserPlus, Users } from "lucide-react";
import NavBar from "@/components/ui/NavBar";
import { getPlayers, addPlayer, removePlayer } from "@/lib/store";
import type { Player } from "@/types";
import { PLAYER_COLORS } from "@/types";

export default function PlayersManagePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      setPlayers(await getPlayers());
      setMounted(true);
    }
    load();
  }, []);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const player = await addPlayer(trimmed);
    setPlayers((prev) => [...prev, player]);
    setName("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  const handleDelete = async (id: string) => {
    if (confirmId === id) {
      await removePlayer(id);
      setPlayers((prev) => prev.filter((p) => p.id !== id));
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 3000);
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-[100dvh]">
        <main className="flex-1 overflow-y-auto px-4 pt-6 pb-24">
          <div className="max-w-lg mx-auto space-y-6">
            <div className="skeleton h-10 w-32" />
            <div className="skeleton h-14 w-full rounded-2xl" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
        <NavBar />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-lg mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gracze</h1>
              <p className="text-muted text-sm mt-0.5">
                {players.length === 0
                  ? "Dodaj graczy, aby rozpocz\u0105\u0107"
                  : `${players.length} ${players.length === 1 ? "gracz" : players.length < 5 ? "graczy" : "graczy"}`}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-neon-purple/10 flex items-center justify-center">
              <Users size={20} className="text-neon-purple" />
            </div>
          </div>

          {/* Add Player */}
          <div className="glass rounded-2xl p-4">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Imi\u0119 gracza..."
                maxLength={20}
                className="flex-1 bg-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted border border-border focus:border-neon-green/40 focus:outline-none focus:ring-1 focus:ring-neon-green/20 transition-colors"
              />
              <button
                onClick={handleAdd}
                disabled={!name.trim()}
                className="px-5 py-3 rounded-xl bg-neon-green/15 text-neon-green font-semibold text-sm border border-neon-green/20 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neon-green/25"
              >
                <span className="hidden sm:inline">Dodaj</span>
                <UserPlus size={18} className="sm:hidden" />
              </button>
            </div>
          </div>

          {/* Player List */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {players.map((player, index) => {
                const colorClass =
                  PLAYER_COLORS[index % PLAYER_COLORS.length];
                const initial = player.displayName.charAt(0).toUpperCase();
                const isConfirming = confirmId === player.id;

                return (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -60 }}
                    transition={{ duration: 0.25, ease: "easeOut" as const }}
                    className="glass rounded-2xl p-4 flex items-center gap-4"
                  >
                    {/* Avatar */}
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center shrink-0 shadow-lg`}
                    >
                      <span className="text-white font-bold text-base drop-shadow">
                        {initial}
                      </span>
                    </div>

                    {/* Name & stats */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {player.displayName}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {player.stats.matchesPlayed} mecz
                        {player.stats.matchesPlayed === 1
                          ? ""
                          : player.stats.matchesPlayed < 5
                            ? "e"
                            : "y"}{" "}
                        &middot; {player.stats.matchesWon} wygran
                        {player.stats.matchesWon === 1
                          ? "a"
                          : player.stats.matchesWon < 5
                            ? "e"
                            : "ych"}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(player.id)}
                      className={`p-2.5 rounded-xl transition-all active:scale-90 ${
                        isConfirming
                          ? "bg-neon-red/20 text-neon-red border border-neon-red/30"
                          : "bg-surface text-muted hover:text-neon-red hover:bg-neon-red/10 border border-transparent"
                      }`}
                      title={
                        isConfirming
                          ? "Kliknij ponownie, aby usun\u0105\u0107"
                          : "Usu\u0144 gracza"
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          {players.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-10 text-center"
            >
              <Users size={36} className="text-muted mx-auto mb-3" />
              <p className="text-muted text-sm">
                Brak graczy. Dodaj pierwszego gracza
                <br />
                u\u017cywaj\u0105c pola powy\u017cej.
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>
      <NavBar />
    </div>
  );
}
