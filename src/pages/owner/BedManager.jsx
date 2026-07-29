import { useEffect, useState } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";

const BedManager = () => {
  const [pgs, setPgs] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);

  const [selectedPg, setSelectedPg] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  /* LOAD PGs */
  useEffect(() => {
    api.get("/owner/pgs")
      .then(res => setPgs(res.data))
      .catch(console.error);
  }, []);

  /* LOAD FLOORS */
  useEffect(() => {
    if (!selectedPg) {
      setFloors([]);
      setSelectedFloor("");
      return;
    }

    api.get(`/owner/floors/pg/${selectedPg}`)
      .then(res => setFloors(res.data))
      .catch(console.error);
  }, [selectedPg]);

  /* LOAD ROOMS */
  useEffect(() => {
    if (!selectedFloor) {
      setRooms([]);
      setSelectedRoom("");
      return;
    }

    api.get(`/owner/rooms?floorId=${selectedFloor}`)
      .then(res => setRooms(res.data))
      .catch(console.error);
  }, [selectedFloor]);

  /* LOAD BEDS */
  useEffect(() => {
    if (!selectedRoom) {
      setBeds([]);
      return;
    }

    api.get(`/owner/beds?roomId=${selectedRoom}`)
      .then(res => setBeds(res.data))
      .catch(console.error);
  }, [selectedRoom]);

  const occupy = async (id) => {
    await api.put(`/owner/beds/${id}/occupy`);
    reloadBeds();
  };

  const vacate = async (id) => {
    await api.put(`/owner/beds/${id}/vacate`);
    reloadBeds();
  };

  const reloadBeds = async () => {
    const res = await api.get(`/owner/beds?roomId=${selectedRoom}`);
    setBeds(res.data);
  };

  return (
    <DashboardLayout
      title="Available Beds"
      subtitle="Manage bed availability"
    >
      {/* FILTER BAR */}
      <div className="card p-3 mb-4">
        <div className="row g-2">
          <div className="col-md-4">
            <select
              className="form-control"
              value={selectedPg}
              onChange={e => setSelectedPg(e.target.value)}
            >
              <option value="">Select PG</option>
              {pgs.map(pg => (
                <option key={pg.id} value={pg.id}>{pg.name}</option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <select
              className="form-control"
              value={selectedFloor}
              onChange={e => setSelectedFloor(e.target.value)}
              disabled={!floors.length}
            >
              <option value="">Select Floor</option>
              {floors.map(f => (
                <option key={f.id} value={f.id}>
                  Floor {f.floorNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <select
              className="form-control"
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              disabled={!rooms.length}
            >
              <option value="">Select Room</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* BED LIST */}
      {beds.length === 0 && (
        <p className="text-muted">No beds found.</p>
      )}

      {beds.map(bed => (
        <div key={bed.id} className="card p-3 mb-2 d-flex justify-content-between align-items-center">
          <div>
            <strong>Bed {bed.bedNumber}</strong>
            <div className="text-muted">Status: {bed.status}</div>
          </div>

          {bed.status === "AVAILABLE" ? (
            <button className="btn btn-sm btn-danger" onClick={() => occupy(bed.id)}>
              Occupy
            </button>
          ) : (
            <button className="btn btn-sm btn-success" onClick={() => vacate(bed.id)}>
              Vacate
            </button>
          )}
        </div>
      ))}
    </DashboardLayout>
  );
};

export default BedManager;
