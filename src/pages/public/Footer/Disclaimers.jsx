import HomeLayout from "../../../layouts/HomeLayouts";
import "./Disclaimers.css";

const Disclaimers = () => {
  return (
    <HomeLayout>

      {/* HERO */}
      <section className="disclaimer-hero">
        <div className="disclaimer-hero-overlay"></div>
        <div className="disclaimer-hero-content container">
          <h1>Disclaimer</h1>
          <p>Important information regarding the use of the PGMate platform</p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="container py-5 disclaimer-content">

        <p className="intro">
          The information provided on <strong>PGMate</strong> is intended for
          general informational and transactional purposes only. While we
          strive to keep all platform content accurate and current, PGMate
          makes no warranties regarding the completeness, reliability, or
          accuracy of any property listing, pricing, availability, or services
          displayed on the platform. Users and owners are encouraged to verify
          all details independently before making decisions.
        </p>

        <h4>1. Platform Nature</h4>
        <p>
          PGMate is a technology-driven platform that connects PG owners and
          potential residents across India. The platform enables property
          owners to list their PG accommodations and allows users to explore
          properties, submit enquiries, and reserve rooms or beds online.
          PGMate facilitates these connections but does not own, operate, or
          manage any of the properties listed on the platform.
        </p>

        <h4>2. Listing Accuracy</h4>
        <p>
          Property details such as pricing, amenities, room types, availability,
          and images are provided directly by PG owners. While PGMate encourages
          owners to maintain accurate and up-to-date listings, we do not
          independently verify every listing. PGMate cannot guarantee that all
          information displayed is fully accurate at all times and shall not be
          held responsible for discrepancies between listed and actual property
          conditions.
        </p>

        <h4>3. Reservation Disclaimer</h4>
        <p>
          PGMate provides a reservation system that allows users to reserve beds
          or rooms by paying a token amount through the platform. This reservation
          confirms the user's intent to book and temporarily secures the selected
          room or bed. However, the actual accommodation agreement, rental terms,
          house rules, and stay arrangements are governed entirely by the direct
          agreement between the resident and the PG owner. PGMate is not a party
          to any such rental or accommodation agreement.
        </p>

        <h4>4. User Responsibility</h4>
        <p>
          Users are solely responsible for independently verifying property
          details, facilities, pricing, safety standards, and accommodation rules
          before making a reservation or payment. PGMate strongly recommends that
          users visit the property in person or contact the owner directly to
          confirm all details prior to committing to a booking.
        </p>

        <h4>5. Owner Responsibility</h4>
        <p>
          PG owners are solely responsible for ensuring that all property
          information, pricing, availability status, and listed amenities are
          accurate and comply with applicable housing, safety, and local
          regulatory requirements. PGMate shall not be responsible for any
          legal or regulatory non-compliance on the part of individual property
          owners.
        </p>

        <h4>6. Subscription and Plan Services</h4>
        <p>
          PGMate offers subscription plans to PG owners that enable them to
          list and manage their properties on the platform. The availability of
          features under each plan is subject to change. PGMate does not
          guarantee uninterrupted access to any paid feature and is not liable
          for temporary unavailability due to technical maintenance or updates.
        </p>

        <h4>7. Third-Party Services</h4>
        <p>
          PGMate may include integrations with or references to third-party
          services, such as payment gateways or mapping tools. These services
          operate independently and PGMate does not control, endorse, or take
          responsibility for their content, privacy practices, or service
          availability. Users interact with third-party services at their own
          discretion.
        </p>

        <h4>8. Limitation of Liability</h4>
        <p>
          PGMate shall not be liable for any direct, indirect, incidental, or
          consequential damages arising from disputes, losses, or issues
          between PG owners and residents, including but not limited to
          accommodation quality, pricing disputes, property condition, or
          failure to honour reservations. Users and owners engage with each
          other at their own risk.
        </p>

        <h4>9. Technical Availability</h4>
        <p>
          While PGMate strives to maintain uninterrupted platform availability,
          we do not guarantee that the website or services will always be free
          from interruptions, errors, or downtime. Scheduled or emergency
          maintenance may temporarily affect access to the platform without
          prior notice.
        </p>

        <h4>10. Changes to This Disclaimer</h4>
        <p>
          PGMate reserves the right to update or modify this disclaimer at any
          time without prior notice. Continued use of the platform following
          any such changes indicates your acceptance of the revised disclaimer.
          We encourage users to review this page periodically.
        </p>

        <h4>11. Contact Information</h4>
        <p>
          For any questions or concerns related to this disclaimer, please
          contact us:
        </p>

        <div className="disclaimer-contact">
          <p><strong>Platform:</strong> PGMate</p>
          <p><strong>Email:</strong> pgmate@gmail.com</p>
          <p><strong>Phone:</strong> +91 88889 78987</p>
          <p><strong>Location:</strong> Pune, Maharashtra, India</p>
        </div>

      </section>

    </HomeLayout>
  );
};

export default Disclaimers;