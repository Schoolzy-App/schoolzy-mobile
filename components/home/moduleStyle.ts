import {
  ArrowCircleUpIcon,
  BankIcon,
  BookOpenIcon,
  BowlFoodIcon,
  BusIcon,
  ChatCircleTextIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  ClockIcon,
  CurrencyCircleDollarIcon,
  HeartIcon,
  type Icon,
  LightningIcon,
  LockKeyIcon,
  NewspaperIcon,
  NotebookIcon,
  PaperPlaneTiltIcon,
  PlusCircleIcon,
  UserCircleIcon,
  WalletIcon,
} from "phosphor-react-native";

import { Palette } from "@/constants/tokens";

export interface ModuleStyle {
  Icon: Icon;
  /** Solid module colour; null means "use the school's brand colour". */
  color: string | null;
}

const BRAND = null;

/** Catalogue codes the server sends for quick actions, matched exactly. */
const BY_CODE: Record<string, ModuleStyle> = {
  "add-request": { Icon: PlusCircleIcon, color: BRAND },
  "add-complaint": { Icon: ChatCircleTextIcon, color: BRAND },
  requests: { Icon: PaperPlaneTiltIcon, color: BRAND },
  "my-requests": { Icon: PaperPlaneTiltIcon, color: BRAND },
  newsletter: { Icon: NewspaperIcon, color: BRAND },
  "update-data": { Icon: UserCircleIcon, color: BRAND },
  "change-password": { Icon: LockKeyIcon, color: BRAND },
  "pay-fees": { Icon: CurrencyCircleDollarIcon, color: Palette.module.finance.solid },
  finance: { Icon: BankIcon, color: Palette.module.finance.solid },
  finances: { Icon: BankIcon, color: Palette.module.finance.solid },
  wallet: { Icon: WalletIcon, color: Palette.module.finance.solid },
  "top-up": { Icon: ArrowCircleUpIcon, color: Palette.module.finance.solid },
  reports: { Icon: ClipboardTextIcon, color: Palette.module.reports.solid },
  wellness: { Icon: HeartIcon, color: Palette.module.wellness.solid },
  agenda: { Icon: BookOpenIcon, color: Palette.module.agenda.solid },
  homework: { Icon: NotebookIcon, color: Palette.module.agenda.solid },
  attendance: { Icon: CheckCircleIcon, color: Palette.status.success.solid },
  meals: { Icon: BowlFoodIcon, color: Palette.module.meals.solid },
  timesheet: { Icon: ClockIcon, color: Palette.module.timesheet.solid },
  bus: { Icon: BusIcon, color: Palette.module.agenda.solid },
};

/**
 * Icon and colour for a dashboard item, from the design's module palette.
 *
 * Quick actions carry a known catalogue code. Attention, glance, Today and
 * Upcoming items don't — their codes and types aren't a published list — so
 * those fall back to matching the code, type and label by substring:
 * "meal" and "meals", "payment" and "next-payment" should all land the same.
 */
export function moduleStyle(code: string, hint = ""): ModuleStyle {
  const exact = BY_CODE[code];
  if (exact) return exact;

  const key = `${code} ${hint}`.toLowerCase();
  if (/meal|cafeteria|lunch/.test(key)) return BY_CODE.meals;
  if (/newsletter|announce/.test(key)) return BY_CODE.newsletter;
  if (/wallet/.test(key)) return BY_CODE.wallet;
  if (/pay|installment|fee|outstanding|invoice|finance/.test(key)) {
    return BY_CODE["pay-fees"];
  }
  if (/wellness|health|clinic|medical/.test(key)) return BY_CODE.wellness;
  if (/attendance|present|absent/.test(key)) return BY_CODE.attendance;
  if (/request/.test(key)) return BY_CODE.requests;
  if (/complaint/.test(key)) return BY_CODE["add-complaint"];
  if (/report/.test(key)) return BY_CODE.reports;
  if (/homework|agenda|exam|quiz|class|timetable/.test(key)) {
    return BY_CODE.agenda;
  }
  if (/timesheet/.test(key)) return BY_CODE.timesheet;
  return { Icon: LightningIcon, color: Palette.module.agenda.solid };
}
