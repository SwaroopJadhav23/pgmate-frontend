import HomeLayout from "../../../layouts/HomeLayouts";
import useSEO from "../../../hooks/useSEO";
import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {
  useSEO({
    title: "Privacy Policy | PGMate",
    description: "Read PGMate's Privacy Policy to understand how we collect, use, and protect your information."
  });

  return (
    <HomeLayout>
      <div className="policy-page-wrapper">
        {/* HERO */}
        <section className="policy-hero">
          <div className="policy-hero-overlay"></div>
          <div className="policy-hero-content container">
            <h1>Privacy Policy</h1>
            <p>How PGMate collects, uses, and protects your information.</p>
          </div>
        </section>

        {/* CONTENT */}
        <section className="container policy-content-section">
          <div className="policy-content-card">
            <p className="intro">
              At <strong>PGMate</strong>, we are committed to protecting your
              privacy. This Privacy Policy describes how PGMate ("we", "us", "our")
              collects, uses, and safeguards your personal information when you
              access or use our platform at <strong>https://pgmate.in/</strong>.
              By using our platform, you agree to the terms described in this
              policy. If you do not agree, please discontinue use of the platform.
            </p>

            <div className="policy-section">
              <h4>1. Information We Collect</h4>
              <p>
                We collect information you provide when you register or use PGMate,
                including your name, phone number, email address, city, and profile
                photo. For PG owners, we may also collect property details, ID proof
                documents, and payment-related information required for subscription
                plans. For residents, we collect booking and reservation details
                linked to your account.
              </p>
            </div>

            <div className="policy-section">
              <h4>2. How We Use Your Information</h4>
              <p>
                We use your information to create and manage your account, facilitate
                PG listings and reservations, process payments and subscriptions,
                send OTP verifications and important platform notifications, provide
                customer support, and improve the PGMate platform. We do not use
                your personal information for unrelated marketing purposes without
                your explicit consent.
              </p>
            </div>

            <div className="policy-section">
              <h4>3. Sharing of Information</h4>
              <p>
                PGMate does not sell your personal data to third parties. We may
                share limited information with payment gateway providers to process
                transactions, with PG owners when you submit an enquiry or
                reservation for their property, and with regulatory or law
                enforcement authorities if required by applicable law. All
                third-party partners we work with are bound by confidentiality
                obligations.
              </p>
            </div>

            <div className="policy-section">
              <h4>4. Cookies and Usage Data</h4>
              <p>
                PGMate may collect non-personal usage data such as browser type,
                pages visited, and session duration to improve platform performance.
                We may use cookies to maintain your login session and enhance your
                browsing experience. You may disable cookies in your browser
                settings, though some platform features may be affected as a result.
              </p>
            </div>

            <div className="policy-section">
              <h4>5. Data Security</h4>
              <p>
                We implement industry-standard security practices to protect your
                personal data from unauthorised access, loss, or misuse. Your account
                is protected by password authentication and OTP verification.
                Sensitive data is transmitted over encrypted (HTTPS) connections. You
                are responsible for keeping your login credentials confidential and
                not sharing them with others.
              </p>
            </div>

            <div className="policy-section">
              <h4>6. Data Retention</h4>
              <p>
                PGMate retains your personal information only for as long as
                necessary to provide our services or as required by applicable law.
                If you delete your account, your personal data will be removed from
                active systems, except where retention is required for legal,
                financial, or compliance purposes.
              </p>
            </div>

            <div className="policy-section">
              <h4>7. Your Rights</h4>
              <p>
                You have the right to access, review, and update your personal
                information through your account profile on PGMate. You may also
                request deletion of your account and associated data by contacting us
                directly. If you wish to withdraw consent for any specific data
                processing activity, please notify us in writing at the contact
                details below.
              </p>
            </div>

            <div className="policy-section">
              <h4>8. Children's Privacy</h4>
              <p>
                PGMate is not intended for use by individuals under the age of 18.
                We do not knowingly collect personal data from minors. If you believe
                a minor has provided us with personal information, please contact us
                immediately so we can take appropriate action.
              </p>
            </div>

            <div className="policy-section border-none">
              <h4>9. Changes to This Policy</h4>
              <p>
                We may update this Privacy Policy from time to time to reflect
                changes in our practices or applicable law. Any significant changes
                will be communicated through the PGMate platform. Continued use of
                PGMate after such updates constitutes your acceptance of the revised
                policy.
              </p>
            </div>
          </div>

          <div className="policy-contact-card">
            <h4>10. Contact Us</h4>
            <p>
              If you have any questions or concerns about this Privacy Policy or
              how your data is handled, please reach out to us:
            </p>
            <div className="policy-contact-details">
              <a href="/" className="contact-detail-item">
                <i className="bi bi-globe2"></i>
                <div>
                  <strong>Platform</strong>
                  <span>PGMate</span>
                </div>
              </a>
              <a href="mailto:support.pgmate@gmail.com" className="contact-detail-item">
                <i className="bi bi-envelope-fill"></i>
                <div>
                  <strong>Email</strong>
                  <span>support.pgmate@gmail.com</span>
                </div>
              </a>
              <a href="tel:+918888978987" className="contact-detail-item">
                <i className="bi bi-telephone-fill"></i>
                <div>
                  <strong>Phone</strong>
                  <span>+91 88889 78987</span>
                </div>
              </a>
              <a href="https://www.google.com/maps/search/?api=1&query=Pune,+Maharashtra,+India" target="_blank" rel="noopener noreferrer" className="contact-detail-item">
                <i className="bi bi-geo-alt-fill"></i>
                <div>
                  <strong>Location</strong>
                  <span>Pune, Maharashtra, India</span>
                </div>
              </a>
            </div>
          </div>
        </section>
      </div>
    </HomeLayout>
  );
};

export default PrivacyPolicy;