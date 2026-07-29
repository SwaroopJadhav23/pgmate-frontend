// import "./Footer.css";
// import { Link } from "react-router-dom";
// import { useContext } from "react";
// import { AuthContext } from "../../context/AuthContext";

// const Footer = ({ noMargin }) => {
//   const { role } = useContext(AuthContext);

//   return (
//     <footer className="pg-footer" style={noMargin ? { marginTop: 0 } : {}}>

//       <div className="pg-footer-container">

//         {/* ── BRAND ── */}
//         <div className="pg-footer-brand">
//           <img src="/logo1.png" alt="PGMate" className="pg-footer-logo" />
//           <div>
//             <p>
//               Smart PG &amp; Co-Living Management Platform helping owners
//               list, manage and grow their properties effortlessly.
//             </p>
//             <div className="pg-footer-address">
//               <strong>Corporate Office</strong>
//               <span>Pune, Maharashtra</span>
//               <span>India</span>
//             </div>
//           </div>
//         </div>

//         {/* ── COMPANY ── */}
//         <div className="pg-footer-col">
//           <h4>Company</h4>
//           <Link to="/about-us">About Us</Link>
//           <Link to="/contact-us">Contact Us</Link>
//           {role !== "USER" && <Link to="/list-your-property">List Your PG</Link>}
//           <Link to="/faq">FAQ'S</Link>
//         </div>

//         {/* ── LEGAL ── */}
//         <div className="pg-footer-col">
//           <h4>Legal</h4>
//           <Link to="/privacy-policy">Privacy Policy</Link>
//           <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
//           <Link to="/refund-policy">Refund Policy</Link>
//           <Link to="/disclaimers">Disclaimers</Link>
//         </div>

//         {/* ── CONTACT ── */}
//         <div className="pg-footer-col">
//           <h4>Contact Us</h4>
//           <div className="pg-footer-contact">
//             <span><i className="bi bi-telephone"></i>9637605805</span>
//             <span><i className="bi bi-envelope"></i> support.pgmate@gmail.com</span>
//           </div>
//           <div className="pg-footer-social">
//             <a href="https://www.facebook.com/share/1DpGx3QkGi/" target="_blank" rel="noopener noreferrer">
//               <i className="bi bi-facebook"></i>
//             </a>
//             <a href="https://www.instagram.com/pgmateofficial?igsh=MWJkYWlibms0djlyMw==" target="_blank" rel="noopener noreferrer">
//               <i className="bi bi-instagram"></i>
//             </a>

//             {/* LinkedIn */}
//             {/* <i className="bi bi-linkedin"></i> */}

//             <a href="https://youtube.com/@pgmateofficial?si=FihHFhNQsZD417Yh" target="_blank" rel="noopener noreferrer">
//               <i className="bi bi-youtube"></i>
//             </a>
//           </div>
//         </div>

//       </div>

//       {/* thin divider */}
//       <div className="pg-footer-divider"></div>

//       {/* ── BOTTOM ── */}
//       <div className="pg-footer-bottom">
//         © {new Date().getFullYear()} Fourise Software Solution Pvt Ltd.
//       </div>

//     </footer>
//   );
// };

// export default Footer;

import "./Footer.css";
import {Link} from "react-router-dom";
import {useContext} from "react";
import {AuthContext} from "../../context/AuthContext";

const Footer = ({noMargin}) => {
  const {role} = useContext(AuthContext);

  return (
    <footer className="pg-footer" style={noMargin ? {marginTop: 0} : {}}>
      <div className="pg-footer-container">
        {/* ── BRAND ── */}
        <div className="pg-footer-brand">
          <img src="/logo1.png" alt="PGMate" className="pg-footer-logo" />
          <div>
            <p>
              India's trusted platform to find, list and manage verified PGs.
            </p>
          </div>
        </div>

        {/* ── FOR TENANTS ── */}
        <div className="pg-footer-col">
          <h4>For Tenants</h4>
          <Link to="/pgs">Browse PGs</Link>
          <Link to="/cities">Cities</Link>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/contact-us">Help &amp; Support</Link>
        </div>

        {/* ── FOR OWNERS ── */}
        <div className="pg-footer-col">
          <h4>For Owners</h4>
          {role !== "USER" && (
            <Link to="/list-your-property">List Your PG</Link>
          )}
          <Link to="/list-your-property">PG Software</Link>
          <Link to="/list-your-property#lyp-features">Features</Link>
          <Link to="/list-your-property#lyp-pricing">Pricing</Link>
        </div>

        {/* ── COMPANY ── */}
        <div className="pg-footer-col">
          <h4>Company</h4>
          <Link to="/about-us">About Us</Link>
          <Link to="/contact-us">Contact Us</Link>
         {/* <Link to="/careers">Careers</Link> */}
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/faq">FAQs</Link>
        </div>

        {/* ── CONTACT ── */}
        <div className="pg-footer-col">
          <h4>Contact Us</h4>
          <div className="pg-footer-contact">
            <span>
              <i className="bi bi-telephone"></i>9637605805
            </span>
            <span>
              <i className="bi bi-envelope"></i> support.pgmate@gmail.com
            </span>
          </div>
          <div className="pg-footer-social">
            <a
              href="https://www.facebook.com/share/1DpGx3QkGi/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="bi bi-facebook"></i>
            </a>
            <a
              href="https://www.instagram.com/pgmateofficial?igsh=MWJkYWlibms0djlyMw=="
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="bi bi-instagram"></i>
            </a>
            <a
              href="https://youtube.com/@pgmateofficial?si=FihHFhNQsZD417Yh"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="bi bi-youtube"></i>
            </a>
          </div>
        </div>
      </div>

      <div className="pg-footer-divider"></div>

      <div className="pg-footer-bottom">
        © {new Date().getFullYear()} PGMate. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
