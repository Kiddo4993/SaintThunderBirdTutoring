"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TermsPage() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("st-theme");
    if (saved === "light") {
      setIsLight(true);
      document.body.classList.add("light-mode");
    }
  }, []);

  function toggleTheme() {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.body.classList.add("light-mode");
      localStorage.setItem("st-theme", "light");
    } else {
      document.body.classList.remove("light-mode");
      localStorage.setItem("st-theme", "dark");
    }
  }

  return (
    <>
      <button className="theme-toggle-btn" onClick={toggleTheme}>{isLight ? "☀️" : "🌓"}</button>
      <div className="terms-container">
        <h1>Terms &amp; Conditions</h1>
        <p>Welcome to <strong>Saint Thunderbird Tutoring</strong>. By creating an account as a student or tutor, you agree to the following terms and conditions designed to ensure a safe, respectful, and effective learning environment for everyone involved.</p>

        <h2>1. Purpose</h2>
        <p>Saint Thunderbird Tutoring is a non-profit educational platform dedicated to providing free, culturally grounded tutoring to First Nations students across Canada. We aim to promote educational equity and support students in achieving their academic and personal goals.</p>

        <h2>2. Account Responsibilities</h2>
        <ul>
          <li>All users must provide accurate, up-to-date information during registration.</li>
          <li>Students and tutors are responsible for maintaining the confidentiality of their login information.</li>
          <li>Accounts found to be fraudulent or misrepresentative may be suspended or removed.</li>
        </ul>

        <h2>3. Code of Conduct</h2>
        <ul>
          <li>Respect for all cultures, beliefs, and communities is mandatory.</li>
          <li>Discrimination, harassment, or inappropriate behavior of any kind will not be tolerated.</li>
          <li>Tutors must maintain professionalism and appropriate boundaries with students.</li>
          <li>Students must engage respectfully and be committed to their learning process.</li>
        </ul>

        <h2>4. Privacy &amp; Data Use</h2>
        <p>Your information is used solely to connect students and tutors within the Saint Thunderbird Tutoring program. We will never sell or distribute your personal data to third parties. By signing up, you consent to our use of anonymized data for program improvement and research purposes.</p>

        <h2>5. Tutor Expectations</h2>
        <ul>
          <li>Tutors are expected to dedicate the number of hours indicated in their application.</li>
          <li>All tutoring sessions should be conducted respectfully and with a focus on supporting student growth.</li>
          <li>Tutors agree to maintain confidentiality regarding all student information and progress.</li>
        </ul>

        <h2>6. Student Expectations</h2>
        <ul>
          <li>Students are expected to attend sessions punctually and notify tutors of cancellations in advance.</li>
          <li>Learning goals shared with tutors are used solely to personalize support and track growth.</li>
          <li>Students must treat tutors with the same respect and professionalism expected from tutors.</li>
        </ul>

        <h2>7. Program Integrity</h2>
        <p>Saint Thunderbird Tutoring reserves the right to modify, pause, or discontinue parts of the program to improve quality and accessibility. Any misuse of the platform may result in account termination.</p>

        <h2>8. Contact</h2>
        <p>For any questions regarding these terms, please contact us at: <a href="mailto:dylanduancanada@gmail.com">dylanduancanada@gmail.com</a></p>

        <Link href="/signup" className="back-link">← Back to Sign Up</Link>
      </div>
    </>
  );
}
