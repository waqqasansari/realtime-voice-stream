"use client";

import { Github, Twitter, Linkedin, BookOpen, FileCode } from "lucide-react";

const links = [
  { icon: BookOpen, label: "Documentation", href: "#" },
  { icon: FileCode, label: "API Reference", href: "#" },
  { icon: Github, label: "GitHub", href: "#" },
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
];

export default function SiteFooter() {
  return (
    <footer className="relative w-full py-12 mt-20 border-t border-card-border/30">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo/Brand */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-sm">VS</span>
              </div>
              <span className="font-bold text-lg text-foreground">VoiceStream</span>
            </div>
            <p className="text-xs text-muted-foreground/60">
              Real-time voice streaming infrastructure
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300 group"
                title={link.label}
              >
                <link.icon className="w-4 h-4 group-hover:text-primary transition-colors duration-300" />
                <span className="text-xs font-medium hidden lg:inline">{link.label}</span>
              </a>
            ))}
          </div>

          {/* Copyright */}
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-xs text-muted-foreground/60">
              © 2025 VoiceStream. All rights reserved.
            </p>
            <span className="text-[10px] text-muted-foreground/40 font-mono">
              v1.0.0 • Experiment
            </span>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="flex justify-center mt-10">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-primary/40" />
            <div className="w-2 h-2 rounded-full bg-accent/50" />
            <div className="w-1 h-1 rounded-full bg-pink-500/40" />
          </div>
        </div>
      </div>
    </footer>
  );
}
