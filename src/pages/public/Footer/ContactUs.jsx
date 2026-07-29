import { useState, useEffect } from "react";
import HomeLayout from "../../../layouts/HomeLayouts";
import needHelpImg from "../../../assets/Needhelp.jpeg";
import ContactBanner from "../../../assets/ContactBanner.png";
import "./ContactUs.css";
import ApkDownloadModal from "../../../components/ApkModal";
import api from "../../../api/axios";

const faqs = [
  { q: "How do I list my PG on PGMate?", a: "Sign up as an owner, click 'List Your PG', and fill in your property details. Our team verifies and publishes it within 24 hours." },
  { q: "How much does PGMate cost?", a: "We offer flexible plans based on the number of properties and features you need. Check our Pricing page for details." },
  { q: "Can I get a demo before purchasing?", a: "Yes! Click 'Book a Demo' above and our team will walk you through the platform live." },
  { q: "How long does onboarding take?", a: "Most owners are fully onboarded within 1-2 business days." },
  { q: "How do I contact support?", a: "Use WhatsApp, email, or call us using the options above — we usually respond within 24 hours." },
  { q: "Is my data secure with PGMate?", a: "Yes, we use industry-standard encryption and never share your data with third parties." },
];

const FaqIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="115" rx="45" ry="8" fill="#ede9fe"/>
    <circle cx="55" cy="70" r="42" fill="#f2effe"/>
    <path d="M18 26 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" fill="#a78bfa" opacity="0.9"/>
    <rect x="34" y="30" width="62" height="86" rx="8" fill="#ffffff" stroke="#7c3aed" strokeWidth="3"/>
    <text x="65" y="66" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="800" fill="#7c3aed" textAnchor="middle">FAQ</text>
    <rect x="46" y="80" width="38" height="4" rx="2" fill="#ddd6fe"/>
    <rect x="46" y="92" width="30" height="4" rx="2" fill="#ddd6fe"/>
    <rect x="46" y="104" width="22" height="4" rx="2" fill="#ddd6fe"/>
    <circle cx="98" cy="96" r="24" fill="#7c3aed"/>
    <text x="98" y="105" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="700" fill="#ffffff" textAnchor="middle">?</text>
  </svg>
);

