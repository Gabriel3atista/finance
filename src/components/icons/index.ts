// Accessibility
import Eye from "./accessibility/eye";
import EyeOff from "./accessibility/eye-off";
// Arrows
import ArrowDownRight from "./arrows/arrow-down-right";
import ArrowDownTrend from "./arrows/arrow-down-trend";
import ArrowRight from "./arrows/arrow-right";
import ArrowUpRight from "./arrows/arrow-up-right";
import ArrowUpTrend from "./arrows/arrow-up-trend";
import ChevronDown from "./arrows/chevron-down";
import ChevronRight from "./arrows/chevron-right";
import History from "./arrows/history";
// Brands
import Google from "./brands/google";
// Charts
import Forecast from "./charts/forecast";
// Finance
import Equals from "./finance/equals";
// Layout
import BrandMark from "./layout/brand-mark";
import Calendar from "./layout/calendar";
import Dashboard from "./layout/dashboard";
import Plus from "./layout/plus";
import Records from "./layout/records";
// Notifications
import Bell from "./notifications/bell";
// Actions
import Trash from "./actions/trash";
// Status
import Check from "./status/check";
import CheckCircle from "./status/check-circle";
import CheckRoundedFilled from "./status/check-rounded-filled";
import Clock from "./status/clock";
import ClockRoundedFilled from "./status/clock-rounded-filled";
import CloseRoundedFilled from "./status/close-rounded-filled";
import Loading from "./status/loading";

export const iconsMap = {
  ArrowDownRight,
  ArrowDownTrend,
  ArrowRight,
  ArrowUpRight,
  ArrowUpTrend,
  Bell,
  BrandMark,
  Calendar,
  Check,
  CheckCircle,
  CheckRoundedFilled,
  ChevronDown,
  ChevronRight,
  Clock,
  ClockRoundedFilled,
  CloseRoundedFilled,
  Dashboard,
  Equals,
  Eye,
  EyeOff,
  Forecast,
  Google,
  History,
  Loading,
  Plus,
  Records,
  Trash,
} as const;

export type Icons = keyof typeof iconsMap;
export type { IconSvgProps } from "./icon-types";
