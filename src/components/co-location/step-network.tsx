import React from "react";
import { Card, CardHeader, CardBody, Checkbox } from "@heroui/react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { ColoFormData, NetworkTradingApp, NetworkNonTradingApp, NetworkGiftConnect, RemoteHandsServices } from "../../types/co-location";
import { QuantityInput } from "atlas-shared-web/components";
import { ColocationConfigs } from "../../hooks/useColocationConfigs";

interface StepNetworkProps {
  formData: ColoFormData;
  updateFormData: (data: Partial<ColoFormData>) => void;
  configs: ColocationConfigs;
}

interface FeeConfig {
  monthly_fee?: number;
  onetime_fee?: number;
}

interface NetworkItem<T> {
  field: keyof T;
  title: string;
  note?: string;
}

const TRADING_ITEMS: NetworkItem<NetworkTradingApp>[] = [
  {
    field: "dedicated_multicast_market_data_fiber",
    title: "Dedicated Multicast Market Data",
    note: "For Tier-1 Rack only",
  },
  {
    field: "trading_and_market_data_fiber",
    title: "Trading and Market Data - 10 GB",
    note: "For Tier-1 Rack only",
  },
  {
    field: "trading_and_market_data_fiber_handoff",
    title: "Trading and Market Data",
    note: "For Tier-1 or Tier-2 Rack",
  },
];

const NON_TRADING_ITEMS: NetworkItem<NetworkNonTradingApp>[] = [
  {
    field: "all_non_trading_apps_fiber_handoff",
    title: "All Non-Trading Applications including Backoffice Services",
  },
  {
    field: "single_non_trading_apps_fiber_handoff",
    title: "Single Non-Trading Application",
  },
];

const TEST_ENV_ITEMS: NetworkItem<NetworkNonTradingApp>[] = [
  {
    field: "test_env_fiber_handoff",
    title: "Test Environment",
  },
];

const GIFT_NETWORK_ITEMS: NetworkItem<NetworkGiftConnect>[] = [
  {
    field: "gift_connect_or_colo_rack_in_nse_ifsc_fiber_handoff",
    title: "GIFT Connect System/Co-Lo rack in NSE IFSC",
  },
  {
    field: "gift_connect_mtbt_over_wan_feed_from_atlas_colo_rack_fiber_handoff",
    title: "GIFT Connect MTBT over WAN feed from ATLAS Co-Location rack",
  },
];

const GIFT_BANDWIDTH_ITEMS: NetworkItem<NetworkGiftConnect>[] = [
  {
    field: "gift_connect_additional_1_mbps_of_intl_bandwidth_to_gift_system",
    title: "Additional 1 Mbps of international bandwidth to GIFT Connect System",
  },
  {
    field: "gift_connect_additional_1_mbps_of_intl_bandwidth_to_gift_colo_rack",
    title: "Additional 1 Mbps of international bandwidth to GIFT Connect co-location rack.",
  },
];

const REMOTE_HANDS_ITEMS: NetworkItem<RemoteHandsServices>[] = [
  {
    field: "remote_hands_monthly_subscription_bundle_per_hour",
    title: "Monthly subscription bundle per 1 hour service request",
  },
];

