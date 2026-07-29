import { useEffect, useRef, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { digitsOnly, isValidEmail, isValidPhone } from "../../utils/formValidators";
import DashboardLayout from "../../layouts/DashboardLayout";

const EMPTY_FORM = {
  pgId: "",
  floorId: "",
  roomId: "",
  bedId: "",
  name: "",
  phone: "",
  email: "",
  monthlyRent: "",
  deposit: "",
  paymentMode: "",
  checkinDate: "",
  expectedCheckoutDate: "",
};

const PAYMENT_MODES = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Debit / Credit Card" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "WALLET", label: "Wallet (Paytm / PhonePe)" },
];

const ManageResidents = () => {
  const [residents, setResidents] = useState([]);
  const [pgs, setPgs] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [idProofFile, setIdProofFile] = useState(null);
  const [editId, setEditId] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentPreview, setPaymentPreview] = useState(null);
  const [removePaymentProof, setRemovePaymentProof] = useState(false);
  const [removeIdProof, setRemoveIdProof] = useState(false);

  const paymentFileRef = useRef(null);
  const fileRef = useRef(null);
  const [params] = useSearchParams();

  const toDateInput = (dt) => {
    if (!dt) return "";
    const d = new Date(dt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDate = (dt) => (dt ? new Date(dt).toLocaleDateString("en-GB") : "-");
  const totalPayable = Number(form.monthlyRent || 0) + Number(form.deposit || 0);

  useEffect(() => {
    if (form.paymentMode === "CASH") {
      setPaymentProofFile(null);
      setPaymentPreview(null);
      setRemovePaymentProof(true);
      if (paymentFileRef.current) paymentFileRef.current.value = "";
    }
  }, [form.paymentMode]);

  useEffect(() => {
    if (form.checkinDate) {
      const d = new Date(form.checkinDate);
      d.setMonth(d.getMonth() + 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      setForm((f) => ({ ...f, expectedCheckoutDate: `${year}-${month}-${day}` }));
    }
  }, [form.checkinDate]);

  useEffect(() => {
    loadResidents();
    api.get("/owner/pgs").then((res) => setPgs(res.data));
  }, []);

  const loadResidents = async () => {
    const res = await api.get("/owner/residents");
    setResidents(res.data);
  };

  useEffect(() => {
    const pgId = params.get("pgId");
    const floorId = params.get("floorId");
    const roomId = params.get("roomId");
    const bedId = params.get("bedId");

    if (bedId) {
      setForm((f) => ({
        ...f,
        pgId: pgId || "",
        floorId: floorId || "",
        roomId: roomId || "",
        bedId: bedId || "",
      }));
      setShowAdd(true);
    }
  }, [params]);

  useEffect(() => {
    if (form.pgId) {
      api.get(`/owner/floors/pg/${form.pgId}`).then((res) => {
        setFloors(res.data);
      });
    } else {
      setFloors([]);
      setRooms([]);
      setBeds([]);
    }
  }, [form.pgId]);

  useEffect(() => {
    if (form.floorId) {
      api.get(`/owner/rooms?floorId=${form.floorId}`).then((res) => {
        setRooms(res.data);
      });
    } else {
      setRooms([]);
      setBeds([]);
    }
  }, [form.floorId]);

  useEffect(() => {
    if (form.roomId) {
      api.get(`/owner/beds?roomId=${form.roomId}`).then((res) => {
        setBeds(res.data);
      });
    } else {
      setBeds([]);
    }
  }, [form.roomId]);

  const resolveResidentHierarchy = async (resident) => {
    const resolved = {
      pgId: resident.pgId || "",
      floorId: resident.floorId || "",
      roomId: resident.roomId || "",
      bedId: resident.bedId || "",
    };

    try {
      const matchedPg = resident.pgId
        ? pgs.find((pg) => String(pg.id) === String(resident.pgId))
        : pgs.find((pg) => pg.name === resident.pgName);

      if (matchedPg) {
        resolved.pgId = matchedPg.id;
        const floorRes = await api.get(`/owner/floors/pg/${matchedPg.id}`);
        const floorList = floorRes.data || [];
        setFloors(floorList);

        const matchedFloor = resident.floorId
          ? floorList.find((floor) => String(floor.id) === String(resident.floorId))
          : floorList.find((floor) => String(floor.floorNumber) === String(resident.floorNumber));

        if (matchedFloor) {
          resolved.floorId = matchedFloor.id;
          const roomRes = await api.get(`/owner/rooms?floorId=${matchedFloor.id}`);
          const roomList = roomRes.data || [];
          setRooms(roomList);

          const matchedRoom = resident.roomId
            ? roomList.find((room) => String(room.id) === String(resident.roomId))
            : roomList.find((room) => String(room.roomNumber) === String(resident.roomNumber));

          if (matchedRoom) {
            resolved.roomId = matchedRoom.id;
            const bedRes = await api.get(`/owner/beds?roomId=${matchedRoom.id}`);
            const bedList = bedRes.data || [];
            setBeds(bedList);

            const matchedBed = resident.bedId
              ? bedList.find((bed) => String(bed.id) === String(resident.bedId))
              : bedList.find((bed) => String(bed.bedNumber) === String(resident.bedNumber));

            if (matchedBed) {
              resolved.bedId = matchedBed.id;
            }
          }
        }
      }
    } catch {
      // Keep the edit modal usable even if hierarchy ids cannot be resolved.
    }

    return resolved;
  };

  const validateResidentForm = async ({ requireIdProof, requireHierarchy }) => {
    if (requireHierarchy && (!form.pgId || !form.floorId || !form.roomId || !form.bedId)) {
      toast("Please select PG, Floor, Room and Bed.", { icon: "⚠️" });
      return false;
    }

    if (!form.name.trim() || !form.phone || !form.monthlyRent || !form.deposit || !form.paymentMode || !form.checkinDate) {
      toast("Please fill all required resident details.", { icon: "⚠️" });
      return false;
    }

    if (!isValidPhone(form.phone)) {
      toast.error("Phone must be a valid 10-digit mobile number.");
      return false;
    }

    if (form.email.trim() && !isValidEmail(form.email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (requireIdProof && !idProofFile && !idPreview) {
      toast("Please upload the resident ID proof before saving.", { icon: "⚠️" });
      return false;
    }

    return true;
  };

  const appendResidentFormData = (fd) => {
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "") fd.append(k, v);
    });

    if (idProofFile) fd.append("idProof", idProofFile);
    if (paymentProofFile) fd.append("paymentProof", paymentProofFile);
    if (removePaymentProof) fd.append("removePaymentProof", "true");
    if (removeIdProof) fd.append("removeIdProof", "true");
  };

  const submit = async () => {
    const isValid = await validateResidentForm({ requireIdProof: true, requireHierarchy: true });
    if (!isValid) return;

    setLoading(true);
    try {
      const data = new FormData();
      appendResidentFormData(data);

      await api.post("/owner/residents", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Resident added successfully.");
      resetForm();
      loadResidents();
    } catch {
      toast.error("Could not add resident. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = async (resident) => {
    setLoading(true);
    try {
      const hierarchy = await resolveResidentHierarchy(resident);

      setEditId(resident.residentId);
      setForm({
        pgId: hierarchy.pgId,
        floorId: hierarchy.floorId,
        roomId: hierarchy.roomId,
        bedId: hierarchy.bedId,
        name: resident.name || "",
        phone: resident.phone || "",
        email: resident.email || "",
        monthlyRent: resident.monthlyRent || "",
        deposit: resident.deposit || "",
        paymentMode: resident.paymentMode || "",
        checkinDate: toDateInput(resident.checkinDate),
        expectedCheckoutDate: toDateInput(resident.expectedCheckoutDate),
      });
      setIdPreview(resident.idProofUrl || null);
      setPaymentPreview(resident.paymentProofUrl || null);
      setRemoveIdProof(false);
      setRemovePaymentProof(false);
      setShowAdd(true);
    } finally {
      setLoading(false);
    }
  };

  const submitEdit = async () => {
    const isValid = await validateResidentForm({ requireIdProof: false, requireHierarchy: false });
    if (!isValid) return;

    setLoading(true);
    try {
      const fd = new FormData();
      appendResidentFormData(fd);

      await api.put(`/owner/residents/${editId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Resident updated successfully.");
      resetForm();
      loadResidents();
    } catch {
      toast.error("Could not update resident. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkoutResident = async (id) => {
    if (!window.confirm("Checkout this resident?")) return;
    await api.put(`/owner/residents/${id}/checkout`);
    loadResidents();
  };

  const deleteResident = async (id) => {
    if (!window.confirm("Delete permanently?")) return;
    await api.delete(`/owner/residents/${id}`);
    loadResidents();
  };

  const resetForm = () => {
    setShowAdd(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setIdProofFile(null);
    setIdPreview(null);
    setRemoveIdProof(false);
    setPaymentProofFile(null);
    setPaymentPreview(null);
    setRemovePaymentProof(false);
    setFloors([]);
    setRooms([]);
    setBeds([]);
    if (paymentFileRef.current) paymentFileRef.current.value = "";
    if (fileRef.current) fileRef.current.value = "";
  };

  const filtered = residents.filter(
    (r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.phone.includes(search)
  );

  return (
    <DashboardLayout title="Manage Residents" subtitle="Active residents">
      <div className="d-flex justify-content-between mb-3">
        <input
          className="form-control w-50"
          placeholder="Search name / phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={() => setShowAdd(true)}>+ Add Resident</Button>
      </div>

      <div className="table-responsive-mobile">
        <table className="table table-hover table-bordered align-middle text-center">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>PG</th>
              <th>Floor</th>
              <th>Room</th>
              <th>Bed</th>
              <th>Rent</th>
              <th>Deposit</th>
              <th>Payment Mode</th>
              <th>Check-in</th>
              <th>Checkout</th>
              <th>Payment Proof</th>
              <th>ID Proof</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.residentId}>
                <td>{r.name}</td>
                <td>{r.phone}</td>
                <td>{r.pgName}</td>
                <td>{r.floorNumber}</td>
                <td>{r.roomNumber}</td>
                <td>Bed {r.bedNumber}</td>
                <td>{`Rs ${r.monthlyRent}`}</td>
                <td>{`Rs ${r.deposit}`}</td>
                <td>
                  {r.paymentMode ? (
                    <span className="badge bg-info text-dark">{r.paymentMode.replace("_", " ")}</span>
                  ) : (
                    "-"
                  )}
                </td>
                <td>{formatDate(r.checkinDate)}</td>
                <td>{formatDate(r.expectedCheckoutDate)}</td>
                <td>
                  {r.paymentMode?.trim().toUpperCase() === "CASH" ? (
                    <span className="badge bg-success">Made Cash <br /> Payment</span>
                  ) : r.paymentProofUrl ? (
                    <a href={r.paymentProofUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success">
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {r.idProofUrl ? (
                    <a href={r.idProofUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  <div className="d-flex gap-2 align-items-center">
                    <Button size="sm" variant="outline-primary" onClick={() => startEdit(r)}>Edit</Button>
                    <Button size="sm" variant="outline-warning" onClick={() => checkoutResident(r.residentId)}>Checkout</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => deleteResident(r.residentId)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal show={showAdd} onHide={resetForm} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editId ? "Edit Resident" : "Add Resident"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Select
              value={form.pgId}
              onChange={(e) => setForm({ ...form, pgId: e.target.value, floorId: "", roomId: "", bedId: "" })}
            >
              <option value="">Select PG</option>
              {pgs.map((pg) => (
                <option key={pg.id} value={pg.id}>{pg.name}</option>
              ))}
            </Form.Select>

            <Form.Select
              className="mt-2"
              value={form.floorId}
              onChange={(e) => setForm({ ...form, floorId: e.target.value, roomId: "", bedId: "" })}
            >
              <option value="">Select Floor</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>Floor {f.floorNumber}</option>
              ))}
            </Form.Select>

            <Form.Select
              className="mt-2"
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value, bedId: "" })}
            >
              <option value="">Select Room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.roomNumber}</option>
              ))}
            </Form.Select>

            <Form.Select
              className="mt-2"
              value={form.bedId}
              onChange={(e) => setForm({ ...form, bedId: e.target.value })}
            >
              <option value="">Select Bed</option>
              {beds.map((b) => (
                <option key={b.id} value={b.id}>{`Bed ${b.bedNumber}`}</option>
              ))}
            </Form.Select>

            <Form.Control
              className="mt-2"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.trimStart() })}
            />
            <Form.Control
              className="mt-2"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: digitsOnly(e.target.value).slice(0, 10) })}
            />
            <Form.Control
              className="mt-2"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value.trim() })}
            />
            <Form.Control
              className="mt-2"
              type="number"
              placeholder="Monthly Rent"
              value={form.monthlyRent}
              onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
            />
            <Form.Control
              className="mt-2"
              type="number"
              placeholder="Deposit"
              value={form.deposit}
              onChange={(e) => setForm({ ...form, deposit: e.target.value })}
            />

            <div className="row mt-3">
              <div className="col-md-6">
                <Form.Label>Check-in Date</Form.Label>
                <Form.Control
                  type="date"
                  value={form.checkinDate}
                  onChange={(e) => setForm({ ...form, checkinDate: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <Form.Label>Expected Checkout Date</Form.Label>
                <Form.Control
                  type="date"
                  min={form.checkinDate || undefined}
                  value={form.expectedCheckoutDate}
                  onChange={(e) => setForm({ ...form, expectedCheckoutDate: e.target.value })}
                />
              </div>
            </div>

            <Form.Group className="mt-3">
              <Form.Label>Total Payable</Form.Label>
              <Form.Control value={`Rs ${totalPayable}`} disabled />
            </Form.Group>

            <Form.Select
              className="mt-2"
              value={form.paymentMode}
              onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
            >
              <option value="">Select Payment Mode</option>
              {PAYMENT_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Form.Select>

            {form.paymentMode && form.paymentMode !== "CASH" && (
              <>
                <Form.Label className="mt-3">Upload Payment Proof</Form.Label>
                <Form.Control
                  ref={paymentFileRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setPaymentProofFile(file);
                    setRemovePaymentProof(false);
                    if (!file) {
                      setPaymentPreview(null);
                      return;
                    }
                    if (file.type.startsWith("image/")) {
                      setPaymentPreview(URL.createObjectURL(file));
                    } else {
                      setPaymentPreview(file.name);
                    }
                  }}
                />

                {paymentPreview && (
                  <div className="mt-2 position-relative d-inline-block">
                    {paymentPreview.startsWith("blob:") || paymentPreview.startsWith("http") ? (
                      <img
                        src={paymentPreview}
                        alt="Payment Preview"
                        style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" }}
                      />
                    ) : (
                      <small>{paymentPreview}</small>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-danger position-absolute top-0 end-0"
                      onClick={() => {
                        setPaymentPreview(null);
                        setPaymentProofFile(null);
                        setRemovePaymentProof(true);
                        if (paymentFileRef.current) paymentFileRef.current.value = "";
                      }}
                    >
                      x
                    </button>
                  </div>
                )}
              </>
            )}

            <Form.Label className="mt-3">Upload ID Proof {!editId && <span className="text-danger">*</span>}</Form.Label>
            <Form.Control
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files[0];
                setIdProofFile(file);
                setRemoveIdProof(false);
                if (!file) {
                  setIdPreview(null);
                  return;
                }
                if (file.type.startsWith("image/")) {
                  setIdPreview(URL.createObjectURL(file));
                } else {
                  setIdPreview(file.name);
                }
              }}
            />

            {idPreview && (
              <div className="mt-2 position-relative d-inline-block">
                {idPreview.startsWith("blob:") || idPreview.startsWith("http") ? (
                  <img
                    src={idPreview}
                    alt="ID Preview"
                    style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" }}
                  />
                ) : (
                  <small className="text-muted">Selected file: {idPreview}</small>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-danger position-absolute top-0 end-0"
                  style={{ transform: "translate(40%, -40%)" }}
                  onClick={() => {
                    setIdPreview(null);
                    setIdProofFile(null);
                    setRemoveIdProof(true);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  x
                </button>
              </div>
            )}

            {editId && <small className="text-muted d-block mt-2">You can replace the existing ID proof by uploading a new one.</small>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={resetForm} disabled={loading}>Cancel</Button>
          <Button disabled={loading} onClick={editId ? submitEdit : submit}>
            {loading ? "Saving..." : editId ? "Update" : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
};

export default ManageResidents;
