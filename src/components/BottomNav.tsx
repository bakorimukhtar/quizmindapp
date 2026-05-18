// src/components/BottomNav.tsx
"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, BookOpen, PlusCircle, User } from "lucide-react";

type Tab = "home" | "decks" | "create" | "profile";

interface BottomNavProps {
  activeTab: Tab;
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const router = useRouter();

  const navigateTo = (tab: Tab) => {
    if (tab === "home") router.push("/dashboard");
    else if (tab === "decks") router.push("/decks");
    else if (tab === "create") router.push("/create");
    else if (tab === "profile") router.push("/profile");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex justify-around items-center py-3">
          {[
            { id: "home", label: "Home", icon: Home },
            { id: "decks", label: "Decks", icon: BookOpen },
            { id: "create", label: "Create", icon: PlusCircle },
            { id: "profile", label: "Profile", icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => navigateTo(tab.id as Tab)}
                className="flex flex-col items-center py-2 px-5 relative active:scale-95 transition-transform"
              >
                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -4 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Icon size={26} className={isActive ? "text-blue-600" : "text-slate-400"} />
                </motion.div>
                <span className={`text-xs mt-1 font-medium ${isActive ? "text-blue-600" : "text-slate-500"}`}>
                  {tab.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="bottomNavDot"
                    className="absolute -top-1 w-1.5 h-1.5 bg-blue-600 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}