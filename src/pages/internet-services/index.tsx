import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { themeAlpine, colorSchemeDark } from "ag-grid-community";
import { useTheme } from "next-themes";
import { Button, Tooltip } from "@heroui/react";
import { ConfirmModal, AlertModal } from "atlas-shared-web/components";
import { getStatusStyle, getWithAuth, deleteWithAuth, useAuth } from "atlas-shared-web";
import { EyeIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { API_BASE } from "../../lib/config";
import { InternetServiceRes, InternetServiceType } from "../../types/internet-service";
import { useInternetServiceConfigs } from "../../hooks/useInternetServiceConfigs";

const StatusCellRenderer = (params: ICellRendererParams<InternetServiceRes>) => {
  const status = params.value as string;
  const statusKey = status || "";
  return (
    <span className={getStatusStyle(statusKey)}>
      {statusKey.replace(/_/g, " ") || "N/A"}
    </span>
  );
};

const ClientCellRenderer = (params: ICellRendererParams<InternetServiceRes>) => {
  const data = params.data;
  if (!data) return null;
  if (!data.client_name) {
    return <span className="text-gray-400">-</span>;
  }
  return <span>{data.client_name}</span>;
};

export default function InternetServicesIndex() {
  const router = useRouter();
  const { user } = useAuth();
  const isInternalUser = user?.internal ?? false;
  const configs = useInternetServiceConfigs(isInternalUser);
  const [isClient, setIsClient] = useState(false);
  const [rowData, setRowData] = useState<InternetServiceRes[]>([]);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const ServiceTypeCellRenderer = useCallback((params: ICellRendererParams<InternetServiceRes>) => {
    const serviceType = params.value as InternetServiceType;
    const def = configs.serviceTypeDefinitions[serviceType];
    return <span>{def ? `${def.label} (${def.description})` : serviceType}</span>;
  }, [configs.serviceTypeDefinitions]);

  const BandwidthCellRenderer = useCallback((params: ICellRendererParams<InternetServiceRes>) => {
    const bandwidth = params.value as string;
    return <span>{bandwidth}</span>;
  }, []);

  const handleViewInternetService = useCallback((id: string) => {
    router.push(`/internet-services/view?id=${id}`);
  }, [router]);

  const handleEditInternetService = useCallback((id: string) => {
    router.push(`/internet-services/edit?id=${id}`);
  }, [router]);

  const handleCreateInternetService = useCallback(() => {
    router.push("/internet-services/create");
  }, [router]);

  const handleDeleteInternetService = useCallback(async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const response = await deleteWithAuth(`${API_BASE}/network/internet-services/v1/${deleteId}`);
      if (response.ok) {
        setRowData((prev) => prev.filter((item) => item.internet_service_id !== deleteId));
        setDeleteId(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setDeleteId(null);
        setAlertMessage(errorData.detail || "Failed to delete draft. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      setDeleteId(null);
      setAlertMessage("Failed to delete draft. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteId]);

  useEffect(() => {
    setIsClient(true);
    fetchInternetServices();
  }, []);

  const fetchInternetServices = async () => {
    try {
      const response = await getWithAuth(`${API_BASE}/network/internet-services/v1/`);
      if (response.ok) {
        const data = await response.json();
        setRowData(data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setAlertMessage(errorData.detail || "Failed to fetch internet services.");
      }
    } catch (error) {
      console.error("Failed to fetch internet services:", error);
      setAlertMessage("Failed to fetch internet services. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const ActionsCellRenderer = useCallback((params: ICellRendererParams<InternetServiceRes>) => {
    const data = params.data;
    if (!data) return null;
    const isDraft = data.internet_service_status?.toLowerCase() === "draft";
    return (
      <div className="h-full flex items-center gap-2">
        <Tooltip content="View" delay={1000}>
          <Button isIconOnly size="sm" variant="flat" color="primary" onPress={() => handleViewInternetService(data.internet_service_id)}>
            <EyeIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
        {isDraft && (
          <>
            <Tooltip content="Edit" delay={1000}>
              <Button isIconOnly size="sm" variant="flat" color="warning" onPress={() => handleEditInternetService(data.internet_service_id)}>
                <PencilSquareIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Delete" delay={1000}>
              <Button isIconOnly size="sm" variant="flat" color="danger" onPress={() => setDeleteId(data.internet_service_id)}>
                <TrashIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
          </>
        )}
      </div>
    );
  }, [handleViewInternetService, handleEditInternetService]);

  const gridTheme = resolvedTheme === "dark" ? themeAlpine.withPart(colorSchemeDark) : themeAlpine;

  const columnDefs = useMemo<ColDef<InternetServiceRes>[]>(() => [
    { headerName: "Action", cellRenderer: ActionsCellRenderer, width: 150, minWidth: 150, maxWidth: 150, flex: 0, resizable: false, sortable: false, filter: false, cellClass: "pt-1" },
    { field: "internet_service_id", headerName: "ID", filter: true, sortable: true, width: 120 },
    { field: "internet_service_status", headerName: "Status", cellRenderer: StatusCellRenderer, filter: true, sortable: true, width: 150 },
    { field: "start_date", headerName: "Start Date", filter: true, sortable: true, width: 120 },
    { field: "rack_id", headerName: "Rack", filter: true, sortable: true, width: 120 },
    { field: "client_name", headerName: "Client", cellRenderer: ClientCellRenderer, filter: true, sortable: true, width: 200 },
    { field: "service_type", headerName: "Service Type", cellRenderer: ServiceTypeCellRenderer, filter: true, sortable: true, width: 220 },
    { field: "bandwidth", headerName: "Bandwidth", cellRenderer: BandwidthCellRenderer, filter: true, sortable: true, width: 120 },
    { field: "quantity", headerName: "Qty", filter: false, sortable: true, width: 80 },
    { field: "update_time", headerName: "Last Updated", filter: true, sortable: true, sort: "desc", width: 180, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : "" },
  ], [ActionsCellRenderer, ServiceTypeCellRenderer, BandwidthCellRenderer]);

  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 80,
    resizable: true,
  }), []);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <div className="p-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Internet Services</h1>
          <p className="text-gray-500 text-sm">Manage internet service subscriptions</p>
        </div>
        <Button color="primary" onPress={handleCreateInternetService}>
          New Internet Service Request
        </Button>
      </div>
      {isClient && (
        <div className="flex-1 overflow-hidden">
          <AgGridReact<InternetServiceRes>
            theme={gridTheme}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
            loading={loading}
            enableCellTextSelection={true}
            ensureDomOrder={true}
          />
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteInternetService}
        title="Delete draft?"
        message={`This will permanently delete draft ${deleteId}. This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="danger"
        isLoading={isDeleting}
      />
      <AlertModal
        isOpen={!!alertMessage}
        onClose={() => setAlertMessage(null)}
        title="Error"
        message={alertMessage || ""}
        buttonColor="danger"
      />
    </div>
  );
}