export default function StepNetwork({ formData, updateFormData, configs }: StepNetworkProps) {
  // Get spec description for a field
  const getSpec = (fieldName: string): string => {
    return configs.specs[fieldName] || "";
  };

  // Get fee for a field from CO_LOCATION PRICES
  const getFee = (fieldName: string): FeeConfig => {
    const monthlyKey = `MONTHLY@${fieldName}`;
    const onetimeKey = `ONETIME@${fieldName}`;
    return {
      monthly_fee: configs.prices[monthlyKey] ? Number(configs.prices[monthlyKey]) : undefined,
      onetime_fee: configs.prices[onetimeKey] ? Number(configs.prices[onetimeKey]) : undefined,
    };
  };

  // Render fee display
  const renderFee = (fee: FeeConfig): React.ReactNode => {
    if (!fee.monthly_fee && !fee.onetime_fee) return null;
    return (
      <p className="text-sm text-gray-500">
        {fee.monthly_fee && <span>Monthly Fee: SGD {fee.monthly_fee.toLocaleString()}</span>}
        {fee.monthly_fee && fee.onetime_fee && " | "}
        {fee.onetime_fee && <span>One-time Fee: SGD {fee.onetime_fee.toLocaleString()}</span>}
      </p>
    );
  };

  // Update functions for each section
  const updateTradingApp = (field: keyof NetworkTradingApp, value: number) => {
    updateFormData({
      networkTradingApp: {
        ...formData.networkTradingApp,
        [field]: value || undefined,
      },
    });
  };

  const updateNonTradingApp = (field: keyof NetworkNonTradingApp, value: number) => {
    updateFormData({
      networkNonTradingApp: {
        ...formData.networkNonTradingApp,
        [field]: value || undefined,
      },
    });
  };

  const updateGiftConnect = (field: keyof NetworkGiftConnect, value: number) => {
    updateFormData({
      networkGiftConnect: {
        ...formData.networkGiftConnect,
        [field]: value || undefined,
      },
    });
  };

  const updateRemoteHands = (field: keyof RemoteHandsServices, value: number | boolean) => {
    updateFormData({
      remoteHandsServices: {
        ...formData.remoteHandsServices,
        [field]: typeof value === "boolean" ? value : (value || undefined),
      },
    });
  };

  const toggleSingleNonTradingApp = (appKey: string, checked: boolean) => {
    const currentApps = formData.networkNonTradingApp.single_non_trading_apps || [];
    const newApps = checked
      ? [...currentApps, appKey]
      : currentApps.filter((app) => app !== appKey);
    updateFormData({
      networkNonTradingApp: {
        ...formData.networkNonTradingApp,
        single_non_trading_apps: newApps,
      },
    });
  };

  // Generic render section for any network type with inline fee details
  const renderSection = <T extends object>(
    title: string,
    items: NetworkItem<T>[],
    data: T,
    updateFn: (field: keyof T, value: number) => void
  ) => (
    <div className="p-6">
      <h4 className="text-base font-semibold mb-4">{title}</h4>
      <div className="space-y-3">
        {items.map((item) => {
          const fee = getFee(String(item.field));
          const spec = getSpec(String(item.field));
          return (
            <div key={String(item.field)} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">
                  {item.title}
                  {item.note && <span className="ml-2 text-sm font-normal text-amber-600 dark:text-amber-400">({item.note})</span>}
                </p>
                {spec && (
                  <p className="text-sm text-gray-500 mb-1">{spec}</p>
                )}
                {renderFee(fee)}
              </div>
              <QuantityInput
                value={(data[item.field] as number | null) ?? 0}
                onChange={(val) => updateFn(item.field, val)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Network to ATLAS Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Network to ATLAS</h3>
        </CardHeader>
        <CardBody className="px-0 py-0">
          <div className="p-6">
            <h4 className="text-base font-semibold mb-4">Network to ATLAS Securities / Derivatives Trading</h4>
            <div className="space-y-3">
              {TRADING_ITEMS.map((item) => {
                const fee = getFee(String(item.field));
                const spec = getSpec(String(item.field));
                const isTradingMarketData = item.field === "trading_and_market_data_fiber_handoff";
                return (
                  <div key={String(item.field)} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.title}
                          {item.note && <span className="ml-2 text-sm font-normal text-amber-600 dark:text-amber-400">({item.note})</span>}
                        </p>
                        {spec && (
                          <p className="text-sm text-gray-500 mb-1">{spec}</p>
                        )}
                        {renderFee(fee)}
                      </div>
                      <QuantityInput
                        value={(formData.networkTradingApp[item.field] as number | null) ?? 0}
                        onChange={(val) => updateTradingApp(item.field, val)}
                      />
                    </div>
                    {isTradingMarketData && (
                      <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-start gap-2">
                        <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Note: Separate pair of handoffs required if subscribing to multicast market data feeds for both Securities and Derivatives markets
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700 mx-6" />

          <div className="p-6">
            <h4 className="text-base font-semibold mb-4">Network to Non-Trading Applications</h4>
            <div className="space-y-3">
              {NON_TRADING_ITEMS.map((item) => {
                const fee = getFee(String(item.field));
                const spec = getSpec(String(item.field));
                const isSingleNonTrading = item.field === "single_non_trading_apps_fiber_handoff";
                return (
                  <div key={String(item.field)} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        {spec && (
                          <p className="text-sm text-gray-500 mb-1">{spec}</p>
                        )}
                        {renderFee(fee)}
                      </div>
                      <QuantityInput
                        value={(formData.networkNonTradingApp[item.field] as number | null) ?? 0}
                        onChange={(val) => updateNonTradingApp(item.field, val)}
                      />
                    </div>
                    {isSingleNonTrading && (
                      <div className="mt-3 flex gap-6">
                        {Object.entries(configs.nonTradingApps).map(([key, label]) => (
                          <Checkbox
                            key={key}
                            isSelected={formData.networkNonTradingApp.single_non_trading_apps?.includes(key) ?? false}
                            onValueChange={(checked) => toggleSingleNonTradingApp(key, checked)}
                          >
                            {label}
                          </Checkbox>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700 mx-6" />

          {renderSection("Network to ATLAS Test Environment", TEST_ENV_ITEMS, formData.networkNonTradingApp, updateNonTradingApp)}
        </CardBody>
      </Card>

      {/* Network to GIFT Connect Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Network to GIFT Connect</h3>
        </CardHeader>
        <CardBody className="px-0 py-0">
          {renderSection("Network", GIFT_NETWORK_ITEMS, formData.networkGiftConnect, updateGiftConnect)}

          <hr className="border-gray-200 dark:border-gray-700 mx-6" />

          {renderSection("Additional Bandwidth", GIFT_BANDWIDTH_ITEMS, formData.networkGiftConnect, updateGiftConnect)}
        </CardBody>
      </Card>

      {/* Remote Hands Services Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Remote Hands Services</h3>
        </CardHeader>
        <CardBody className="px-0 py-0">
          <div className="p-6 space-y-3">
            {REMOTE_HANDS_ITEMS.map((item) => {
              const fee = getFee(String(item.field));
              const spec = getSpec(String(item.field));
              return (
                <div key={String(item.field)} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    {spec && (
                      <p className="text-sm text-gray-500 mb-1">{spec}</p>
                    )}
                    {renderFee(fee)}
                  </div>
                  <QuantityInput
                    value={(formData.remoteHandsServices[item.field] as number | null) ?? 0}
                    onChange={(val) => updateRemoteHands(item.field, val)}
                  />
                </div>
              );
            })}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Additional service request during Office Hours</p>
                <p className="text-sm text-gray-500 mb-1">From 8 am to 5 pm Singapore hours</p>
                {renderFee(getFee("remote_hands_additional_service_request_during_office_hours"))}
              </div>
              <span className="text-sm text-gray-500">(per request)</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Additional service request during Non-Office Hours</p>
                <p className="text-sm text-gray-500 mb-1">From 5 pm to 8 am Singapore hours</p>
                {renderFee(getFee("remote_hands_additional_service_request_during_non_office_hours"))}
              </div>
              <span className="text-sm text-gray-500">(per request)</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
