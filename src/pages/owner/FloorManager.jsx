import { useEffect, useState } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";

const FloorManager = ({ preselectedPgId }) => {

  const [pgs, setPgs] = useState([]);
const [selectedPg, setSelectedPg] = useState(preselectedPgId || "");

  const [floors, setFloors] = useState([]);
  const [floorNumber, setFloorNumber] = useState("");
  const [loading, setLoading] = useState(false);

  // Load PGs once
  useEffect(() => {
    api
      .get("/owner/pgs")
      .then((res) => setPgs(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
  if (preselectedPgId) {
    setSelectedPg(preselectedPgId);
  }
}, [preselectedPgId]);


  // Load floors when PG changes
  useEffect(() => {
    if (!selectedPg) {
      setFloors([]);
      return;
    }

    setLoading(true);
    api
      .get(`/owner/floors/pg/${selectedPg}`)
      .then((res) => setFloors(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedPg]);

  const addFloor = async () => {
    if (!floorNumber || !selectedPg) return;

    await api.post(`/owner/floors/${selectedPg}`, {
      floorNumber: Number(floorNumber),
    });

    setFloorNumber("");

    const res = await api.get(`/owner/floors/pg/${selectedPg}`);
    setFloors(res.data);
  };

  return (
    <DashboardLayout
      title="Manage Floors"
      subtitle="Create and manage floors for your PGs"
    >
      {/* PG FILTER */}
      <div className="mb-3">
        <select
          className="form-control"
          value={selectedPg}
          onChange={(e) => setSelectedPg(e.target.value)}
        >
          <option value="">Select PG</option>
          {pgs.map((pg) => (
            <option key={pg.id} value={pg.id}>
              {pg.name} — {pg.city}
            </option>
          ))}
        </select>
      </div>

      {/* ADD FLOOR */}
      {selectedPg && (
        <div className="card p-3 mb-4">
          <h6>Add Floor</h6>
          <div className="d-flex gap-2">
            <input
              type="number"
              className="form-control"
              maxLength="10"
              placeholder="Floor Number"
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
            />
            <button className="btn btn-primary" onClick={addFloor}>
              Add
            </button>
          </div>
        </div>
      )}

      {/* FLOOR LIST */}
      {loading && <p>Loading floors...</p>}

      {!loading && floors.length === 0 && selectedPg && (
        <p className="text-muted">No floors found.</p>
      )}

{floors.map((f) => (
  <div
    key={f.id}
    className="card p-3 mb-2 d-flex justify-content-between align-items-center"
  >
    <strong>Floor {f.floorNumber}</strong>

    <div className="d-flex gap-2">
      <button
        className="btn btn-sm btn-warning"
        onClick={async () => {
          const newNumber = prompt(
            "Enter new floor number",
            f.floorNumber
          );
          if (!newNumber) return;

          await api.put(`/owner/floors/${f.id}`, {
            floorNumber: Number(newNumber),
          });

          const res = await api.get(`/owner/floors/pg/${selectedPg}`);
          setFloors(res.data);
        }}
      >
        Edit
      </button>

      <button
        className="btn btn-sm btn-danger"
        onClick={async () => {
          if (!window.confirm("Delete this floor?")) return;

          try {
            await api.delete(`/owner/floors/${f.id}`);
            const res = await api.get(`/owner/floors/pg/${selectedPg}`);
            setFloors(res.data);
          } catch (err) {
            alert("Failed to delete floor");
          }
        }}
      >
        Delete
      </button>
    </div>
  </div>
))}

    </DashboardLayout>
  );
};

export default FloorManager;
