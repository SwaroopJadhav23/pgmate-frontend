import HomeLayout from "../../../layouts/HomeLayouts";
import "./Terms&Conditions.css";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";


const TermsAndConditions = () => {
   const location = useLocation();

 useEffect(() => {
  const scrollTo = location.state?.scrollTo;
  if (scrollTo) {
    const el = document.getElementById(scrollTo);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("highlight-section");
      setTimeout(() => el.classList.remove("highlight-section"), 2500);
    }
  }
}, [location.state]);
  return (
    <HomeLayout>

      {/* HERO */}
      <section className="terms-hero">
        <div className="terms-hero-overlay"></div>
        <div className="terms-hero-content container">
          <h1>Terms &amp; Conditions</h1>
          <p>Terms governing the use of the PGMate platform</p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="container py-5 terms-content">

        <p className="intro">
          Welcome to <strong>PGMate</strong>. These Terms &amp; Conditions
          ("Terms") govern your access to and use of the PGMate platform,
          including all features, services, and tools available through our
          website at <strong>https://pgmate.in/</strong>. By registering or
          using PGMate, you agree to be bound by these Terms. If you do not
          agree, please discontinue use of the platform immediately.
        </p>

        <h4>1. About PGMate</h4>
        <p>
          PGMate is a technology platform designed to connect PG owners and
          potential residents across India. It enables owners to list, manage,
          and promote their PG properties, and allows users to search,
          enquire, and reserve accommodation through the platform. PGMate does
          not own or operate any of the listed properties and is not a party
          to any rental agreement between owners and residents.
        </p>

        <h4>2. Eligibility</h4>
        <p>
          You must be at least 18 years of age to register and use PGMate. By
          creating an account, you confirm that the information you provide is
          accurate, complete, and up to date. PGMate reserves the right to
          suspend or terminate accounts that provide false or misleading
          information.
        </p>

        <h4>3. User Accounts</h4>
        <p>
          Each user is responsible for maintaining the confidentiality of
          their account credentials. You are fully responsible for all
          activities that occur under your account. If you suspect unauthorised
          access to your account, you must notify PGMate immediately. PGMate
          shall not be liable for any loss resulting from unauthorised use of
          your account.
        </p>

        <h4>4. PG Owner Obligations</h4>
        <p>
          PG owners who list properties on PGMate agree to provide accurate
          and up-to-date information regarding their properties, including
          pricing, room types, amenities, and availability. Owners are
          responsible for ensuring their listings comply with applicable local
          housing laws and regulations. PGMate reserves the right to remove
          listings that violate platform guidelines or applicable laws.
        </p>

        <h4>5. Resident and User Obligations</h4>
        <p>
          Users agree to use PGMate only for lawful purposes and in accordance
          with these Terms. Users must verify property details directly with
          the PG owner before making a final accommodation decision. PGMate
          does not guarantee the accuracy of listings and is not responsible
          for discrepancies between listed and actual property conditions.
        </p>

        <h4>6. Reservations and Payments</h4>
        <p>
          PGMate provides a reservation system that allows users to reserve
          beds or rooms by paying a token amount through the platform. This
          reservation confirms the user's intent and temporarily secures the
          selected accommodation. All payments made through PGMate are
          processed via authorised payment gateways. For details on
          cancellations and refunds, please refer to our{" "}
          <strong>Refund Policy</strong>.
        </p>

      <div id="auto-cancellation">
  <h4>7. Auto Cancellation Notice</h4>
  <p>Your reservation will be automatically cancelled after 7 days if the move-in is not completed.</p>
</div>

<div id="no-refund">
  <h4>8. No Cancellation Policy</h4>
  <p>Once you reserve a bed, your reservation cannot be cancelled or refunded.</p>
</div>

        <h4>9. Subscription Plans for Owners</h4>
        <p>
          PG owners are required to subscribe to an active plan on PGMate to
          list and manage their properties on the platform. Subscription fees
          are non-refundable unless stated otherwise in the Refund Policy.
          PGMate reserves the right to modify subscription plan pricing and
          features with prior notice to registered owners.
        </p>

        <h4>10. Prohibited Activities</h4>
        <p>
          Users and owners must not engage in any of the following activities
          on PGMate: posting false, misleading, or fraudulent property
          information; harassing or threatening other users; attempting to
          gain unauthorised access to any account or system; using the
          platform for any unlawful purpose; or misrepresenting your identity
          or affiliation with any organisation.
        </p>

        <h4>11. Intellectual Property</h4>
        <p>
          All content on the PGMate platform, including the logo, design,
          interface, text, and graphics, is the intellectual property of
          PGMate. You may not copy, reproduce, distribute, or create
          derivative works from any PGMate content without prior written
          permission.
        </p>

        <h4>12. Limitation of Liability</h4>
        <p>
          PGMate shall not be liable for any indirect, incidental, or
          consequential damages arising from your use of the platform,
          including disputes between PG owners and residents, inaccuracies in
          property listings, or service interruptions. PGMate's total
          liability in any matter shall not exceed the amount paid by you to
          PGMate in the preceding three months.
        </p>

        <h4>13. Termination</h4>
        <p>
          PGMate reserves the right to suspend or permanently terminate your
          account at its sole discretion if you violate these Terms, engage in
          fraudulent activity, or misuse the platform in any way. You may also
          delete your account at any time through your profile settings.
        </p>

        <h4>14. Governing Law</h4>
        <p>
          These Terms shall be governed by and construed in accordance with
          the laws of India. Any disputes arising from the use of PGMate shall
          be subject to the exclusive jurisdiction of the courts in Pune,
          Maharashtra, India.
        </p>

        <h4>15. Changes to These Terms</h4>
        <p>
          PGMate reserves the right to update or modify these Terms at any
          time. Users will be notified of significant changes through the
          platform. Continued use of PGMate after such changes constitutes
          your acceptance of the updated Terms.
        </p>

        <h4>16. Contact Us</h4>
        <p>
          For any queries regarding these Terms &amp; Conditions, please
          contact us:
        </p>

        <div className="terms-contact">
          <p><strong>Platform:</strong> PGMate</p>
          <p><strong>Email:</strong> pgmate@gmail.com</p>
          <p><strong>Phone:</strong> +91 88889 78987</p>
          <p><strong>Location:</strong> Pune, Maharashtra, India</p>
        </div>

      </section>

    </HomeLayout>
  );
};

export default TermsAndConditions;