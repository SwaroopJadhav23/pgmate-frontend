// import {Link} from "react-router-dom";
// import {Check} from "lucide-react";

// const TENANT_POINTS = [
//   "Search by location, price, gender & more",
//   "Verified PGs with photos and amenities",
//   "Compare and shortlist easily",
//   "Contact owners instantly",
// ];

// const OWNER_POINTS = [
//   "Manage tenants, rooms & rent",
//   "Collect rent online & track payments",
//   "Handle complaints & maintenance",
//   "View reports and occupancy",
// ];

// const TenantIllustration = () => (
//   <svg
//     viewBox="0 0 320 280"
//     className="tos-svg"
//     xmlns="http://www.w3.org/2000/svg"
//   >
//     <defs>
//       <radialGradient id="tenantBg" cx="50%" cy="40%" r="70%">
//         <stop offset="0%" stopColor="#f5f3ff" />
//         <stop offset="100%" stopColor="#e0e7ff" />
//       </radialGradient>
//       <linearGradient id="beanbagGrad" x1="0" y1="0" x2="0" y2="1">
//         <stop offset="0%" stopColor="#a78bfa" />
//         <stop offset="100%" stopColor="#7c3aed" />
//       </linearGradient>
//       <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
//         <stop offset="0%" stopColor="#818cf8" />
//         <stop offset="100%" stopColor="#4f46e5" />
//       </linearGradient>
//       <radialGradient id="skinGrad" cx="35%" cy="30%" r="80%">
//         <stop offset="0%" stopColor="#ffe0c2" />
//         <stop offset="100%" stopColor="#f4b783" />
//       </radialGradient>
//       <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
//         <feDropShadow
//           dx="0"
//           dy="4"
//           stdDeviation="6"
//           floodColor="#4f46e5"
//           floodOpacity="0.18"
//         />
//       </filter>
//     </defs>

//     <circle cx="160" cy="140" r="125" fill="url(#tenantBg)" />

//     {/* shadow under beanbag */}
//     <ellipse cx="112" cy="252" rx="78" ry="10" fill="#c7d2fe" opacity="0.6" />

//     {/* beanbag */}
//     <path
//       d="M48 230 Q40 145 112 138 Q184 145 176 230 Q112 258 48 230 Z"
//       fill="url(#beanbagGrad)"
//       filter="url(#softShadow)"
//     />
//     <path
//       d="M70 220 Q66 160 112 155"
//       stroke="#8b5cf6"
//       strokeWidth="3"
//       fill="none"
//       opacity="0.5"
//       strokeLinecap="round"
//     />
//     <path
//       d="M154 220 Q158 160 112 155"
//       stroke="#8b5cf6"
//       strokeWidth="3"
//       fill="none"
//       opacity="0.5"
//       strokeLinecap="round"
//     />

//     {/* legs (crossed, simple) */}
//     <path
//       d="M75 205 Q100 218 130 208"
//       stroke="#4338ca"
//       strokeWidth="16"
//       strokeLinecap="round"
//       fill="none"
//       opacity="0.9"
//     />

//     {/* body */}
//     <path
//       d="M82 175 Q80 130 112 128 Q146 130 144 178 Q144 200 112 202 Q80 200 82 175Z"
//       fill="url(#bodyGrad)"
//     />

//     {/* neck */}
//     <rect x="102" y="105" width="18" height="14" rx="6" fill="#f4b783" />

//     {/* head */}
//     <circle cx="112" cy="90" r="24" fill="url(#skinGrad)" />
//     {/* hair */}
//     <path
//       d="M86 88 Q84 60 112 58 Q140 60 138 88 Q138 70 112 68 Q92 70 90 84 Q88 86 86 88Z"
//       fill="#3b2415"
//     />
//     <path d="M86 88 Q84 100 90 108 Q86 96 90 88Z" fill="#3b2415" />
//     {/* simple face */}
//     <circle cx="104" cy="90" r="2" fill="#3b2415" />
//     <circle cx="120" cy="90" r="2" fill="#3b2415" />
//     <path
//       d="M104 99 Q112 103 120 99"
//       stroke="#b5651d"
//       strokeWidth="2"
//       fill="none"
//       strokeLinecap="round"
//     />

//     {/* arm + phone */}
//     <path
//       d="M138 150 Q166 152 172 178"
//       stroke="url(#bodyGrad)"
//       strokeWidth="15"
//       strokeLinecap="round"
//       fill="none"
//     />
//     <rect
//       x="162"
//       y="170"
//       width="36"
//       height="58"
//       rx="7"
//       fill="#ffffff"
//       filter="url(#softShadow)"
//       stroke="#e0e7ff"
//       strokeWidth="1.5"
//     />
//     <rect x="167" y="177" width="26" height="12" rx="3" fill="#c7d2fe" />
//     <rect x="167" y="193" width="26" height="5" rx="2" fill="#eef2ff" />
//     <rect x="167" y="202" width="17" height="5" rx="2" fill="#eef2ff" />
//     <rect x="167" y="212" width="26" height="11" rx="4" fill="#6366f1" />

