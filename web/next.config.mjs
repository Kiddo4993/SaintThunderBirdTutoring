import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */

const backend =
  process.env.BACKEND_ORIGIN || process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "";

function legacyRewrites() {
  if (!backend) return [];

  const html = [
    "about.html",
    "mentors.html",
    "students.html",
    "subject.html",
    "index.html",
    "tutor-dashboard.html",
    "student-profile.html",
    "admin-applications.html",
    "signup.html",
    "login.html",
    "loading.html",
    "student-dashboard.html",
    "volunteer-hours-guide.html",
    "tutor-pending.html",
    "terms.html",
  ];

  return [
    { source: "/api/:path*", destination: `${backend}/api/:path*` },
    { source: "/styles/:path*", destination: `${backend}/styles/:path*` },
    { source: "/scripts/:path*", destination: `${backend}/scripts/:path*` },
    ...html.map((name) => ({
      source: `/${name}`,
      destination: `${backend}/${name}`,
    })),
  ];
}

const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return legacyRewrites();
  },
};

export default nextConfig;
