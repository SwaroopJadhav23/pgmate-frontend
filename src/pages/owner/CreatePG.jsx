// import { useState } from "react";
// import api from "../../api/axios";
// import DashboardLayout from "../../layouts/DashboardLayout";

// const AMENITIES_LIST = [
//   "Parking", "Wifi", "Refrigerator", "Almirah", "Bed Sheet",
//   "CCTV", "House Keeping", "Pillow", "Drinking Water",
//   "Reception", "Bathroom", "Wash",
// ];

// const CreatePG = () => {
//   const [form, setForm] = useState({
//     name: "",
//     address: "",
//     city: "",
//     locality: "",
//     genderType: "MALE",
//     totalFloors: "",
//     amenities: [],
//   });

//   const [images, setImages] = useState([]);
//   const [previews, setPreviews] = useState([]);

//   const handleImages = (files) => {
//     const arr = Array.from(files);
//     setImages(arr);
//     setPreviews(arr.map(file => URL.createObjectURL(file)));
//   };

//   const submit = async () => {
//     if (!form.name || !form.city || !form.address || !form.totalFloors) {
//       alert("Fill all required fields");
//       return;
//     }

//     const data = new FormData();
//     data.append("name", form.name);
//     data.append("address", form.address);
//     data.append("city", form.city);
//     data.append("locality", form.locality);
//     data.append("genderType", form.genderType);
//     data.append("totalFloors", form.totalFloors);
//     data.append("amenities", form.amenities.join(","));

//     images.forEach(img => data.append("images", img));

//     try {
//       await api.post("/owner/pg", data);
//       alert("PG Created Successfully");
//       setForm({
//         name: "",
//         address: "",
//         city: "",
//         locality: "",
//         genderType: "MALE",
//         totalFloors: "",
//         amenities: [],
//       });
//       setImages([]);
//       setPreviews([]);
//     } catch (e) {
//       console.error(e);
//       alert("PG creation failed");
//     }
//   };

//   return (
//     <DashboardLayout title="Add PG" subtitle="Create a new PG">
//       <input
//         className="form-control mb-2"
//         placeholder="PG Name"
//         value={form.name}
//         onChange={e => setForm({ ...form, name: e.target.value })}
//       />

//       <input
//         className="form-control mb-2"
//         placeholder="City"
//         value={form.city}
//         onChange={e => setForm({ ...form, city: e.target.value })}
//       />

//       <input
//         className="form-control mb-2"
//         placeholder="Locality"
//         value={form.locality}
//         onChange={e => setForm({ ...form, locality: e.target.value })}
//       />

//       <textarea
//         className="form-control mb-2"
//         placeholder="Full Address"
//         value={form.address}
//         onChange={e => setForm({ ...form, address: e.target.value })}
//       />

//       <select
//         className="form-control mb-2"
//         value={form.genderType}
//         onChange={e => setForm({ ...form, genderType: e.target.value })}
//       >
//         <option value="MALE">MALE</option>
//         <option value="FEMALE">FEMALE</option>
//         <option value="UNISEX">UNISEX</option>
//       </select>

//       <input
//         type="number"
//         min="1"
//         className="form-control mb-2"
//         placeholder="Total Floors"
//         value={form.totalFloors}
//         onChange={e => setForm({ ...form, totalFloors: e.target.value })}
//       />

//       {/* Amenities */}
//       <div className="mb-3">
//         <label className="fw-bold">Amenities</label>
//         <div className="d-flex flex-wrap gap-2 mt-2">
//           {AMENITIES_LIST.map(a => (
//             <label key={a} className="border rounded px-3 py-1">
//               <input
//                 type="checkbox"
//                 className="me-2"
//                 checked={form.amenities.includes(a)}
//                 onChange={e => {
//                   const updated = e.target.checked
//                     ? [...form.amenities, a]
//                     : form.amenities.filter(x => x !== a);
//                   setForm({ ...form, amenities: updated });
//                 }}
//               />
//               {a}
//             </label>
//           ))}
//         </div>
//       </div>

//       {/* Images */}
//       <input
//         type="file"
//         multiple
//         accept="image/*"
//         className="form-control mb-3"
//         onChange={e => handleImages(e.target.files)}
//       />

//       {/* Image Preview */}
//       <div className="d-flex gap-2 flex-wrap mb-3">
//         {previews.map((src, i) => (
//           <img
//             key={i}
//             src={src}
//             alt="preview"
//             style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }}
//           />
//         ))}
//       </div>

//       <button className="btn btn-primary" onClick={submit}>
//         Add PG
//       </button>
//     </DashboardLayout>
//   );
// };

// export default CreatePG;
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import CreatePGForm from "../../components/CreatePGForm";

const CreatePG = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Add New PG" subtitle="Create a new property listing">
      <CreatePGForm
        onSuccess={() => navigate("/owner/pgs")}
        onCancel={() => navigate("/owner/pgs")}
      />
    </DashboardLayout>
  );
};

export default CreatePG;