const ContactUs = () => {
  const [showApkModal, setShowApkModal] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setShowApkModal(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      // keep digits only, cut at 10
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setForm({ ...form, phone: digitsOnly });
      setPhoneError(
        digitsOnly.length > 0 && digitsOnly.length < 10
          ? "Phone number must be exactly 10 digits"
          : ""
      );
      return;
    }

    if (name === "email") {
      setEmailError("");
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.phone && form.phone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    // Send data to admin only — no mailto/email client popup
    try {
      await api.post("/contact", form);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      setPhoneError("");
      setEmailError("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save contact message:", err);
      setSubmitError("Something went wrong. Please try again.");
    }

    setSubmitting(false);
  };

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  const whatsappLink = "https://wa.me/919637605805";

  return (
    <HomeLayout>
      <ApkDownloadModal show={showApkModal} setShow={setShowApkModal} />
      <div className="contact-page">

        {/* ===== HERO ===== */}
        <section className="contact-hero">
          <img src={ContactBanner} alt="Get in touch banner" className="contact-hero-bg" />
          <div className="contact-hero-overlay">
            <div className="hero-actions">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hero-btn hero-btn-primary">
                <i className="bi bi-whatsapp"></i> Talk on WhatsApp
              </a>
              <a href="#message-form" className="hero-btn hero-btn-secondary">
                <i className="bi bi-calendar-check"></i> Book a Demo
              </a>
            </div>
          </div>
        </section>

        {/* ===== CONTACT CARDS ===== */}
        <section className="container contact-cards-section">
          <div className="contact-grid">

            <div className="contact-box whatsapp">
              <div className="contact-box-header">
                <div className="icon-circle"><i className="bi bi-whatsapp"></i></div>
                <div>
                  <h5>WhatsApp</h5>
                  <p className="contact-desc">Chat instantly with our team</p>
                </div>
              </div>
              <p className="contact-main">+91 96376 05805</p>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="contact-btn">
                Start Chat <i className="bi bi-arrow-right"></i>
              </a>
              <div className="contact-divider"></div>
              <p className="contact-avail"><i className="bi bi-clock"></i> Available <strong>9 AM – 8 PM</strong></p>
            </div>

            <div className="contact-box email">
              <div className="contact-box-header">
                <div className="icon-circle"><i className="bi bi-envelope"></i></div>
                <div>
                  <h5>Email Us</h5>
                  <p className="contact-desc">Send us an email anytime</p>
                </div>
              </div>
              <p className="contact-main">support.pgmate@gmail.com</p>
              <a href="mailto:support.pgmate@gmail.com" className="contact-btn">
                Send Email <i className="bi bi-arrow-right"></i>
              </a>
              <div className="contact-divider"></div>
              <p className="contact-avail"><i className="bi bi-clock"></i> Available <strong>24 / 7</strong></p>
            </div>

            <div className="contact-box call">
              <div className="contact-box-header">
                <div className="icon-circle"><i className="bi bi-telephone"></i></div>
                <div>
                  <h5>Call Us</h5>
                  <p className="contact-desc">Speak directly to our team</p>
                </div>
              </div>
              <p className="contact-main">+91 96376 05805</p>
              <a href="tel:+919637605805" className="contact-btn">
                Call Now <i className="bi bi-arrow-right"></i>
              </a>
              <div className="contact-divider"></div>
              <p className="contact-avail"><i className="bi bi-clock"></i> Available <strong>9 AM – 8 PM</strong></p>
            </div>

          </div>
        </section>

        {/* ===== MESSAGE FORM ===== */}
        <section className="container message-section" id="message-form">
          <div className="message-grid">

            <div className="message-form-card">
              <h4>Send us a Message</h4>
              <p className="message-sub">Fill out the form and our team will get back to you.</p>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-field">
                    <i className="bi bi-person"></i>
                    <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <i className="bi bi-envelope"></i>
                    <input type="email" name="email" placeholder="Email Address" value={form.email} onChange={handleChange} required />
                  </div>
                </div>
                {emailError && (
                  <p className="phone-error" style={{ color: "red", fontSize: "0.85rem", marginTop: "-8px", textAlign: "right" }}>
                    {emailError}
                  </p>
                )}
                <div className="form-row">
                  <div className="form-field">
                    <i className="bi bi-telephone"></i>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      value={form.phone}
                      onChange={handleChange}
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>
                  <div className="form-field">
                    <select name="subject" value={form.subject} onChange={handleChange}>
                      <option value="">Select a subject</option>
                      <option value="listing">PG Listing</option>
                      <option value="pricing">Pricing</option>
                      <option value="support">Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                {phoneError && (
                  <p className="phone-error" style={{ color: "red", fontSize: "0.85rem", marginTop: "-8px" }}>
                    {phoneError}
                  </p>
                )}
                <div className="form-field message-field">
                  <label className="field-label">Message</label>
                  <textarea name="message" placeholder="Type your message here..." rows="4" value={form.message} onChange={handleChange} required></textarea>
                </div>
                <div className="form-footer">
                  <button type="submit" className="send-btn" disabled={submitting}>
                    <i className="bi bi-send"></i> {submitting ? "Sending..." : "Send Message"}
                  </button>
                  <span className="form-note"><i className="bi bi-clock"></i> We usually respond within 24 hours</span>
                </div>
                {submitSuccess && (
                  <p style={{ color: "green", marginTop: "10px" }}>
                    Your message has been sent to our team. We'll get back to you soon!
                  </p>
                )}
                {submitError && (
                  <p style={{ color: "red", marginTop: "10px" }}>{submitError}</p>
                )}
              </form>
            </div>

            <div className="message-side-card">
              <div className="side-illustration">
                <img src={needHelpImg} alt="Need help" className="side-illustration-img" />
              </div>
            </div>

          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="container faq-section-redesigned">
          <div className="faq-illustration">
            <FaqIcon />
          </div>
          <div className="faq-content-full">
            <div className="faq-header-new">
              <h2>Frequently Asked Questions</h2>
              <a href="/faq" className="faq-view-all-new">View all FAQs <i className="bi bi-arrow-right"></i></a>
            </div>
            <div className="faq-grid-new">
              {faqs.map((item, i) => (
                <div className={`faq-item-new ${openFaq === i ? "open" : ""}`} key={i} onClick={() => toggleFaq(i)}>
                  <div className="faq-question-new">
                    <span>{item.q}</span>
                    <i className={`bi ${openFaq === i ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                  </div>
                  {openFaq === i && <p className="faq-answer-new">{item.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </HomeLayout>
  );
};

export default ContactUs;