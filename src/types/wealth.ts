export type TitleId = 'hustler' | 'founder' | 'tycoon' | 'mogul' | 'millionaire' | 'multi_millionaire' | 'billionaire';

export type WealthEntryType = 'withdraw' | 'deposit' | 'dividend' | 'stock_buy' | 'stock_sell';

export interface WealthEntry {
  type: WealthEntryType;
  amount: number;
  personalCash: number;
  month: number;
}

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
