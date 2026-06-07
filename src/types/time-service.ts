import { AuditFields } from "./common";

// Connector types for GPS Signal Feed
export type ConnectorType = "BNC" | "TNC" | "N_TYPE" | "SMA";

// Service types
export type TimeServiceType =
  | "GPS_SIGNAL_SINGLE"
  | "GPS_SIGNAL_DUAL"
  | "PTP_SINGLE"
  | "PTP_DUAL";

// Time Service request interface (for API)
export interface TimeServiceReq {
  rack_id: string;
  service_type: TimeServiceType;
  connector_type?: ConnectorType | null;
  quantity?: number;
  start_date?: string | null;
  remark?: string | null;
}

// Time Service response interface (from API)
export interface TimeServiceRes extends AuditFields {
  time_service_id: string;
  time_service_status: string;
  start_date?: string | null;
  rack_id: string;
  client_id?: string | null;
  client_name?: string | null;
  service_type: TimeServiceType;
  connector_type?: ConnectorType | null;
  quantity: number;
  remark?: string | null;
}

// Form data interface for the time service wizard (UI state)
export interface TimeServiceFormData {
  rack_id: string;
  start_date: string;
  services: TimeServiceFormItem[];
  remark: string;
}

// Individual service item in the form
export interface TimeServiceFormItem {
  service_type: TimeServiceType;
  connector_type?: ConnectorType;
  quantity: number;
}
