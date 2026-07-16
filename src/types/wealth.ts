export type TitleId = 'hustler' | 'founder' | 'tycoon' | 'mogul' | 'millionaire' | 'multi_millionaire' | 'billionaire';

export interface AchievementDef {
  id: TitleId;
  label: string;
  icon: string;
  requirement: number;
  description: string;
}

export interface PlayerWealth {
  personalCash: number;
  lifetimeWithdrawn: number;
  unlockedTitles: TitleId[];
}