//     {/* floating verified badge */}
//     <g filter="url(#softShadow)">
//       <circle cx="240" cy="78" r="24" fill="#ffffff" />
//       <circle
//         cx="240"
//         cy="78"
//         r="24"
//         fill="none"
//         stroke="#ddd6fe"
//         strokeWidth="2"
//       />
//     </g>
//     <path
//       d="M231 78 l6 6 l13 -13"
//       stroke="#22c55e"
//       strokeWidth="3.5"
//       fill="none"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     />

//     {/* floating price chip */}
//     <g filter="url(#softShadow)">
//       <rect x="222" y="135" width="68" height="30" rx="15" fill="#ffffff" />
//       <rect
//         x="222"
//         y="135"
//         width="68"
//         height="30"
//         rx="15"
//         fill="none"
//         stroke="#ddd6fe"
//         strokeWidth="2"
//       />
//     </g>
//     <text
//       x="256"
//       y="154"
//       textAnchor="middle"
//       fontSize="12.5"
//       fontWeight="700"
//       fill="#4f46e5"
//       fontFamily="DM Sans, sans-serif"
//     >
//       ₹8,000/mo
//     </text>

//     {/* plant */}
//     <rect x="42" y="238" width="20" height="16" rx="2" fill="#f59e0b" />
//     <rect x="42" y="238" width="20" height="5" rx="2" fill="#fbbf24" />
//     <path
//       d="M52 238 Q42 215 36 220 M52 238 Q62 215 68 220 M52 238 Q52 210 52 215"
//       stroke="#16a34a"
//       strokeWidth="3.5"
//       fill="none"
//       strokeLinecap="round"
//     />
//   </svg>
// );

// const OwnerIllustration = () => (
//   <svg
//     viewBox="0 0 320 280"
//     className="tos-svg"
//     xmlns="http://www.w3.org/2000/svg"
//   >
//     <defs>
//       <radialGradient id="ownerBg" cx="50%" cy="40%" r="70%">
//         <stop offset="0%" stopColor="#fff7ed" />
//         <stop offset="100%" stopColor="#fed7aa" />
//       </radialGradient>
//       <linearGradient id="ownerBody" x1="0" y1="0" x2="1" y2="1">
//         <stop offset="0%" stopColor="#fb923c" />
//         <stop offset="100%" stopColor="#ea580c" />
//       </linearGradient>
//       <radialGradient id="skinGrad2" cx="35%" cy="30%" r="80%">
//         <stop offset="0%" stopColor="#ffe0c2" />
//         <stop offset="100%" stopColor="#f4b783" />
//       </radialGradient>
//       <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
//         <stop offset="0%" stopColor="#fdba74" />
//         <stop offset="100%" stopColor="#fb923c" />
//       </linearGradient>
//       <filter id="softShadow2" x="-30%" y="-30%" width="160%" height="160%">
//         <feDropShadow
//           dx="0"
//           dy="4"
//           stdDeviation="6"
//           floodColor="#ea580c"
//           floodOpacity="0.18"
//         />
//       </filter>
//     </defs>

//     <circle cx="160" cy="140" r="125" fill="url(#ownerBg)" />

//     {/* shadow */}
//     <ellipse cx="155" cy="252" rx="95" ry="9" fill="#fed7aa" opacity="0.7" />

//     {/* desk */}
//     <rect
//       x="45"
//       y="205"
//       width="200"
//       height="11"
//       rx="3"
//       fill="url(#deskGrad)"
//       filter="url(#softShadow2)"
//     />
//     <rect x="58" y="216" width="9" height="38" fill="#ea580c" opacity="0.85" />
//     <rect x="222" y="216" width="9" height="38" fill="#ea580c" opacity="0.85" />

//     {/* chair shadow seat */}
//     <rect
//       x="120"
//       y="225"
//       width="14"
//       height="30"
//       rx="3"
//       fill="#c2410c"
//       opacity="0.4"
//     />

//     {/* laptop */}
//     <g filter="url(#softShadow2)">
//       <rect x="100" y="165" width="96" height="60" rx="5" fill="#1e293b" />
//       <rect x="107" y="172" width="82" height="46" rx="3" fill="#eef2ff" />
//     </g>
//     <path d="M88 225 L208 225 L218 233 L78 233 Z" fill="#334155" />

