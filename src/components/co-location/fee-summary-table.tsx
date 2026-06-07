import React from "react";
import { Button, Tooltip } from "@heroui/react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { CoLocationRackSpecs, NetworkTradingApp, NetworkNonTradingApp, NetworkGiftConnect, RemoteHandsServices } from "../../types/co-location";
import { RackForm } from "../../types/rack";
import { ColocationConfigs } from "../../hooks/useColocationConfigs";

interface ReviewItem<T> {
  field: keyof T;
  title: string;
}

const TRADING_ITEMS: ReviewItem<NetworkTradingApp>[] = [
  { field: "dedicated_multicast_market_data_fiber", title: "Dedicated Multicast Market Data" },
  { field: "trading_and_market_data_fiber", title: "Trading and Market Data - 10 GB" },
  { field: "trading_and_market_data_fiber_handoff", title: "Trading and Market Data" },
];

const NON_TRADING_ITEMS: ReviewItem<NetworkNonTradingApp>[] = [
  { field: "all_non_trading_apps_fiber_handoff", title: "All Non-Trading Applications including Backoffice Services" },
  { field: "single_non_trading_apps_fiber_handoff", title: "Single Non-Trading Application" },
  { field: "test_env_fiber_handoff", title: "Test Environment" },
];

const GIFT_ITEMS: ReviewItem<NetworkGiftConnect>[] = [
  { field: "gift_connect_or_colo_rack_in_nse_ifsc_fiber_handoff", title: "GIFT Connect System/Co-Lo rack in NSE IFSC" },
  { field: "gift_connect_mtbt_over_wan_feed_from_atlas_colo_rack_fiber_handoff", title: "GIFT Connect MTBT over WAN feed from ATLAS Co-Location rack" },
  { field: "gift_connect_additional_1_mbps_of_intl_bandwidth_to_gift_system", title: "Additional 1 Mbps of international bandwidth to GIFT Connect System" },
  { field: "gift_connect_additional_1_mbps_of_intl_bandwidth_to_gift_colo_rack", title: "Additional 1 Mbps of international bandwidth to GIFT Connect co-location rack." },
];

const REMOTE_HANDS_ITEMS: ReviewItem<RemoteHandsServices>[] = [
  { field: "remote_hands_monthly_subscription_bundle_per_hour", title: "Monthly subscription bundle per 1 hour service request" },
];

interface FeeSummaryTableProps {
  rackSpecs: CoLocationRackSpecs;
  networkTradingApp: NetworkTradingApp;
  networkNonTradingApp: NetworkNonTradingApp;
  networkGiftConnect: NetworkGiftConnect;
  remoteHandsServices: RemoteHandsServices;
  configs: ColocationConfigs;
  onEditStep?: (step: number) => void;
}

