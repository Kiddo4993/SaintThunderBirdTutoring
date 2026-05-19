"use client";

import { useState, useEffect, useRef } from "react";
import BrandIcon from "@/components/BrandIcon";

const subjects = [
  {
    iconName: "book",
    title: "English & Literature",
    text: "Strengthen communication, essay writing, and analytical reading through Indigenous perspectives and contemporary voices.",
  },
  {
    iconName: "calculator",
    title: "Mathematics",
    text: "Master foundational to advanced math concepts with culturally relevant examples and step-by-step mentorship.",
  },
  {
    iconName: "flask",
    title: "Science",
    text: "Explore biology, chemistry, and physics while connecting traditional Indigenous knowledge with modern discoveries.",
  },
  {
    iconName: "globe",
    title: "Social Studies",
    text: "Understand history, geography, and social justice through inclusive and Indigenous-centered perspectives.",
  },
  {
    iconName: "monitor",
    title: "Computer Science",
    text: "Build digital skills, learn to code, and explore technology as a tool for creativity, sovereignty, and community empowerment.",
  },
  {
    iconName: "palette",
    title: "Arts & Culture",
    text: "Express yourself through visual arts, music, and storytelling — celebrating Indigenous creativity and cultural identity.",
  },
];

export default function SubjectCarousel() {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);
  const hovered = useRef(false);
  const intervalRef = useRef(null);

  const goTo = (index) => {
    if (index === active) return;
    setFading(true);
    setTimeout(() => {
      setActive(index);
      setFading(false);
    }, 180);
  };

  const prev = () => goTo((active - 1 + subjects.length) % subjects.length);
  const next = () => goTo((active + 1) % subjects.length);

  const resetInterval = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!hovered.current) setActive((p) => (p + 1) % subjects.length);
    }, 5000);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!hovered.current) setActive((p) => (p + 1) % subjects.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const { iconName, title, text } = subjects[active];
  const idx = String(active + 1).padStart(2, "0");
  const total = String(subjects.length).padStart(2, "0");

  return (
    <div
      className="subject-carousel"
      onMouseEnter={() => { hovered.current = true; }}
      onMouseLeave={() => { hovered.current = false; }}
    >
      <div className="subject-carousel-left">
        <span className="subject-counter">Subject {idx} of {total}</span>

        <div className="subject-ghost-num" aria-hidden="true">{idx}</div>

        <div className={`subject-content ${fading ? "fading" : ""}`}>
          <h2 className="subject-title">{title}</h2>
          <p className="subject-text">{text}</p>
        </div>

        <div className="subject-controls">
          <div className="subject-dots" role="tablist" aria-label="Subject navigation">
            {subjects.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === active}
                aria-label={subjects[i].title}
                className={`subject-dot${i === active ? " active" : ""}`}
                onClick={() => { goTo(i); resetInterval(); }}
              />
            ))}
          </div>
          <div className="subject-arrows">
            <button
              type="button"
              className="subject-arrow"
              aria-label="Previous subject"
              onClick={() => { prev(); resetInterval(); }}
            >
              ←
            </button>
            <button
              type="button"
              className="subject-arrow"
              aria-label="Next subject"
              onClick={() => { next(); resetInterval(); }}
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="subject-carousel-right">
        <div className={`subject-icon-card${fading ? " fading" : ""}`} aria-hidden="true">
          <BrandIcon name={iconName} size={72} />
        </div>
      </div>
    </div>
  );
}
