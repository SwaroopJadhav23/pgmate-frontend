import HomeLayout from "../../../layouts/HomeLayouts";
import "./RefundPolicy.css";

const RefundPolicy = () => {
  return (
    <HomeLayout>

      {/* HERO */}
      <section className="policy-hero">
        <div className="policy-hero-overlay"></div>
        <div className="policy-hero-content container">
          <h1>Refund Policy</h1>
          <p>
            Transparent refund rules for PG owners and users using PGMate
            services.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="container py-5 policy-content">

        <p className="intro">
          This Refund Policy applies to all payments made on the{" "}
          <strong>PGMate</strong> platform, including subscription plans,
          reservation tokens, and any other paid services. Please read this
          policy carefully before making any purchase.
        </p>

        {/* GENERAL */}
        <h4>1. General No-Refund Policy</h4>
        <p>
          All payments made on PGMate — including but not limited to
          subscription plan fees, reservation token amounts, sponsorship
          charges, and any other platform fees — are <strong>strictly
          non-refundable</strong>. Once a payment is processed, it cannot be
          reversed, credited back, or transferred under any circumstances.
        </p>

        {/* SUBSCRIPTIONS */}
        <h4>2. Subscription Plans</h4>
        <p>
          PG owner subscription fees are charged in advance for the selected
          billing period. No refunds or credits will be issued for:
        </p>
        <ul>
          <li>Unused days or months remaining in a subscription period.</li>
          <li>Downgrading to a lower plan mid-cycle.</li>
          <li>Account suspension or termination due to policy violations.</li>
          <li>Failure to use platform features during the active plan period.</li>
        </ul>

        {/* RESERVATION TOKENS */}
        <h4>3. Reservation Token Payments</h4>
        <p>
          Reservation token amounts paid by users to secure a PG bed are{" "}
          <strong>non-refundable</strong> under all circumstances, including:
        </p>
        <ul>
          <li>Change of mind or cancellation by the user after payment.</li>
          <li>Failure to move in on the agreed date.</li>
          <li>Discovery of an alternative accommodation.</li>
          <li>Any dispute between the user and the PG owner.</li>
        </ul>
        <p>
          PGMate acts solely as a technology platform connecting PG owners and
          users. We are not responsible for the outcome of any reservation or
          tenancy agreement between the parties.
        </p>

        {/* SPONSORSHIP */}
        <h4>4. Sponsorship &amp; Promotional Services</h4>
        <p>
          Fees paid for sponsorship or promotional listing services are
          non-refundable once the sponsorship has been activated on the
          platform, regardless of the results or bookings generated.
        </p>

        {/* EXCEPTIONS */}
        <h4>5. Exceptional Circumstances</h4>
        <p>
          PGMate may, at its sole discretion, consider a refund only in the
          following situations:
        </p>
        <ul>
          <li>
            A duplicate payment was charged due to a verified technical error
            on PGMate's payment gateway.
          </li>
          <li>
            A payment was debited but the transaction was never confirmed and
            the service was never activated.
          </li>
        </ul>
        <p>
          Such cases must be reported to our support team within{" "}
          <strong>48 hours</strong> of the transaction with supporting proof
          (bank statement / screenshot). Refunds under exceptional
          circumstances, if approved, will be processed within{" "}
          <strong>7–10 business days</strong> to the original payment method.
        </p>

        {/* CONTACT */}
        <h4>6. Contact Us</h4>
        <p>
          For any payment-related queries, please reach out to our support
          team at{" "}
          <a href="mailto:support@pgmate.in">support@pgmate.in</a>. We will
          respond within 2 business days.
        </p>

        <p style={{ marginTop: "2rem", color: "#64748b", fontSize: "0.875rem" }}>
          Last updated: April 2025. PGMate reserves the right to update this
          policy at any time. Continued use of the platform after any changes
          constitutes acceptance of the revised policy.
        </p>

      </section>

    </HomeLayout>
  );
};

export default RefundPolicy;