export type CategoryKey =
  | "head_to_head"
  | "big_win_little_win"
  | "line"
  | "anytime_goal_scorer"
  | "two_plus_goals"
  | "three_plus_goals"
  | "four_plus_goals"
  | "five_plus_goals"
  | "six_plus_goals"
  | "seven_plus_goals"
  | "eight_plus_goals"
  | "best_on_ground"
  | "best_6_players"
  | "not_in_best_6_players"
  | "to_not_kick_a_goal"
  | "first_goal_scorer"
  | "other";

export type FndFormItem = {
  value: string | number;
  highlight?: "good" | "bad" | "neutral";
};

export type FndSelection = {
  id: string;
  label: string;
  odds: number;
  form?: FndFormItem[];
};

export type FndCategory = {
  label: string;
  layout: "two-column" | "player-grid";
  selections: FndSelection[];
};

export const matchInfo = {
  id: "nilma-darnum-v-bunyip",
  round: "Round 1",
  opponent: "Bunyip",
  venue: "Nilma-Darnum",
};

export const categoryOrder: CategoryKey[] = [
  "head_to_head",
  "big_win_little_win",
  "line",
  "anytime_goal_scorer",
  "two_plus_goals",
  "three_plus_goals",
  "four_plus_goals",
  "five_plus_goals",
  "six_plus_goals",
  "seven_plus_goals",
  "eight_plus_goals",
  "best_on_ground",
  "best_6_players",
  "not_in_best_6_players",
  "to_not_kick_a_goal",
  "first_goal_scorer",
  "other",
];

export const categories: Record<CategoryKey, FndCategory> = {
  head_to_head: {
    label: "Head to Head",
    layout: "two-column",
    selections: [
      { id: "h2h_nilma", label: "Nilma-Darnum", odds: 1.01 },
      { id: "h2h_bunyip", label: "Bunyip", odds: 34.0 },
    ],
  },

  big_win_little_win: {
    label: "Big Win Little Win",
    layout: "two-column",
    selections: [
      { id: "bw_nilma_big", label: "Nilma 50+", odds: 1.04 },
      { id: "bw_nilma_little", label: "Nilma 1-49", odds: 9.0 },
      { id: "bw_bunyip_little", label: "Bunyip 1-49", odds: 34.0 },
      { id: "bw_bunyip_big", label: "Bunyip 50+", odds: 301.0 },
    ],
  },

  line: {
    label: "Line",
    layout: "two-column",
    selections: [
      { id: "line_nilma", label: "Nilma-Darnum (-129.5)", odds: 1.87 },
      { id: "line_bunyip", label: "Bunyip (+129.5)", odds: 1.89 },
    ],
  },

  anytime_goal_scorer: {
    label: "Anytime Goal Scorer",
    layout: "player-grid",
    selections: [],
  },

  two_plus_goals: {
    label: "2+ Goals",
    layout: "player-grid",
    selections: [],
  },

  three_plus_goals: {
    label: "3+ Goals",
    layout: "player-grid",
    selections: [],
  },

  four_plus_goals: {
    label: "4+ Goals",
    layout: "player-grid",
    selections: [],
  },

  five_plus_goals: {
    label: "5+ Goals",
    layout: "player-grid",
    selections: [],
  },

  six_plus_goals: {
    label: "6+ Goals",
    layout: "player-grid",
    selections: [],
  },

  seven_plus_goals: {
    label: "7+ Goals",
    layout: "player-grid",
    selections: [],
  },

  eight_plus_goals: {
    label: "8+ Goals",
    layout: "player-grid",
    selections: [],
  },

  best_on_ground: {
    label: "Best on Ground",
    layout: "player-grid",
    selections: [],
  },

  best_6_players: {
    label: "Best 6 Players",
    layout: "player-grid",
    selections: [],
  },

  not_in_best_6_players: {
    label: "Not in Best 6 Players",
    layout: "player-grid",
    selections: [],
  },

  to_not_kick_a_goal: {
    label: "To Not Kick a Goal",
    layout: "player-grid",
    selections: [],
  },

  first_goal_scorer: {
    label: "First Goal Scorer",
    layout: "player-grid",
    selections: [],
  },

  other: {
    label: "Other",
    layout: "two-column",
    selections: [
      { id: "other_dema_mark", label: "James Demicoli 1+ contested mark", odds: 8.0 },
      { id: "other_bunyip_25", label: "Nilma to have 12+ different goal kickers", odds: 4.0 },
      { id: "other_cook_outscore", label: "Archie Cook to outscore Bunylp", odds: 1.55 },
      { id: "other_pat_meg_10", label: "Patterson and Meggetto to combine for 10+ goals", odds: 7.0 },
      { id: "other_nilma_30", label: "Nilma to score 30 points every quarter", odds: 3.0 },
      { id: "other_fight", label: "Will a fight break out", odds: 9.0 },
      { id: "other_jacob_fruit", label: "Egan to eat any type of fruit during the game", odds: 5.0 },
      { id: "other_three_amigos", label: "Any of A. Price, J. Egan or J. Cook to kick a goal", odds: 4.50 },
      { id: "other_kerstan", label: "Kerstan Brothers to both kick a goal", odds: 5.0 },
      { id: "other_Janking", label: "All Janking members playing for Nilma to kick a goal", odds: 265.0 },
      { id: "other_200", label: "Nilma to score 200+ points", odds: 41.0 },
      { id: "other_patout", label: "Any player to kick more goals than James Patterson", odds: 4.50 },
      { id: "other_pat_meg_amey", label: "McAuley, Patterson, Amey and Meggetto to all get in the best 6", odds: 3.90 },
      { id: "other_nilma_5", label: "Nilma to kick 5+ goals in every quarter", odds: 3.0 },
      { id: "other_bunyip_quarter", label: "Bunyip to win any quarter", odds: 15.0 },
            { id: "other_bunyip_zero", label: "Bunyip to go scoreless", odds: 8.0 },
      { id: "other_cbun_outscore", label: "Bunyip to go goalless", odds: 2.30 },
    ],
  },
};