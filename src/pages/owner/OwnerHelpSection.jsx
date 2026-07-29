import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import "./OwnerHelpSection.css";
import DashboardLayout from "../../layouts/DashboardLayout";




const ownerFaqs = [  {
    q: "Can I edit my PG after publishing?",
    a: "Yes. You can edit PG details, rent, amenities, photos, and rules anytime from the My PGs section."
  },
  {
    q: "How do I vacate a resident?",
    a: "Go to Residents → Select the resident → Click Vacate. The bed becomes available immediately."
  },
  {
    q: "What happens if a resident leaves suddenly?",
    a: "You can vacate the resident manually. No penalties are applied from the platform side."
  },
  {
    q: "When do I receive payments?",
    a: "Payments are shown in your dashboard as per your active subscription and payment cycle."
  },
  {
    q: "Can I change rent or deposit later?",
    a: "Yes. You can update rent and deposit for future bookings anytime."
  } ];
const managerFaqs = [
  {
    q: "How do I view PG enquiries?",
    a: "Go to the Enquiries section to see leads from PG listings assigned to you."
  },
  {
    q: "Can I update enquiry status?",
    a: "Managers can mark enquiries as contacted or closed."
  },
  {
    q: "What PGs can I manage?",
    a: "You can manage only the PGs assigned to you by the owner."
  }
];

const OwnerHelpSection = ({ role = "OWNER" }) =>  {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [video1, setVideo1] = useState(null);
  const [video2, setVideo2] = useState(null);


const faqs = role === "PG_MANAGER" ? managerFaqs : ownerFaqs;

useEffect(() => {

  const sectionRole = role === "PG_MANAGER" ? "MANAGER" : "OWNER";

  api.get(`/public/ui-assets?section=${sectionRole}_HELP_VIDEO_1`)
    .then(res => {
      if (res.data?.length) {
        setVideo1(res.data[0]);
      } else {
        return api.get(`/public/ui-assets?section=OWNER_HELP_VIDEO_1`)
          .then(r => setVideo1(r.data?.[0]));
      }
    });

  api.get(`/public/ui-assets?section=${sectionRole}_HELP_VIDEO_2`)
    .then(res => {
      if (res.data?.length) {
        setVideo2(res.data[0]);
      } else {
        return api.get(`/public/ui-assets?section=OWNER_HELP_VIDEO_2`)
          .then(r => setVideo2(r.data?.[0]));
      }
    });

}, [role]);


  const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  alert("Copied to clipboard");
};

  return (
   <DashboardLayout
title="Help & Support"
subtitle={role === "MANAGER"
  ? "Guidance for managing assigned PGs"
  : "Owner guidance & tutorials"}
  headerContent={
    <>
{role === "OWNER" && (
<div className="new-owner-box">
 
</div>
)}

      <section className="support-hero">
        <div className="hero-overlay animate-fade">
          <h1>{role === "PG_MANAGER" ? "Manager Help & Support" : "Owner Help & Support"}</h1>
          <p>
{role === "PG_MANAGER"
 ? "Guidance for managing assigned PGs efficiently"
 : "Clear guidance to manage your PG business without confusion"}
</p>
        </div>
      </section>
    </>
  }
>

    <div className="owner-support">

  

      {/* VIDEOS */}
      <section className="step-video-section">

        {/* VIDEO 1 */}
        <div className="step-row animate-slide">
          <div className="step-content">
            
            <h2 className="step-title">Manage PG & Add Tenants</h2>
            <ul className="step-points">
              <li>✔ Add PG & amenities</li>
              <li>✔ Add and Manage Tenants</li>
              <li>✔ Auto-manage Rent</li>
            </ul>
          </div>

          <div className="step-video">
            {video1?.videoUrl && (
              <video controls playsInline preload="metadata">
                <source src={video1.videoUrl} type="video/mp4" />
              </video>
            )}
          </div>
        </div>

        {/* VIDEO 2 */}
        <div className="step-row reverse animate-slide">
          <div className="step-content">
           
            <h2 className="step-title">Manage Rooms & Beds</h2>
            <ul className="step-points">
              <li>✔ Add / Rooms </li>
              <li>✔ Assign beds</li>
              <li>✔ Track Rooms and Beds</li>
            </ul>
          </div>

          <div className="step-video">
            {video2?.videoUrl && (
              <video controls playsInline preload="metadata">
                <source src={video2.videoUrl} type="video/mp4" />
              </video>
            )}
          </div>
        </div>
      </section>

      {/* QUICK TIPS */}
      <section className="quick-tips">
        <h2>Quick Tips for Better Results</h2>
        <p className="tips-subtext">Simple actions that make a big impact</p>

        <div className="tips-grid">
         <div className="tip-card">
        <div className="tip-icon">
          <i className="bi bi-camera"></i>
        </div>
        <h4>Better Photos</h4>
        <p>High-quality photos increase trust & enquiries.</p>
      </div>

      <div className="tip-card">
        <div className="tip-icon">
          <i className="bi bi-door-open"></i>
        </div>
        <h4>Update Vacancies</h4>
        <p>Keep beds updated to avoid missing leads.</p>
      </div>

      <div className="tip-card">
        <div className="tip-icon">
          <i className="bi bi-lightning-charge"></i>
        </div>
        <h4>Fast Replies</h4>
        <p>Respond quickly to improve conversions.</p>
      </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
        {faqs.map((item, i) => (
          <div
            key={i}
            className={`faq-item ${openFAQ === i ? "open" : ""}`}
            onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
          >
         <div className="faq-question">
          <span className="faq-text">
            <i className="bi bi-question-circle faq-icon"></i>
            {item.q}
          </span>

          <span className="faq-arrow">
            <i className={`bi ${openFAQ === i ? "bi-dash" : "bi-plus"}`}></i>
          </span>
        </div>
            <div className="faq-answer">{item.a}</div>
          </div>
        ))}
      </section>

      {/* NEED ADMIN HELP */}
      <section className="help-section">
      <h2 className="help-title">Need Admin Help?</h2>

      <div className="help-cards">

    {/* WHATSAPP */}
    <div className="contact-box whatsapp">
      <div className="icon-circle">
        <i className="bi bi-whatsapp"></i>
      </div>

      <h5>WhatsApp</h5>

      <p
        className="contact-main contact-copy"
        onClick={() => copyToClipboard("+919637605805")}
      >
        +91 9637605805
      </p>

      <a
        href="https://wa.me/919637605805"
        target="_blank"
        rel="noopener noreferrer"
        className="contact-btn"
      >
        Chat Now
      </a>
    </div>

    {/* EMAIL */}
    <div className="contact-box email">
      <div className="icon-circle">
        <i className="bi bi-envelope"></i>
      </div>

      <h5>Email</h5>

      <p
        className="contact-main contact-copy"
        onClick={() => copyToClipboard("support@fouriseindia.com")}
      >
        support@fouriseindia.com
      </p>

      <a
        href="mailto:support@fouriseindia.com"
        className="contact-btn"
      >
        Send Email
      </a>
    </div>

    {/* CALL */}
    <div className="contact-box call">
      <div className="icon-circle">
        <i className="bi bi-telephone"></i>
      </div>

      <h5>Call Us</h5>

      <p
        className="contact-main contact-copy"
        onClick={() => copyToClipboard("9637605805")}
      >
        9637605805
      </p>

      <a
        href="tel:9637605805"
        className="contact-btn"
      >
        Call Now
      </a>
    </div>

    </div>
  </section>


    </div>
    
    </DashboardLayout>
  );
};

export default OwnerHelpSection;
