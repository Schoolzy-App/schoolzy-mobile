import type { AnnouncementData } from "@/components/AnnouncementItem";

// ─── Newsletters dataset ─────────────────────────────────────────────────────
// AnnouncementData already supports id / title / subtitle / time / iconColor.
// Re-using it here keeps the same UI components on Home and on the dedicated
// Newsletter screen.

export const NEWSLETTERS_DATA: AnnouncementData[] = [
  {
    id: "1",
    title: "Important school information",
    subtitle: "Quick updates, big moments, and important reminders...",
    time: "11:09 PM",
  },
  {
    id: "2",
    title: "Campus Bulletin",
    subtitle: "Official updates from administration and faculty...",
    time: "10:32 AM",
  },
  {
    id: "3",
    title: "Student Life Update",
    subtitle: "News, events, and activities around the school...",
    time: "09:15 AM",
  },
  {
    id: "4",
    title: "Weekly Roundup",
    subtitle: "Highlights, achievements and what's coming up next week...",
    time: "Yesterday",
  },
  {
    id: "5",
    title: "Parent–Teacher Conference",
    subtitle: "Reserve your slot for next Wednesday's PTC sessions...",
    time: "2 days ago",
  },
  {
    id: "6",
    title: "Health & Safety Reminder",
    subtitle: "New drop-off procedures take effect next Monday...",
    time: "3 days ago",
  },
  {
    id: "7",
    title: "Spring Sports Day",
    subtitle: "Cheer on your child at this year's track & field event...",
    time: "4 days ago",
  },
  {
    id: "8",
    title: "Library Reading Challenge",
    subtitle: "Students who read 10 books this term win a prize pack...",
    time: "5 days ago",
  },
  {
    id: "9",
    title: "Holiday Schedule Released",
    subtitle: "Full break calendar for the upcoming term is now available...",
    time: "1 week ago",
  },
  {
    id: "10",
    title: "New Cafeteria Menu",
    subtitle: "Updated weekly meals with more vegetarian and halal options...",
    time: "1 week ago",
  },
  {
    id: "11",
    title: "Cybersafety Workshop",
    subtitle: "Free online session for parents on protecting kids online...",
    time: "2 weeks ago",
  },
  {
    id: "12",
    title: "Annual Charity Drive",
    subtitle: "Donations are open until the end of the month — every gift counts.",
    time: "2 weeks ago",
  },
];
