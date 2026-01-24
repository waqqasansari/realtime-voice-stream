"use client";

const technologies = [
    { name: "WebSocket", description: "Real-time bidirectional" },
    { name: "Opus Codec", description: "48kHz studio quality" },
    { name: "Edge Computing", description: "Distributed processing" },
    { name: "WebRTC", description: "Peer-to-peer capable" },
    { name: "FastAPI", description: "High-performance backend" },
    { name: "Next.js", description: "React framework" },
];

export default function TechStack() {
    return (
        <section className="w-full max-w-4xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
                <h3 className="text-sm font-bold text-muted-foreground tracking-widest uppercase mb-2">
                    Powered By
                </h3>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {technologies.map((tech, index) => (
                    <div
                        key={tech.name}
                        className="group flex flex-col items-center text-center p-4 rounded-2xl bg-card/50 border border-card-border/50 hover:border-primary/30 hover:bg-card transition-all duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                            {tech.name}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                            {tech.description}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}
