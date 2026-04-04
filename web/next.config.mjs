import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */

const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    // Redirect legacy .html URLs to Next.js routes
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/about.html", destination: "/about", permanent: true },
      { source: "/mentors.html", destination: "/mentors", permanent: true },
      { source: "/students.html", destination: "/students", permanent: true },
      { source: "/subject.html", destination: "/subjects", permanent: true },
      { source: "/login.html", destination: "/login", permanent: true },
      { source: "/signup.html", destination: "/signup", permanent: true },
      { source: "/loading.html", destination: "/loading", permanent: true },
      { source: "/tutor-dashboard.html", destination: "/tutor-dashboard", permanent: true },
      { source: "/student-dashboard.html", destination: "/student-dashboard", permanent: true },
      { source: "/student-profile.html", destination: "/student-profile", permanent: true },
      { source: "/admin-applications.html", destination: "/admin-applications", permanent: true },
      { source: "/volunteer-hours-guide.html", destination: "/volunteer-hours-guide", permanent: true },
      { source: "/tutor-pending.html", destination: "/tutor-pending", permanent: true },
      { source: "/terms.html", destination: "/terms", permanent: true },
    ];
  },
};

export default nextConfig;
