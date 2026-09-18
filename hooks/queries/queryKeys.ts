/**
 * Centralized query keys. Hierarchical so a parent key invalidates every child:
 * `invalidateQueries({ queryKey: queryKeys.students.all })` clears the list and
 * every per-student profile.
 */
export const queryKeys = {
  students: {
    all: ["students"] as const,
    list: () => [...queryKeys.students.all, "list"] as const,
    profile: (studentSeasonId: number) =>
      [...queryKeys.students.all, "profile", studentSeasonId] as const,
    reports: (studentSeasonId: number) =>
      [...queryKeys.students.all, "reports", studentSeasonId] as const,
  },

  agenda: {
    all: ["agenda"] as const,
    /** `date` is the yyyy-mm-dd key so the cache is per day, not per timestamp. */
    byDate: (studentSeasonId: number, date?: string) =>
      [...queryKeys.agenda.all, studentSeasonId, date ?? "today"] as const,
  },

  documentRequests: {
    all: ["documentRequests"] as const,
    list: () => [...queryKeys.documentRequests.all, "list"] as const,
    detail: (id: number) =>
      [...queryKeys.documentRequests.all, "detail", id] as const,
    createOptions: () =>
      [...queryKeys.documentRequests.all, "createOptions"] as const,
  },

  newsletters: {
    all: ["newsletters"] as const,
    list: () => [...queryKeys.newsletters.all, "list"] as const,
  },

  healthProfile: {
    all: ["healthProfile"] as const,
    overview: (studentSeasonId: number) =>
      [...queryKeys.healthProfile.all, "overview", studentSeasonId] as const,
    edit: (studentSeasonId: number) =>
      [...queryKeys.healthProfile.all, "edit", studentSeasonId] as const,
  },

  payments: {
    all: ["payments"] as const,
    due: (studentSeasonId: number) =>
      [...queryKeys.payments.all, "due", studentSeasonId] as const,
    /** Paging is handled by the infinite query, not the key. */
    history: (studentSeasonId: number) =>
      [...queryKeys.payments.all, "history", studentSeasonId] as const,
    categories: () => [...queryKeys.payments.all, "categories"] as const,
    igAccountOptions: (studentSeasonId: number) =>
      [...queryKeys.payments.all, "igAccountOptions", studentSeasonId] as const,
  },

  cafeteria: {
    all: ["cafeteria"] as const,
    meals: () => [...queryKeys.cafeteria.all, "meals"] as const,
    mealItems: (mealId: number) =>
      [...queryKeys.cafeteria.all, "items", mealId] as const,
    /** `date` is the yyyy-mm-dd key so the cache is per day. */
    orders: (studentSeasonId: number, date?: string) =>
      [
        ...queryKeys.cafeteria.all,
        "orders",
        studentSeasonId,
        date ?? "today",
      ] as const,
    paymentOptions: (studentSeasonId: number) =>
      [...queryKeys.cafeteria.all, "paymentOptions", studentSeasonId] as const,
  },

  notifications: {
    all: ["notifications"] as const,
    /** Single key: paging is handled by the infinite query, not the key. */
    list: () => [...queryKeys.notifications.all, "list"] as const,
    recent: () => [...queryKeys.notifications.all, "recent"] as const,
    unreadCount: () =>
      [...queryKeys.notifications.all, "unreadCount"] as const,
  },

  wallet: {
    all: ["wallet"] as const,
    balance: (studentSeasonId: number) =>
      [...queryKeys.wallet.all, "balance", studentSeasonId] as const,
    balances: () => [...queryKeys.wallet.all, "balances"] as const,
  },

  timetable: {
    all: ["timetable"] as const,
    /** `date` is the yyyy-mm-dd key so the cache is per day, not per timestamp. */
    byDate: (studentSeasonId: number, date?: string) =>
      [...queryKeys.timetable.all, studentSeasonId, date ?? "today"] as const,
  },

  currentUser: {
    all: ["currentUser"] as const,
  },

  home: {
    all: ["home"] as const,
  },
} as const;
