import AgendaRoundIcon from '@/components/icons/AgendaRoundIcon';
import AgendaIcon from '@/components/icons/AgendaIcon';
import Announcement from '@/assets/icons/announcement.svg';
import ApplePay from '@/assets/icons/apple_pay.svg';
import Arrow from '@/assets/icons/arrow.svg';
import BackArrowIcon from '@/assets/icons/back-arrow.svg';
import BackIcon from '@/assets/icons/back.svg';
import BoyAvatar from '@/assets/icons/boy-avatar.svg';
import BusActiveIcon from '@/components/icons/BusActiveIcon';
import BusInactiveIcon from '@/assets/icons/bus-inactive.svg';
import CalendarGray from '@/assets/icons/calendar-gray.svg';
import CalendarIcon from '@/components/icons/CalendarIcon';
import ChevronIcon from '@/components/icons/ChevronIcon';
import ClockIcon from '@/assets/icons/clock.svg';
import DeleteAccount from '@/assets/icons/delete-account.svg';
import EmergencyRoundIcon from '@/assets/icons/emergency-round.svg';
import EyeActive from '@/components/icons/EyeActiveIcon';
import EyeInactive from '@/assets/icons/eye-inactive.svg';
import FatherAvatar from '@/assets/icons/father-avatar.svg';
import FinanceRoundIcon from '@/assets/icons/finance-round.svg';
import FinanceIcon from '@/assets/icons/finance.svg';
import FinanceWhite from '@/assets/icons/finance_white.svg';
import GirlAvatar from '@/assets/icons/girl-avatar.svg';
import GoodRoundIcon from '@/components/icons/GoodRoundIcon';
import Instapay from '@/assets/icons/instapay.svg';
import LiveCamIcon from '@/assets/icons/live-cam.svg';
import LockActive from '@/components/icons/LockActiveIcon';
import LockInactive from '@/assets/icons/lock-inactive.svg';
import Logout from '@/assets/icons/logout.svg';
import MailActive from '@/components/icons/MailActiveIcon';
import MailInactive from '@/assets/icons/mail-inactive.svg';
import MealsIcon from '@/assets/icons/meals.svg';
import MotherAvatar from '@/assets/icons/mother-avatar.svg';
import NotificationIcon from '@/components/icons/NotificationIcon';
import ReportIcon from '@/components/icons/ReportIcon';
import Tick from '@/assets/icons/tick.svg';
import UploadPhotoIcon from '@/components/icons/UploadPhotoIcon';
import WalletIcon from '@/components/icons/WalletIcon';
import WellnessRoundIcon from '@/assets/icons/wellness-round.svg';
import WellnessIcon from '@/assets/icons/wellness.svg';

// Bottom navigation icons
import AddIcon from '@/assets/icons/bottomNavigation/add.svg';
import ChattingIcon from '@/assets/icons/bottomNavigation/chatting.svg';
import HomeActiveIcon from '@/assets/icons/bottomNavigation/home-active.svg';
import HomeInactiveIcon from '@/assets/icons/bottomNavigation/home-inactive.svg';
import SettingsActiveIcon from '@/assets/icons/bottomNavigation/settings-active.svg';
import SettingsInactiveIcon from '@/assets/icons/bottomNavigation/settings-inactive.svg';

export const Icons = {
  BackIcon,
  ChevronIcon,
  Announcement,
  LockActive,
  LockInactive,
  LiveCamIcon,
  EyeActive,
  EyeInactive,
  MailActive,
  MailInactive,
  AgendaIcon,
  AgendaRoundIcon,
  ClockIcon,
  CalendarIcon,
  GoodRoundIcon,
  EmergencyRoundIcon,
  FinanceRoundIcon,
  FinanceIcon,
  WellnessRoundIcon,
  WellnessIcon,
  NotificationIcon,
  MealsIcon,
  BusActiveIcon,
  BusInactiveIcon,
  ReportIcon,
  BoyAvatar,
  GirlAvatar,
  FatherAvatar,
  MotherAvatar,
  CalendarGray,
  Logout,
  DeleteAccount,
  Arrow,
  Tick,
  FinanceWhite,
  ApplePay,
  BackArrowIcon,
  Instapay,
  UploadPhotoIcon,
  WalletIcon,
};

export const bottomTabIcons = {
  Home: {
    active: HomeActiveIcon,
    inactive: HomeInactiveIcon,
  },
  Chatting: {
    active: ChattingIcon,
    inactive: ChattingIcon,
  },
  Requests: {
    // No dedicated bottom-bar asset exists; ReportIcon is what already
    // represents Requests on the Account screen, so the two stay consistent.
    active: ReportIcon,
    inactive: ReportIcon,
  },
  Account: {
    active: SettingsActiveIcon,
    inactive: SettingsInactiveIcon,
  },
  Add: {
    active: AddIcon,
    inactive: AddIcon,
  },
};
