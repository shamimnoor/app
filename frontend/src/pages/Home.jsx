
import React from "react";
import { Link } from "react-router-dom";
import { FOUNDER } from "@/lib/api";

export default function Home() {
  return (
    <div className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <img
            className="w-32 h-32 rounded-full mx-auto shadow-lg ring-4 ring-primary/20"
            src={FOUNDER.image}
            alt={FOUNDER.name}
          />
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            {FOUNDER.name}
          </h1>
          <div className="mt-4 max-w-2xl mx-auto">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-lg text-muted-foreground">
              {FOUNDER.positioning.map((pos, i) => (
                <React.Fragment key={pos}>
                  <span>{pos}</span>
                  {i < FOUNDER.positioning.length - 1 && (
                    <span className="opacity-50">•</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          <p className="mt-6 max-w-3xl mx-auto text-xl text-muted-foreground">
            I help businesses build websites, CRM systems, client portals, dashboards, automation systems, and modern business infrastructure.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link to="/hire" className="btn btn-primary btn-lg">
              Hire Shamim Noor
            </Link>
            <Link to="/projects" className="btn btn-secondary btn-lg">
              View Projects
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
