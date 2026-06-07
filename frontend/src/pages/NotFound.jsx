import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
      <div className="label-mono">404</div>
      <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tighter mt-3">Page not found.</h1>
      <p className="text-muted-foreground mt-3 max-w-md text-center">
        That page seems to have wandered off. Let's get you back to the founder OS.
      </p>
      <Link to="/" className="mt-6 underline text-sm" data-testid="notfound-home-link">Back to home</Link>
    </div>
  );
}
