// Accessibility
import EyeOffOutline from "./accessibility/eye-off-outline";
import EyeOutline from "./accessibility/eye-outline";
// Arrows
import ArrowDownRightOutline from "./arrows/arrow-down-right-outline";
import ArrowDownTrendOutline from "./arrows/arrow-down-trend-outline";
import ArrowRightOutline from "./arrows/arrow-right-outline";
import ArrowUpRightOutline from "./arrows/arrow-up-right-outline";
import ArrowUpTrendOutline from "./arrows/arrow-up-trend-outline";
import ChevronDownOutline from "./arrows/chevron-down-outline";
import ChevronRightOutline from "./arrows/chevron-right-outline";
import HistoryOutline from "./arrows/history-outline";
// Brands
import Google from "./brands/google";
// Finance
import EqualsOutline from "./finance/equals-outline";
// Layout
import BrandMarkOutline from "./layout/brand-mark-outline";
import CalendarOutline from "./layout/calendar-outline";
import DashboardOutline from "./layout/dashboard-outline";
import HorizontalDots from "./layout/horizontal-dots";
import PlusOutline from "./layout/plus-outline";
import RecordsOutline from "./layout/records-outline";
import VerticalDots from "./layout/vertical-dots";
// Notifications
import BellOutline from "./notifications/bell-outline";
// Actions
import CopyOutline from "./actions/copy-outline";
import TrashOutline from "./actions/trash-outline";
// Status
import CheckCircleOutline from "./status/check-circle-outline";
import CheckOutline from "./status/check-outline";
import CheckRoundedFilled from "./status/check-rounded-filled";
import ClockOutline from "./status/clock-outline";
import ClockRoundedFilled from "./status/clock-rounded-filled";
import CloseRoundedFilled from "./status/close-rounded-filled";
import LoadingOutline from "./status/loading-outline";

export const iconsMap = {
  ArrowDownRightOutline,
  ArrowDownTrendOutline,
  ArrowRightOutline,
  ArrowUpRightOutline,
  ArrowUpTrendOutline,
  BellOutline,
  BrandMarkOutline,
  CalendarOutline,
  CheckCircleOutline,
  CheckOutline,
  CheckRoundedFilled,
  ChevronDownOutline,
  ChevronRightOutline,
  ClockOutline,
  ClockRoundedFilled,
  CloseRoundedFilled,
  CopyOutline,
  DashboardOutline,
  EqualsOutline,
  EyeOffOutline,
  EyeOutline,
  Google,
  HistoryOutline,
  HorizontalDots,
  LoadingOutline,
  PlusOutline,
  RecordsOutline,
  TrashOutline,
  VerticalDots,
} as const;

export type Icons = keyof typeof iconsMap;
export type { IconSvgProps } from "./icon-types";
