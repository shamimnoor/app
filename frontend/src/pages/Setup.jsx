
import React, { useState } from 'react';

export default function Setup() {
  const [projectName, setProjectName] = useState('');
  const [theme, setTheme] = useState('light');
  const [auth, setAuth] = useState('Supabase');
  const [db, setDb] = useState('Supabase');
  const [deploy, setDeploy] = useState('Vercel');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ projectName, theme, auth, db, deploy });
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Project Setup</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">Project Name</label>
          <input
            type="text"
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="theme" className="block text-sm font-medium text-gray-700">Theme</label>
          <select
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option>light</option>
            <option>dark</option>
          </select>
        </div>
        <div>
          <label htmlFor="auth" className="block text-sm font-medium text-gray-700">Authentication</label>
          <select
            id="auth"
            value={auth}
            onChange={(e) => setAuth(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option>Supabase</option>
            <option>Firebase</option>
            <option>Auth0</option>
          </select>
        </div>
        <div>
          <label htmlFor="db" className="block text-sm font-medium text-gray-700">Database</label>
          <select
            id="db"
            value={db}
            onChange={(e) => setDb(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option>Supabase</option>
            <option>Firebase</option>
            <option>MongoDB</option>
          </select>
        </div>
        <div>
          <label htmlFor="deploy" className="block text-sm font-medium text-gray-700">Deployment</label>
          <select
            id="deploy"
            value={deploy}
            onChange={(e) => setDeploy(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option>Vercel</option>
            <option>Netlify</option>
            <option>AWS</option>
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Save Configuration
        </button>
      </form>
    </div>
  );
}