export default function FeeSummaryTable({
  rackSpecs,
  networkTradingApp,
  networkNonTradingApp,
  networkGiftConnect,
  remoteHandsServices,
  configs,
  onEditStep,
}: FeeSummaryTableProps) {
  // Get fee for a colocation field
  const getColocationFee = (fieldName: string) => {
    const monthlyKey = `MONTHLY@${fieldName}`;
    const onetimeKey = `ONETIME@${fieldName}`;
    return {
      monthly: configs.prices[monthlyKey] ? Number(configs.prices[monthlyKey]) : 0,
      onetime: configs.prices[onetimeKey] ? Number(configs.prices[onetimeKey]) : 0,
    };
  };

  // Get fee for a rack tier+type+power combination
  const getRackFee = (tier: string, type: string, power: string) => {
    const monthlyKey = `MONTHLY@${tier}@${type}@${power}`;
    const onetimeKey = `ONETIME@${tier}@${type}`;
    return {
      monthly: configs.rackPrices[monthlyKey] ? Number(configs.rackPrices[monthlyKey]) : 0,
      onetime: configs.rackPrices[onetimeKey] ? Number(configs.rackPrices[onetimeKey]) : 0,
    };
  };

  // Get fee for add-on (800mm width) - uses tier and type
  const getAddOnFee = (tier: string, type: string, fieldName: string) => {
    const monthlyKey = `MONTHLY@${tier}@${type}@${fieldName}`;
    const onetimeKey = `ONETIME@${tier}@${type}@${fieldName}`;
    return {
      monthly: configs.rackPrices[monthlyKey] ? Number(configs.rackPrices[monthlyKey]) : 0,
      onetime: configs.rackPrices[onetimeKey] ? Number(configs.rackPrices[onetimeKey]) : 0,
    };
  };

  // Get fee for reserve options - simple key
  const getReserveFee = (fieldName: string) => {
    const monthlyKey = `MONTHLY@${fieldName}`;
    return {
      monthly: configs.rackPrices[monthlyKey] ? Number(configs.rackPrices[monthlyKey]) : 0,
      onetime: 0,
    };
  };

  // Generic function to get selected items
  const getSelectedItems = <T extends object>(items: ReviewItem<T>[], data: T) => {
    return items.filter(item => ((data[item.field] as number | null) ?? 0) > 0);
  };

  // Generic function to calculate totals using API prices
  const calculateTotal = <T extends object>(items: ReviewItem<T>[], data: T) => {
    let totalMonthly = 0;
    let totalOneTime = 0;
    items.forEach(item => {
      const qty = (data[item.field] as number | null) ?? 0;
      if (qty > 0) {
        const fee = getColocationFee(String(item.field));
        totalMonthly += fee.monthly * qty;
        totalOneTime += fee.onetime * qty;
      }
    });
    return { totalMonthly, totalOneTime };
  };

  // Calculate rack specification totals
  const calculateRackTotals = () => {
    let totalMonthly = 0;
    let totalOneTime = 0;

    rackSpecs.racks.forEach((rack: RackForm) => {
      const fee = getRackFee(rack.rack_tier, rack.rack_type, rack.power);
      totalMonthly += fee.monthly;
      totalOneTime += fee.onetime;

      if (rack.is_800mm_width_full_rack) {
        const addOnFee = getAddOnFee(rack.rack_tier, rack.rack_type, "is_800mm_width_full_rack");
        totalMonthly += addOnFee.monthly;
        totalOneTime += addOnFee.onetime;
      }

      const reserveStandard = rack.reserve_standard_full_rack ?? 0;
      if (reserveStandard > 0) {
        const reserveFee = getReserveFee("reserve_standard_full_rack");
        totalMonthly += reserveFee.monthly * reserveStandard;
      }

      const reserve800mm = rack.reserve_800mm_full_rack ?? 0;
      if (reserve800mm > 0) {
        const reserveFee = getReserveFee("reserve_800mm_full_rack");
        totalMonthly += reserveFee.monthly * reserve800mm;
      }
    });

    const subscriberQty = rackSpecs.subscriber_customers ?? 0;
    if (subscriberQty > 0) {
      const fee = getColocationFee("subscriber_customers");
      totalMonthly += fee.monthly * subscriberQty;
      totalOneTime += fee.onetime * subscriberQty;
    }

    return { totalMonthly, totalOneTime };
  };

  // Get selected items for each section
  const selectedTradingItems = getSelectedItems(TRADING_ITEMS, networkTradingApp);
  const selectedNonTradingItems = getSelectedItems(NON_TRADING_ITEMS, networkNonTradingApp);
  const selectedGiftItems = getSelectedItems(GIFT_ITEMS, networkGiftConnect);
  const selectedRemoteHandsItems = getSelectedItems(REMOTE_HANDS_ITEMS, remoteHandsServices);

  // Calculate totals
  const rackTotals = calculateRackTotals();
  const tradingTotals = calculateTotal(TRADING_ITEMS, networkTradingApp);
  const nonTradingTotals = calculateTotal(NON_TRADING_ITEMS, networkNonTradingApp);
  const atlasTotals = {
    totalMonthly: tradingTotals.totalMonthly + nonTradingTotals.totalMonthly,
    totalOneTime: tradingTotals.totalOneTime + nonTradingTotals.totalOneTime,
  };
  const giftTotals = calculateTotal(GIFT_ITEMS, networkGiftConnect);
  const remoteHandsTotals = calculateTotal(REMOTE_HANDS_ITEMS, remoteHandsServices);

  const grandTotal = {
    totalMonthly: rackTotals.totalMonthly + atlasTotals.totalMonthly + giftTotals.totalMonthly + remoteHandsTotals.totalMonthly,
    totalOneTime: rackTotals.totalOneTime + atlasTotals.totalOneTime + giftTotals.totalOneTime + remoteHandsTotals.totalOneTime,
  };

  const hasRackItems = rackSpecs.racks.length > 0 || (rackSpecs.subscriber_customers ?? 0) > 0;

  let rowNum = 0;

  const renderEditButton = (step: number) => {
    if (!onEditStep) return null;
    return (
      <Tooltip content="Edit">
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          color="warning"
          onPress={() => onEditStep(step)}
        >
          <PencilSquareIcon className="w-3.5 h-3.5" />
        </Button>
      </Tooltip>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="py-3 px-4 text-center font-medium text-gray-600 dark:text-gray-400 w-12">SN</th>
            <th className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-400">Specification</th>
            <th className="py-3 px-4 text-right font-medium text-gray-600 dark:text-gray-400 w-24">Quantity</th>
            <th className="py-3 px-4 text-right font-medium text-gray-600 dark:text-gray-400 w-40">Monthly Fee</th>
            <th className="py-3 px-4 text-right font-medium text-gray-600 dark:text-gray-400 w-40">One-time Fee</th>
          </tr>
        </thead>
        <tbody>
          {/* Rack Specification Section */}
          {hasRackItems && (
            <>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <td className="py-3 px-4 text-center">{renderEditButton(1)}</td>
                <td className="py-3 px-4 font-semibold">Rack Specification</td>
                <td className="py-3 px-4 text-right font-semibold"></td>
                <td className="py-3 px-4 text-right font-semibold">{rackTotals.totalMonthly > 0 ? `SGD ${rackTotals.totalMonthly.toLocaleString()}` : "—"}</td>
                <td className="py-3 px-4 text-right font-semibold">{rackTotals.totalOneTime > 0 ? `SGD ${rackTotals.totalOneTime.toLocaleString()}` : "—"}</td>
              </tr>
              {rackSpecs.racks.map((rack: RackForm, index: number) => {
                const fee = getRackFee(rack.rack_tier, rack.rack_type, rack.power);
                const tierLabel = configs.rackTierOptions[rack.rack_tier] || rack.rack_tier;
                const typeLabel = rack.rack_type === "Full_Rack" ? "Full Rack" : "Half Rack";
                const powerLabel = configs.rackPowerOptions[rack.power] || rack.power;
                const spec = `${tierLabel} ${typeLabel} with ${powerLabel}`;
                const rows = [];

                rowNum++;
                rows.push(
                  <tr key={`rack-${index}`} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-center text-gray-500">{rowNum}</td>
                    <td className="py-3 px-4">{spec}</td>
                    <td className="py-3 px-4 text-right">1</td>
                    <td className="py-3 px-4 text-right">{fee.monthly > 0 ? `SGD ${fee.monthly.toLocaleString()}` : "—"}</td>
                    <td className="py-3 px-4 text-right">{fee.onetime > 0 ? `SGD ${fee.onetime.toLocaleString()}` : "—"}</td>
                  </tr>
                );

                if (rack.is_800mm_width_full_rack) {
                  rowNum++;
                  const addOnFee = getAddOnFee(rack.rack_tier, rack.rack_type, "is_800mm_width_full_rack");
                  rows.push(
                    <tr key={`rack-${index}-addon`} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4 text-center text-gray-500">{rowNum}</td>
                      <td className="py-3 px-4 pl-8">Add on: Upgrade Standard Full Rack to 800mm Width</td>
                      <td className="py-3 px-4 text-right">1</td>
                      <td className="py-3 px-4 text-right">{addOnFee.monthly > 0 ? `SGD ${addOnFee.monthly.toLocaleString()}` : "—"}</td>
                      <td className="py-3 px-4 text-right">{addOnFee.onetime > 0 ? `SGD ${addOnFee.onetime.toLocaleString()}` : "—"}</td>
                    </tr>
                  );
                }

                const reserveStandard = rack.reserve_standard_full_rack ?? 0;
                if (reserveStandard > 0) {
                  rowNum++;
                  const reserveFee = getReserveFee("reserve_standard_full_rack");
                  rows.push(
                    <tr key={`rack-${index}-reserve-std`} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4 text-center text-gray-500">{rowNum}</td>
                      <td className="py-3 px-4 pl-8">Reserve Standard Full Rack next to existing Subscriber Rack</td>
                      <td className="py-3 px-4 text-right">{reserveStandard}</td>
                      <td className="py-3 px-4 text-right">{reserveFee.monthly > 0 ? `SGD ${(reserveFee.monthly * reserveStandard).toLocaleString()}` : "—"}</td>
                      <td className="py-3 px-4 text-right">—</td>
                    </tr>
                  );
                }

                const reserve800mm = rack.reserve_800mm_full_rack ?? 0;
                if (reserve800mm > 0) {
                  rowNum++;
                  const reserveFee = getReserveFee("reserve_800mm_full_rack");
                  rows.push(
                    <tr key={`rack-${index}-reserve-800`} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4 text-center text-gray-500">{rowNum}</td>
                      <td className="py-3 px-4 pl-8">Reserve 800mm Full Rack next to existing Subscriber Rack</td>
                      <td className="py-3 px-4 text-right">{reserve800mm}</td>
                      <td className="py-3 px-4 text-right">{reserveFee.monthly > 0 ? `SGD ${(reserveFee.monthly * reserve800mm).toLocaleString()}` : "—"}</td>
                      <td className="py-3 px-4 text-right">—</td>
                    </tr>
                  );
                }

                return rows;
              })}
              {(rackSpecs.subscriber_customers ?? 0) > 0 && (() => {
                rowNum++;
                const qty = rackSpecs.subscriber_customers ?? 0;
                const fee = getColocationFee("subscriber_customers");
                return (
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-center text-gray-500">{rowNum}</td>
                    <td className="py-3 px-4">Subscriber Racks utilised by Subscriber Customers</td>
                    <td className="py-3 px-4 text-right">{qty}</td>
                    <td className="py-3 px-4 text-right">{fee.monthly > 0 ? `SGD ${(fee.monthly * qty).toLocaleString()}` : "—"}</td>
                    <td className="py-3 px-4 text-right">{fee.onetime > 0 ? `SGD ${(fee.onetime * qty).toLocaleString()}` : "—"}</td>
                  </tr>
                );
              })()}
            </>
          )}

          {/* Network to ATLAS Section */}
          {(selectedTradingItems.length > 0 || selectedNonTradingItems.length > 0) && (
            <>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <td className="py-3 px-4 text-center">{renderEditButton(2)}</td>
                <td className="py-3 px-4 font-semibold">Network to ATLAS</td>
                <td className="py-3 px-4 text-right font-semibold"></td>
                <td className="py-3 px-4 text-right font-semibold">{atlasTotals.totalMonthly > 0 ? `SGD ${atlasTotals.totalMonthly.toLocaleString()}` : "—"}</td>
                <td className="py-3 px-4 text-right font-semibold">{atlasTotals.totalOneTime > 0 ? `SGD ${atlasTotals.totalOneTime.toLocaleString()}` : "—"}</td>
              </tr>
              {selectedTradingItems.map((item) => {
                rowNum++;
                const qty = (networkTradingApp[item.field] as number | null) ?? 0;
                const fee = getColocationFee(String(item.field));
                const spec = configs.specs[String(item.field)];
                return (
                  <tr key={String(item.field)} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-center text-gray-500">{rowNum}</td>
                    <td className="py-3 px-4">
                      {item.title}
                      {spec && <p className="text-sm text-gray-500 mt-1">{spec}</p>}
                    </td>
                    <td className="py-3 px-4 text-right">{qty}</td>
                    <td className="py-3 px-4 text-right">{fee.monthly > 0 ? `SGD ${(fee.monthly * qty).toLocaleString()}` : "—"}</td>
                    <td className="py-3 px-4 text-right">{fee.onetime > 0 ? `SGD ${(fee.onetime * qty).toLocaleString()}` : "—"}</td>
                  </tr>
                );
              })}
              {selectedNonTradingItems.map((item) => {
                rowNum++;
                const qty = (networkNonTradingApp[item.field] as number | null) ?? 0;
                const fee = getColocationFee(String(item.field));
                const spec = configs.specs[String(item.field)];
                const isSingleNonTrading = item.field === "single_non_trading_apps_fiber_handoff";
                const selectedApps = networkNonTradingApp.single_non_trading_apps || [];
                return (
                  <tr key={String(item.field)} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-center text-gray-500">{rowNum}</td>
                    <td className="py-3 px-4">
                      {item.title}
                      {spec && <p className="text-sm text-gray-500 mt-1">{spec}</p>}
                      {isSingleNonTrading && selectedApps.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedApps.map(key => configs.nonTradingApps[key] || key).join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">{qty}</td>
                    <td className="py-3 px-4 text-right">{fee.monthly > 0 ? `SGD ${(fee.monthly * qty).toLocaleString()}` : "—"}</td>
                    <td className="py-3 px-4 text-right">{fee.onetime > 0 ? `SGD ${(fee.onetime * qty).toLocaleString()}` : "—"}</td>
                  </tr>
                );
              })}
            </>
          )}

          {/* Network to GIFT Connect Section */}
          {selectedGiftItems.length > 0 && (
            <>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <td className="py-3 px-4 text-center">{renderEditButton(2)}</td>
                <td className="py-3 px-4 font-semibold">Network to GIFT Connect</td>
                <td className="py-3 px-4 text-right font-semibold"></td>
                <td className="py-3 px-4 text-right font-semibold">{giftTotals.totalMonthly > 0 ? `SGD ${giftTotals.totalMonthly.toLocaleString()}` : "—"}</td>
                <td className="py-3 px-4 text-right font-semibold">{giftTotals.totalOneTime > 0 ? `SGD ${giftTotals.totalOneTime.toLocaleString()}` : "—"}</td>
              </tr>
              {selectedGiftItems.map((item) => {
                rowNum++;
                const qty = (networkGiftConnect[item.field] as number | null) ?? 0;
                const fee = getColocationFee(String(item.field));
                const spec = configs.specs[String(item.field)];
                return (
                  <tr key={String(item.field)} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-center text-gray-500">{rowNum}</td>
                    <td className="py-3 px-4">
                      {item.title}
                      {spec && <p className="text-sm text-gray-500 mt-1">{spec}</p>}
                    </td>
                    <td className="py-3 px-4 text-right">{qty}</td>
                    <td className="py-3 px-4 text-right">{fee.monthly > 0 ? `SGD ${(fee.monthly * qty).toLocaleString()}` : "—"}</td>
                    <td className="py-3 px-4 text-right">{fee.onetime > 0 ? `SGD ${(fee.onetime * qty).toLocaleString()}` : "—"}</td>
                  </tr>
                );
              })}
            </>
          )}

          {/* Remote Hands Services Section */}
          {selectedRemoteHandsItems.length > 0 && (
            <>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <td className="py-3 px-4 text-center">{renderEditButton(2)}</td>
                <td className="py-3 px-4 font-semibold">Remote Hands Services</td>
                <td className="py-3 px-4 text-right font-semibold"></td>
                <td className="py-3 px-4 text-right font-semibold">{remoteHandsTotals.totalMonthly > 0 ? `SGD ${remoteHandsTotals.totalMonthly.toLocaleString()}` : "—"}</td>
                <td className="py-3 px-4 text-right font-semibold">{remoteHandsTotals.totalOneTime > 0 ? `SGD ${remoteHandsTotals.totalOneTime.toLocaleString()}` : "—"}</td>
              </tr>
              {selectedRemoteHandsItems.map((item) => {
                rowNum++;
                const qty = (remoteHandsServices[item.field] as number | null) ?? 0;
                const fee = getColocationFee(String(item.field));
                return (
                  <tr key={String(item.field)} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-center text-gray-500">{rowNum}</td>
                    <td className="py-3 px-4">{item.title}</td>
                    <td className="py-3 px-4 text-right">{qty}</td>
                    <td className="py-3 px-4 text-right">{fee.monthly > 0 ? `SGD ${(fee.monthly * qty).toLocaleString()}` : "—"}</td>
                    <td className="py-3 px-4 text-right">{fee.onetime > 0 ? `SGD ${(fee.onetime * qty).toLocaleString()}` : "—"}</td>
                  </tr>
                );
              })}
            </>
          )}

          {/* Grand Total Row */}
          <tr className="bg-gray-100 dark:bg-gray-700 font-semibold">
            <td className="py-3 px-4"></td>
            <td className="py-3 px-4"></td>
            <td className="py-3 px-4 text-right"></td>
            <td className="py-3 px-4 text-right">
              <div className="text-lg">{grandTotal.totalMonthly > 0 ? `SGD ${grandTotal.totalMonthly.toLocaleString()}` : "—"}</div>
              <div className="text-xs font-normal text-gray-500">Total Monthly Fee</div>
            </td>
            <td className="py-3 px-4 text-right">
              <div className="text-lg">{grandTotal.totalOneTime > 0 ? `SGD ${grandTotal.totalOneTime.toLocaleString()}` : "—"}</div>
              <div className="text-xs font-normal text-gray-500">Total One-time Fee</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
