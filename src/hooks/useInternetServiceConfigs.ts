import { useState, useEffect } from "react";
import { getWithAuth } from "atlas-shared-web";
import { API_BASE, IDENTITY_API_BASE } from "../lib/config";
import { ClientRef } from "../types/common";
import { InternetServiceType } from "../types/internet-service";

// Service type definition structure
export interface ServiceTypeDefinition {
  label: string;
  description: string;
  router: string;
  details: string[];
}

export interface InternetServiceConfigs {
  prices: Record<string, string>;
  bandwidths: Record<string, string>; // service_type -> comma-separated bandwidth labels (e.g., "SINGNET_ELITE_8IP" -> "10 Mbps,20 Mbps,...")
  serviceTypeDefinitions: Record<InternetServiceType, ServiceTypeDefinition>;
  clients: ClientRef[];
  isLoading: boolean;
  // Helper functions to get fees from prices
  getBandwidthsForServiceType: (serviceType: InternetServiceType) => string[];
  getServiceFee: (serviceType: string, bandwidth: string) => { monthly: number; onetime: number };
  getRouterMaintenanceFee: (serviceType: InternetServiceType) => number;
  getAddonFee: (fieldName: string) => { monthly: number; onetime: number };
}


const serviceTypeDefinitions: Record<InternetServiceType, ServiceTypeDefinition> = {
  [InternetServiceType.SINGNET_ELITE_8IP]: {
    label: "Singnet Elite",
    description: "8 IP Address",
    router: "HP MSR 930 (or similar)",
    details: [
      "8 IP Address",
      "Free HP MSR 930 router (or similar)",
      "Free router installation during weekday office hours, 1 hour of remote hand charges (SGD 400) apply for after office-hours installation",
      "Cross connect to service provider included",
    ],
  },
  [InternetServiceType.SINGNET_ELITE_16IP]: {
    label: "Singnet Elite",
    description: "16 IP Address",
    router: "HP MSR 2003 (or similar)",
    details: [
      "16 IP Address",
      "Free HP MSR 2003 router (or similar)",
      "Free router installation during weekday office hours, 1 hour of remote hand charges (SGD 400) apply for after office-hours installation",
      "Cross connect to service provider included",
    ],
  },
  [InternetServiceType.SINGNET_ETHERNET]: {
    label: "Singnet Ethernet",
    description: "Dedicated fibre access",
    router: "Fortigate 50E (or similar)",
    details: [
      "16 IP Address",
      "Free Fortigate 50E router (or similar)",
      "Free router installation during weekday office hours, 1 hour of remote hand charges (SGD 400) apply for after office-hours installation",
      "Cross connect to service provider included",
    ],
  },
};

export function useInternetServiceConfigs(isInternalUser: boolean = true): InternetServiceConfigs {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [bandwidths, setBandwidths] = useState<Record<string, string>>({});
  const [clients, setClients] = useState<ClientRef[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to get available bandwidths for a service type from bandwidths config
  const getBandwidthsForServiceType = (serviceType: InternetServiceType): string[] => {
    const bandwidthStr = bandwidths[serviceType];
    if (!bandwidthStr) return [];
    return bandwidthStr.split(",").map((bw) => bw.trim());
  };

  // Helper function to get service fee from prices
  // Monthly: MONTHLY@SERVICE_TYPE@BANDWIDTH, One-time: ONETIME@SERVICE_TYPE
  const getServiceFee = (serviceType: string, bandwidth: string): { monthly: number; onetime: number } => {
    return {
      monthly: Number(prices[`MONTHLY@${serviceType}@${bandwidth}`]) || 0,
      onetime: Number(prices[`ONETIME@${serviceType}`]) || 0,
    };
  };

  // Helper function to get router maintenance fee from prices
  // Key: ANNUALLY@router_maintenance@SERVICE_TYPE
  const getRouterMaintenanceFee = (serviceType: InternetServiceType): number => {
    return Number(prices[`ANNUALLY@router_maintenance@${serviceType}`]) || 0;
  };

  // Helper function to get addon fee from prices
  // fieldName: bgp_routing_lines, dns_hosting_domains, bgp_ipsec_configuration, express_provisioning
  const getAddonFee = (fieldName: string): { monthly: number; onetime: number } => {
    return {
      monthly: Number(prices[`MONTHLY@${fieldName}`]) || 0,
      onetime: Number(prices[`ONETIME@${fieldName}`]) || 0,
    };
  };

  useEffect(() => {
    const fetchConfigs = async () => {
      setIsLoading(true);
      try {
        const fetchPromises: Promise<Response>[] = [
          getWithAuth(`${API_BASE}/network/atlas-configs/v1/INTERNET_SERVICE`),
        ];
        if (isInternalUser) {
          fetchPromises.push(getWithAuth(`${IDENTITY_API_BASE}/identity/clients/v1/`));
        }

        const responses = await Promise.all(fetchPromises);
        const internetServiceResponse = responses[0];
        const clientsResponse = isInternalUser ? responses[1] : null;

        if (internetServiceResponse.ok) {
          const data = await internetServiceResponse.json();
          const pricesConfig = data.find((c: { field_name: string }) => c.field_name === "PRICES");
          const bandwidthsConfig = data.find((c: { field_name: string }) => c.field_name === "BANDWIDTHS");

          if (pricesConfig) setPrices(pricesConfig.options);
          if (bandwidthsConfig) setBandwidths(bandwidthsConfig.options);
        }

        if (clientsResponse?.ok) {
          const data = await clientsResponse.json();
          setClients(data);
        }
      } catch (error) {
        console.error("Failed to fetch internet service configs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfigs();
  }, [isInternalUser]);

  return {
    prices,
    bandwidths,
    serviceTypeDefinitions,
    clients,
    isLoading,
    getBandwidthsForServiceType,
    getServiceFee,
    getRouterMaintenanceFee,
    getAddonFee,
  };
}
