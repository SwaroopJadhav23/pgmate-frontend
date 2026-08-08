import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import DashboardLayout from "../../../layouts/DashboardLayout";
import ActiveResidents from "./ActiveResidents";
import api from "../../../api/axios";
import "./Resident.css";

const ResidentsOverview = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  const reloadLists = () => setRefreshKey((prev) => prev + 1);

  const exportTenantsExcel = async () => {
    setExporting(true);
    try {
      const [residentsRes, rentRes] = await Promise.all([
        api.get("/owner/residents"),
        api.get("/owner/rent?status=ALL"),
      ]);
      const residents = residentsRes.data || [];
      const rentRecords = rentRes.data || [];

      // sum unpaid RENT dues per resident (auto-generated monthly rent only)
      const rentDuesMap = {};
      rentRecords.forEach((rec) => {
        if ((rec.status || "").toUpperCase() !== "PAID") {
          const amount = rec.totalAmount ?? rec.rentAmount ?? 0;
          rentDuesMap[rec.residentId] = (rentDuesMap[rec.residentId] || 0) + amount;
        }
      });

      // sum unpaid MANUAL dues per resident (fetched separately per tenant)
      const manualDuesMap = {};
      await Promise.all(
        residents.map(async (r) => {
          try {
            const manualRes = await api.get(`/owner/rent/manual/resident/${r.residentId}`);
            const manualDues = manualRes.data || [];
            manualDues.forEach((m) => {
              if ((m.status || "").toUpperCase() !== "PAID") {
                const amount = m.totalAmount ?? m.rentAmount ?? 0;
                manualDuesMap[r.residentId] = (manualDuesMap[r.residentId] || 0) + amount;
              }
            });
          } catch (err) {
            console.error(`Manual dues fetch failed for ${r.residentId}`, err);
          }
        })
      );

      const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "");


      const rows = residents.map((r, i) => ({
        "S.No": i + 1,
        Name: r.name ?? "",
        Phone: r.phone ?? "",
        Email: r.email ?? "",
        "PG Name": r.pgName ?? "",
        Floor: r.floorNumber ?? "",
        Room: r.roomNumber ?? "",
        Bed: r.bedNumber ?? "",
        "Monthly Rent": r.monthlyRent ?? 0,
        Deposit: r.deposit ?? 0,
        "Total Dues": rentDuesMap[r.residentId] || 0,
        "Manual Dues": manualDuesMap[r.residentId] || 0,
        "Stay Type": r.stayType ?? (r.dailyResident ? "Daily" : "Monthly"),
        "Check-in": fmtDate(r.checkinDate),
        "Expected Checkout": fmtDate(r.expectedCheckoutDate),
        "Onboarding Paid": r.onboardingPaymentAmount ?? 0,
        "Payment Mode": r.onboardingPaymentMode ?? "",
        "Food Facility": r.foodFacility !== "Without Food" ? "With Food" : "Without Food",
        "Emergency Contact Name": r.emergencyContactName ?? "",
        "Emergency Contact": r.emergencyContact ?? "",
        "Emergency Relation": r.emergencyContactRelation ?? "",
      }));

      const headerOrder = [
        "S.No", "Name", "Phone", "Email", "PG Name", "Floor", "Room", "Bed",
        "Monthly Rent", "Deposit", "Total Dues", "Manual Dues", "Stay Type",
        "Check-in", "Expected Checkout",
        "Onboarding Paid", "Payment Mode", "Food Facility",
        "Emergency Contact Name", "Emergency Contact", "Emergency Relation",
      ];

      const ws = XLSX.utils.json_to_sheet(rows, { header: headerOrder });
      ws["!cols"] = new Array(headerOrder.length).fill({ wch: 16 });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tenants");
      XLSX.writeFile(wb, "TenantsDetails.xlsx");
    } catch (err) {
      console.error("Tenant export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout
      title="Tenants"
      subtitle="Manage Active Tenants"
      rightAction={
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="add-resident-btn add-resident-btn-outline"
            onClick={exportTenantsExcel}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "⬇ Export"}
          </button>
          <button className="add-resident-btn" onClick={() => navigate("/owner/residents/add")}>
            + Add Tenant
          </button>
        </div>
      }
    >
      <ActiveResidents
        apiPrefix="/owner/residents"
        refreshKey={refreshKey}
        onReload={reloadLists}
      />
    </DashboardLayout>
  );

};

export default ResidentsOverview;