//     {/* chart on screen */}
//     <rect x="118" y="198" width="9" height="18" fill="#6366f1" rx="1" />
//     <rect x="132" y="188" width="9" height="28" fill="#818cf8" rx="1" />
//     <rect x="146" y="195" width="9" height="21" fill="#6366f1" rx="1" />
//     <rect x="160" y="180" width="9" height="36" fill="#a5b4fc" rx="1" />
//     <path
//       d="M118 196 L132 186 L146 193 L160 178"
//       stroke="#ea580c"
//       strokeWidth="1.5"
//       fill="none"
//       strokeLinecap="round"
//     />

//     {/* body */}
//     <path
//       d="M118 175 Q116 132 150 130 Q184 132 182 178 Q182 200 150 202 Q118 200 118 175Z"
//       fill="url(#ownerBody)"
//     />

//     {/* neck */}
//     <rect x="140" y="108" width="18" height="14" rx="6" fill="#f4b783" />

//     {/* head */}
//     <circle cx="150" cy="92" r="24" fill="url(#skinGrad2)" />
//     {/* hair (short) */}
//     <path
//       d="M124 92 Q122 64 150 62 Q178 64 176 92 Q176 76 150 73 Q126 76 124 88Z"
//       fill="#241510"
//     />
//     {/* face */}
//     <circle cx="142" cy="92" r="2" fill="#241510" />
//     <circle cx="158" cy="92" r="2" fill="#241510" />
//     <path
//       d="M142 101 Q150 105 158 101"
//       stroke="#b5651d"
//       strokeWidth="2"
//       fill="none"
//       strokeLinecap="round"
//     />
//     {/* beard hint */}
//     <path
//       d="M134 100 Q150 116 166 100 Q166 110 150 112 Q134 110 134 100Z"
//       fill="#241510"
//       opacity="0.85"
//     />

//     {/* floating dashboard card */}
//     <g filter="url(#softShadow2)">
//       <rect x="210" y="72" width="92" height="58" rx="12" fill="#ffffff" />
//       <rect
//         x="210"
//         y="72"
//         width="92"
//         height="58"
//         rx="12"
//         fill="none"
//         stroke="#fed7aa"
//         strokeWidth="2"
//       />
//     </g>
//     <text
//       x="256"
//       y="92"
//       textAnchor="middle"
//       fontSize="8.5"
//       fontWeight="700"
//       fill="#94a3b8"
//       fontFamily="DM Sans, sans-serif"
//       letterSpacing="0.5"
//     >
//       RENT COLLECTED
//     </text>
//     <text
//       x="256"
//       y="112"
//       textAnchor="middle"
//       fontSize="15"
//       fontWeight="800"
//       fill="#ea580c"
//       fontFamily="DM Sans, sans-serif"
//     >
//       ₹2,45,000
//     </text>
//     <path
//       d="M222 120 L235 112 L248 117 L262 105 L280 110"
//       stroke="#22c55e"
//       strokeWidth="2"
//       fill="none"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     />

//     {/* occupancy badge */}
//     <g filter="url(#softShadow2)">
//       <circle cx="38" cy="105" r="27" fill="#ffffff" />
//       <circle
//         cx="38"
//         cy="105"
//         r="27"
//         fill="none"
//         stroke="#fed7aa"
//         strokeWidth="2"
//       />
//     </g>
//     <text
//       x="38"
//       y="102"
//       textAnchor="middle"
//       fontSize="14"
//       fontWeight="800"
//       fill="#ea580c"
//       fontFamily="DM Sans, sans-serif"
//     >
//       83%
//     </text>
//     <text
//       x="38"
//       y="115"
//       textAnchor="middle"
//       fontSize="7"
//       fontWeight="600"
//       fill="#94a3b8"
//       fontFamily="DM Sans, sans-serif"
//     >
//       OCCUPIED
//     </text>
//   </svg>
// );

// const TenantOwnerSplit = () => (
//   <>
//     <style>{CSS}</style>
//     <section className="tos-wrap">
//       <div className="tos-panel tos-panel--tenant">
//         <div className="tos-text">
//           <h3>For Tenants</h3>
//           <p>Find a PG that feels like home.</p>
//           <ul>
//             {TENANT_POINTS.map((pt) => (
//               <li key={pt}>
//                 <Check size={14} /> {pt}
//               </li>
//             ))}
//           </ul>
//           <Link to="/pgs" className="tos-btn">
//             Find a PG Now →
//           </Link>
//         </div>
//         <div className="tos-img">
//           <TenantIllustration />
//         </div>
//       </div>

