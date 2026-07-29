import { useState } from "react";

/* ================= USER FAQs ================= */
const userFaqs = [
  {
    q: "How do I find a PG on the platform?",
    a: "Use the pg listing page search and filters (city, rent, gender type) to find PGs with real-time available beds."
  },
  {
    q: "Why do I only see some rooms or beds?",
    a: "Only rooms and beds marked as AVAILABLE by PG owners are visible to public users."
  },
  {
    q: "Can I contact the PG owner directly?",
    a: "Yes. Each PG detail page allows you to send enquiries or contact the owner."
  },
  {
    q: "Are listings updated in real time?",
    a: "Yes. Bed availability updates automatically when residents are assigned or vacated."
  },
  {
    q: "Can I book a bed online?",
    a: "You can send an enquiry or request directly. Final confirmation is handled by the PG owner."
  },
  {
    q: "What details are shown on PG pages?",
    a: "PG details include amenities, location, rent, available rooms, bed counts, and owner contact details."
  },
  {
    q: "Is there any fee for users?",
    a: "No. Searching and sending enquiries is completely free for users."
  }
];

/* ================= OWNER FAQs ================= */
const ownerFaqs = [
   {
    q: "How do I list my PG?",
    a: "You can list your PG directly from the 'List Your PG' section. Just add your PG details. Once submitted and approved, your PG will go live."
  },
  {
    q: "How does PG hierarchy work?",
    a: "The structure follows: PG → Floor → Room → Bed → Resident. Each bed can have only one active resident at a time."
  },
  {
    q: "What happens when a resident vacates?",
    a: "The owner must manually checkout the resident from the dashboard. After checkout, the bed becomes AVAILABLE and is shown again on the public PG listing."
  },
  {
    q: "How do subscription plans work?",
    a: "Our plans are designed to fit your needs: Basic (1 PG), Pro (up to 5 PGs), and Premium (Unlimited PGs). All plans are billed yearly and currently include 1 extra month free. If you have fewer than 15 beds, you can also talk to our executive for a personalized plan."
  },
  {
    q: "What happens if my subscription expires?",
    a: "If your subscription expires,  You must upgrade or renew your plan  in List Your Pg section for your PGs."
  },
  {
    q: "Can I manage multiple PGs in one account?",
    a: "Yes. Depending on your subscription plan, you can manage multiple PG properties from a single dashboard."
  },
  {
    q: "How do I manage residents?",
    a: "You can assign beds, edit resident details, collect payments, and manually checkout residents from your owner dashboard."
  },
  {
    q: "Can I view analytics for my PG?",
    a: "Yes. You can view occupancy percentage, available beds, resident count, and other performance statistics from the dashboard."
  },
  {
    q: "How do enquiries work?",
    a: "Users submit enquiries from the PG deatail page. You can view and manage all enquiries inside your owner dashboard."
  }
];


const FAQSection = ({ type = "user" }) => {
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = type === "owner" ? ownerFaqs : userFaqs;

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div className="faq-list-premium">
      {faqs.map((item, i) => (
        <div key={i} className={`faq-card-premium ${openIndex === i ? "open" : ""}`} onClick={() => toggle(i)}>
          <div className="faq-question-premium">
            <span>{item.q}</span>
            <div className="faq-icon-wrapper">
              <span className="faq-icon-premium">
                <i className={`bi bi-chevron-down`}></i>
              </span>
            </div>
          </div>
          <div className="faq-answer-premium">
            <div className="faq-answer-content">
              <p>{item.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FAQSection;
