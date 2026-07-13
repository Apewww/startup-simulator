export interface AdLead {
  id: string;
  clientName: string;
  budget: number;
  defaultDays: number;
  expiresAt: number;
  status: 'pending' | 'negotiating' | 'won' | 'lost' | 'expired';
  specialistId: string;
  offeredDays?: number;
  offeredPrice?: number;
}

export interface AdCampaign {
  id: string;
  leadId: string;
  clientName: string;
  dealValue: number;
  offeredDays: number;
  revenuePerTick: number;
  totalTicks: number;
  ticksElapsed: number;
  status: 'active' | 'completed' | 'cancelled';
  specialistId: string;
  renewalCount: number;
}
