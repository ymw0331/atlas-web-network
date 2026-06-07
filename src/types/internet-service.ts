import { AuditFields } from "./common";

// Service types
export enum InternetServiceType {
  SINGNET_ELITE_8IP = "SINGNET_ELITE_8IP",
  SINGNET_ELITE_16IP = "SINGNET_ELITE_16IP",
  SINGNET_ETHERNET = "SINGNET_ETHERNET",
}

// Internet Service request interface (for API)
export interface InternetServiceReq {
  start_date?: string | null;
  rack_id: string;
  service_type: InternetServiceType;
  bandwidth: string;
  quantity?: number;
  remark?: string | null;
  bgp_routing_lines?: number;
  dns_hosting_domains?: number;
  bgp_ipsec_configuration?: boolean | null;
  router_maintenance?: boolean | null;
  express_provisioning?: boolean | null;
}

// Internet Service response interface (from API)
export interface InternetServiceRes extends AuditFields {
  internet_service_id: string;
  internet_service_status: string;
  start_date?: string | null;
  rack_id: string;
  client_id?: string | null;
  client_name?: string | null;
  service_type: InternetServiceType;
  bandwidth: string;
  quantity: number;
  remark?: string | null;
  bgp_routing_lines: number;
  dns_hosting_domains: number;
  bgp_ipsec_configuration?: boolean | null;
  router_maintenance?: boolean | null;
  express_provisioning?: boolean | null;
}

// Form data interface for the wizard (UI state)
export interface InternetServiceFormData {
  rack_id: string;
  start_date: string;
  service_type: InternetServiceType | "";
  bandwidth: string;
  quantity: number;
  remark: string;
  // Add-on services
  bgp_routing_lines: number;
  dns_hosting_domains: number;
  bgp_ipsec_configuration: boolean;
  router_maintenance: boolean;
  express_provisioning: boolean;
}

// Initial form data
export const INITIAL_FORM_DATA: InternetServiceFormData = {
  rack_id: "",
  start_date: "",
  service_type: "",
  bandwidth: "",
  quantity: 1,
  remark: "",
  bgp_routing_lines: 0,
  dns_hosting_domains: 0,
  bgp_ipsec_configuration: false,
  router_maintenance: false,
  express_provisioning: false,
};
