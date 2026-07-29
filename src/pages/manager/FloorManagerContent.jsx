import { useEffect, useState } from "react";
import api from "../../api/axios";

const FloorManagerContent = ({ role = "OWNER", preselectedPgId, onCancel }) => {

  const [pgs, setPgs] = useState([]);
  const [selectedPg, setSelectedPg] = useState(preselectedPgId || "");
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(false);

  const pgEndpoint =
    role === "PG_MANAGER" ? "/manager/pg/my" : "/owner/pgs";

  const floorEndpoint =
    role === "PG_MANAGER" ? "/manager/floors" : "/owner/floors";

  /* LOAD PGs */
  useEffect(() => {
    api.get(pgEndpoint).then(res => setPgs(res.data));
  }, [pgEndpoint]);

  /* PRESELECT PG */
  useEffect(() => {
    if (preselectedPgId) setSelectedPg(preselectedPgId);
  }, [preselectedPgId]);

  /* LOAD FLOORS */
  useEffect(() => {

    if (!selectedPg) {
      setFloors([]);
      return;
    }

    setLoading(true);

    api
      .get(`${floorEndpoint}/pg/${selectedPg}`)
      .then(res => setFloors(res.data))
      .finally(() => setLoading(false));

  }, [selectedPg, floorEndpoint]);

  return (
    <>
      <select
        className="form-control mb-3"
        value={selectedPg}
        onChange={(e) => setSelectedPg(e.target.value)}
      >
        <option value="">Select PG</option>

        {pgs.map(pg => (
          <option key={pg.id} value={pg.id}>
            {pg.name} — {pg.city}
          </option>
        ))}
      </select>

      {loading && <p>Loading floors...</p>}

      {!loading && floors.length === 0 && selectedPg && (
        <p className="text-muted text-center">
          No floors found.
        </p>
      )}

      {floors.map(f => (
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

                await api.put(`${floorEndpoint}/${f.id}`, {
                  floorNumber: Number(newNumber)
                });

                const res = await api.get(`${floorEndpoint}/pg/${selectedPg}`);
                setFloors(res.data);

              }}
            >
              Edit
            </button>

            <button
              className="btn btn-sm btn-danger"
              onClick={async () => {

                if (!window.confirm("Delete this floor?")) return;

                await api.delete(`${floorEndpoint}/${f.id}`);

                const res = await api.get(`${floorEndpoint}/pg/${selectedPg}`);
                setFloors(res.data);

              }}
            >
              Delete
            </button>

          </div>

        </div>
      ))}

      <div className="mt-4 d-flex justify-content-end">
        <button className="btn btn-secondary" onClick={onCancel}>
          Close
        </button>
      </div>
    </>
  );
};

export default FloorManagerContent;