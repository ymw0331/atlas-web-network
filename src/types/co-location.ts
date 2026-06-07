import { AuditFields } from "./common";
import { RackForm } from "./rack";

// Non-Trading App keys (from NON_TRADING_APPS config)
export type NetworkNonTradingAppKey = string;

// Co-Location interfaces (matching API spec)
export interface CoLocationRackSpecs {
  power_strips_by_atlas?: boolean;
  subscriber_customers?: number;
  racks: RackForm[];
}

export interface NetworkTradingApp {
  dedicated_multicast_market_data_fiber?: number;
  trading_and_market_data_fiber?: number;
  trading_and_market_data_fiber_handoff?: number;
}

export interface NetworkNonTradingApp {
  all_non_trading_apps_fiber_handoff?: number;
  single_non_trading_apps_fiber_handoff?: number;
  single_non_trading_apps: NetworkNonTradingAppKey[];
  test_env_fiber_handoff?: number;
}

export interface NetworkGiftConnect {
  gift_connect_or_colo_rack_in_nse_ifsc_fiber_handoff?: number;
  gift_connect_mtbt_over_wan_feed_from_atlas_colo_rack_fiber_handoff?: number;
  gift_connect_additional_1_mbps_of_intl_bandwidth_to_gift_system?: number;
  gift_connect_additional_1_mbps_of_intl_bandwidth_to_gift_colo_rack?: number;
}

export interface RemoteHandsServices {
  remote_hands_monthly_subscription_bundle_per_hour?: number;
  remote_hands_additional_service_request_during_office_hours?: boolean;
  remote_hands_additional_service_request_during_non_office_hours?: boolean;
}

export interface CoLocationReq {
  co_location_status?: string;
  client_id?: string;
  client_name?: string;
  start_date?: string;
  remarks?: string;
  rackSpecs: CoLocationRackSpecs;
  networkTradingApp: NetworkTradingApp;
  networkNonTradingApp: NetworkNonTradingApp;
  networkGiftConnect: NetworkGiftConnect;
  remoteHandsServices: RemoteHandsServices;
}

export interface CoLocationRes extends AuditFields {
  co_location_id: string;
  co_location_status: string;
  client_id?: string;
  client_name?: string;
  start_date?: string;
  remarks?: string;
  rackSpecs: CoLocationRackSpecs;
  networkTradingApp: NetworkTradingApp;
  networkNonTradingApp: NetworkNonTradingApp;
  networkGiftConnect: NetworkGiftConnect;
  remoteHandsServices: RemoteHandsServices;
}

// Form data interface for the co-location wizard (UI state)
export interface ColoFormData {
  client_id?: string;
  client_name?: string;
  startDate: string;
  rackSpecs: CoLocationRackSpecs;
  networkTradingApp: NetworkTradingApp;
  networkNonTradingApp: NetworkNonTradingApp;
  networkGiftConnect: NetworkGiftConnect;
  remoteHandsServices: RemoteHandsServices;
  remarks: string;
}
