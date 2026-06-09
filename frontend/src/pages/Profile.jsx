import React from "react";
import { useAuth } from "@/lib/auth";

export default function Profile() {
  const { user } = useAuth() || {};

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center gap-6">
        <img src={user?.avatar} alt={user?.name} className="w-24 h-24 rounded-full object-cover border" />
        <div>
          <h1 className="font-display text-3xl font-bold">{user?.name}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-bold text-lg mb-4">Activity</h2>
        <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground">
          No activity yet.
        </div>
      </div>
    </div>
  );
}
