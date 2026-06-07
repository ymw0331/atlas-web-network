import { AuditFields } from "./common";

// Rack enums (matching API spec)
export type RackTier = "Tier1" | "Tier2";
export type RackType = "Full_Rack" | "Half_Rack";

// Rack interfaces
export interface Rack extends AuditFields {
  rack_id: string;
  rack_status: string;
  rack_tier: string;
  rack_type: string;
  power: string;
  is_800mm_width_full_rack: boolean;
  reserve_standard_full_rack?: number;
  reserve_800mm_full_rack?: number;
  client_id?: string;
  client_name?: string;
}

export interface RackForm {
  rack_id?: string;
  rack_tier: string;
  rack_type: string;
  power: string;
  is_800mm_width_full_rack?: boolean;
  reserve_standard_full_rack?: number;
  reserve_800mm_full_rack?: number;
  client_id?: string;
  client_name?: string;
}

export interface RackCreateForm extends RackForm {
  rack_id?: string;
}
