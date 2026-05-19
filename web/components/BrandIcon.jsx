"use client";

const ICON_NAMES = {
  graduation: "graduation-cap",
  lightning: "lightning-bolt",
  star: "star",
  trophy: "trophy",
  community: "conference-call",
  handshake: "handshake",
  heart: "like",
  globe: "globe",
  eye: "visible",
  gem: "gem",
  target: "target",
  memo: "memo",
  check: "checkmark",
  clock: "clock",
  email: "email",
  chart: "bar-chart",
  book: "open-book",
  video: "video-call",
  question: "help",
  lock: "lock",
  logout: "logout",
  sun: "sun",
  moon: "moon",
  user: "user",
  send: "sent",
  award: "medal",
  briefcase: "briefcase",
  inbox: "inbox",
  document: "document",
  done: "done",
  calendar: "calendar",
  flask: "flask",
  sprout: "seedling",
  monitor: "monitor",
  palette: "paint-palette",
  calculator: "calculator",
  bookmark: "bookmark",
  menu: "menu",
};

export default function BrandIcon({ name, size = 20, className = "", style, color = "ffffff" }) {
  const iconName = ICON_NAMES[name];
  if (!iconName) return null;
  return (
    <img
      src={`https://img.icons8.com/ios-filled/96/${color}/${iconName}.png`}
      width={size}
      height={size}
      className={className}
      style={{ display: "inline-block", flexShrink: 0, ...style }}
      alt=""
      aria-hidden="true"
      draggable="false"
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}
