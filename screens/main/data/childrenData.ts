import { Icons } from "@/constants";
import type { ChildData } from "@/types/child";

export const CHILDREN_DATA: ChildData[] = [
  {
    id: "1",
    name: "Leena Mohamed Ali",
    year: "Year 6 (B)",
    gender: "female",
    activeBus: true,
    allergies: "Peanuts",
    bloodType: "O+",
    attendance: "Absent",
    avatarIcon: Icons.GirlAvatar,
  },
  {
    id: "2",
    name: "Kareem Mohamed Ali",
    year: "Year 4 (C)",
    gender: "male",
    activeBus: false,
    allergies: "None",
    bloodType: "A+",
    attendance: "Present",
    avatarIcon: Icons.BoyAvatar,
  },
  {
    id: "3",
    name: "Mazen Mohamed Ali",
    year: "Year 1 (A)",
    gender: "male",
    activeBus: true,
    allergies: "Dairy",
    bloodType: "B+",
    attendance: "Present",
    avatarIcon: Icons.BoyAvatar,
  },
];
