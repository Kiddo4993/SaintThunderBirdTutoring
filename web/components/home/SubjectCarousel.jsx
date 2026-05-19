"use client";

import { useState, useEffect, useRef } from "react";
import {
  BookMarked,
  Calculator,
  FlaskConical,
  Globe,
  Monitor,
  Palette,
} from "lucide-react";

const subjects = [
  {
    Icon: BookMarked,
    title: "English & Literature",
    text: "Strengthen communication, essay writing, and analytical reading through Indigenous perspectives and contemporary voices.",
  },
  {
    Icon: Calculator,
    title: "Mathematics",
    text: "Master foundational to advanced math concepts with culturally relevant examples and step-by-step mentorship.",
  },
  {
    Icon: FlaskConical,
    title: "Science",
    text: "Explore biology, chemistry, and physics while connecting traditional Indigenous knowledge with modern discoveries.",
  },
  {
    Icon: Globe,
    title: "Social Studies",
    text: "Understand history, geography, and social justice through inclusive and Indigenous-centered perspectives.",
  },
  {
    Icon: Monitor,
    title: "Computer Science",
    text: "Build digital skills, learn to code, and explore technology as a tool for creativity, sovereignty, and community empowerment.",
  },
  {
    Icon: Palette,
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
    }, 200);
  };

  const advance = () => {
    if (hovered.current) return;
    goTo((active + 1) % subjects.length);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActive((prev) => {
        if (hovered.current) return prev;
        return (prev + 1) % subjects.length;
      });
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const { Icon, title, text } = subjects[active];
  const idx = String(active + 1).padStart(2, "0");
  const total = String(subjects.length).padStart(2, "0");

  return (
    <div
      className="subject-carousel"
      onMouseEnter={() => { hovered.current = true; }}
      onMouseLeave={() => { hovered.current = false; }}
    >
      <div className="subject-carousel-left">
        <span className="subject-counter">
          Subject {idx} of {total}
        </span>

        <div className="subject-ghost-num" aria-hidden="true">{idx}</div>

        <div className={`subject-content ${fading ? "fading" : ""}`}>
          <h2 className="subject-title">{title}</h2>
          <p className="subject-text">{text}</p>
        </div>

        <div className="subject-dots" role="tablist" aria-label="Subject navigation">
          {subjects.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`${subjects[i].title}`}
              className={`subject-dot${i === active ? " active" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>

      <div className="subject-carousel-right">
        <div className={`subject-icon-card${fading ? " fading" : ""}`} aria-hidden="true">
          <Icon size={72} strokeWidth={1} />
        </div>
      </div>
    </div>
  );
}
