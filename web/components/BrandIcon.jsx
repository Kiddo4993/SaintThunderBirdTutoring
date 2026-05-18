import {
  GraduationCap, Zap, Star, Trophy, Users, Handshake, Heart, Globe,
  Eye, Gem, Target, FileText, CheckCircle, Clock, Mail, BarChart2,
  BookOpen, Video, HelpCircle, Lock, LogOut, Sun, Moon, User,
  Send, Award, Briefcase, Inbox, CheckSquare, Calendar,
} from "lucide-react";

const ICON_MAP = {
  graduation: GraduationCap,
  lightning: Zap,
  star: Star,
  trophy: Trophy,
  community: Users,
  handshake: Handshake,
  heart: Heart,
  globe: Globe,
  eye: Eye,
  gem: Gem,
  target: Target,
  memo: FileText,
  check: CheckCircle,
  clock: Clock,
  email: Mail,
  chart: BarChart2,
  book: BookOpen,
  video: Video,
  question: HelpCircle,
  lock: Lock,
  logout: LogOut,
  sun: Sun,
  moon: Moon,
  user: User,
  send: Send,
  award: Award,
  briefcase: Briefcase,
  inbox: Inbox,
  document: FileText,
  done: CheckSquare,
  calendar: Calendar,
};

export default function BrandIcon({ name, size = 20, className = "", strokeWidth = 1.5, style }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      aria-hidden="true"
    />
  );
}
