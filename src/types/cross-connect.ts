import { AuditFields } from "./common";

// Cross-Connect interfaces
export interface CrossConnect extends AuditFields {
  cross_connect_id: string;
  cross_connect_status: string;
  source_rack_id: string;
  source_client_id?: string;
  source_client_name?: string;
  source_port_label?: string;
  target_rack_id: string;
  target_client_id?: string;
  target_client_name?: string;
  target_port_label?: string;
  remark?: string;
  express_provisioning?: boolean;
}

export interface CrossConnectForm {
  source_rack_id: string;
  target_rack_id: string;
  remark?: string;
  express_provisioning?: boolean;
}

export interface CrossConnectRequestForm {
  source_rack_id: string;
  source_client_id: string;
  source_client_name: string;
  target_rack_id: string;
  target_client_id: string;
  target_client_name: string;
  express_provisioning: boolean;
  remark: string;
}

// API payload type - reflects what's actually sent to the server
export interface CrossConnectApiPayload {
  source_rack_id: string;
  source_client_id?: string;
  source_client_name?: string;
  target_rack_id: string;
  target_client_id?: string;
  target_client_name?: string;
  remark?: string;
  express_provisioning?: boolean;
}

export interface EditCrossConnectForm {
  source_rack_id: string;
  source_client_id: string;
  source_client_name: string;
  target_rack_id: string;
  target_client_id: string;
  target_client_name: string;
  remark: string;
  express_provisioning: boolean;
}