//       <div className="tos-panel tos-panel--owner">
//         <div className="tos-text">
//           <h3>For Owners</h3>
//           <p>Manage your PG business from one place.</p>
//           <ul>
//             {OWNER_POINTS.map((pt) => (
//               <li key={pt}>
//                 <Check size={14} /> {pt}
//               </li>
//             ))}
//           </ul>
//           <Link to="/list-your-property" className="tos-btn">
//             Explore PG Software →
//           </Link>
//         </div>
//         <div className="tos-img">
//           <OwnerIllustration />
//         </div>
//       </div>
//     </section>
//   </>
// );

// export default TenantOwnerSplit;

// const CSS = `
//   .tos-wrap {
//     max-width: 1280px;
//     margin: 0 auto;
//     padding: 24px 32px 32px;
//     display: grid;
//     grid-template-columns: 1fr 1fr;
//     gap: 18px;
//   }

//   .tos-panel {
//     display: flex;
//     align-items: center;
//     gap: 20px;
//     border-radius: 20px;
//     padding: 28px;
//     background: #f8f9ff;
//     border: 1px solid #eceefa;
//   }

//   .tos-panel--owner { background: #fff7f0; border-color: #fce9d8; }

//   .tos-text { flex: 1.1; min-width: 0; }
//   .tos-text h3 { margin: 0 0 4px; font-size: 1.3rem; font-weight: 800; color: #0f172a; }
//   .tos-text > p { margin: 0 0 14px; font-size: 0.9rem; color: #64748b; }

//   .tos-text ul { list-style: none; margin: 0 0 18px; padding: 0; display: flex; flex-direction: column; gap: 8px; }
//   .tos-text li { display: flex; align-items: center; gap: 8px; font-size: 0.84rem; color: #334155; }
//   .tos-text li svg { color: #4f46e5; flex-shrink: 0; }
//   .tos-panel--owner .tos-text li svg { color: #ea580c; }

//   .tos-btn {
//     display: inline-flex; align-items: center; gap: 6px;
//     background: #6366f1; color: #fff; font-weight: 700; font-size: 0.84rem;
//     padding: 10px 18px; border-radius: 12px; text-decoration: none;
//   }

//   .tos-panel--owner .tos-btn { background: #ea580c; }

//   .tos-img { flex: 0.9; min-width: 0; }
//   .tos-svg { width: 100%; height: auto; display: block; }

//   @media (max-width: 900px) {
//     .tos-wrap { grid-template-columns: 1fr; padding: 20px 18px 24px; }
//     .tos-panel { flex-direction: column; text-align: center; }
//     .tos-text li { justify-content: center; }
//     .tos-img { max-width: 260px; margin: 0 auto; }
//   }
// `;

import {Link} from "react-router-dom";
import forTenants from "../../../assets/For_Tenants.png";
import forOwners from "../../../assets/For_Owners.png";

const TenantOwnerSplit = () => (
  <>
    <style>{CSS}</style>
    <section className="tos-wrap">
      <div className="tos-panel tos-panel--tenant">
        <img src={forTenants} alt="Find a PG that feels like home" />
        <Link to="/pgs" className="tos-btn tos-btn--tenant">
          Find a PG Now →
        </Link>
      </div>

      <div className="tos-panel tos-panel--owner">
        <img src={forOwners} alt="Manage your PG business from one place" />
        <Link to="/list-your-property" className="tos-btn tos-btn--owner">
          Explore PG Software →
        </Link>
      </div>
    </section>
  </>
);

export default TenantOwnerSplit;

const CSS = `
  .tos-wrap {
    max-width: 1600px;
    margin: 0 auto;
    padding: 24px 32px 32px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  .tos-panel {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    background: #f8f9ff;
    border: 1px solid #eceefa;
    box-shadow: 0 30px 60px rgba(15,23,42,0.35), 0 8px 16px rgba(15,23,42,0.15);
  }

  

  .tos-panel img {
    width: 100%;
    height: auto;
    display: block;
    filter: drop-shadow(0 20px 35px rgba(15,23,42,0.3));
  }

  .tos-btn {
    position: absolute;
    left: 28px;
    bottom: 28px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #fff;
    font-weight: 700;
    font-size: 0.85rem;
    padding: 11px 20px;
    border-radius: 12px;
    text-decoration: none;
    box-shadow: 0 8px 20px rgba(0,0,0,0.18);
  }

  .tos-btn--tenant { background: #6366f1; }
  .tos-btn--owner { background: #ea580c; }

  .tos-btn:hover { filter: brightness(1.08); }

  @media (max-width: 900px) {
    .tos-wrap { grid-template-columns: 1fr; padding: 20px 18px 24px; }
    .tos-btn {
      position: static;
      display: flex;
      justify-content: center;
      margin: 14px 16px 16px;
      box-shadow: none;
    }
  }
`;
