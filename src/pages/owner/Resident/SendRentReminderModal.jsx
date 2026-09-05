import React, { useState, useEffect } from "react";
import "./SendRentReminderModal.css";
import api from "../../../api/axios";

/**
 * SendRentReminderModal
 *
 * Clean, modern SaaS Rent Reminder confirmation and dispatch modal
 * matching the user's reference design down to every pixel.
 *
 * Props:
 *   totalCount  {number}   number of ACTIVE tenants shown in the list
 *   onClose     {func}     called when the modal should be closed
 */
const SendRentReminderModal = ({ totalCount, onClose }) => {
  const [phase, setPhase]                   = useState("CONFIRM"); // CONFIRM | SENDING | RESULT
  const [preview, setPreview]               = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [result, setResult]                 = useState(null);

  // ── Fetch real-data preview from backend ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const res = await api.get("/owner/rent-reminders/preview");
        if (!cancelled && res.data?.success && res.data?.preview) {
          setPreview(res.data.preview);
        }
      } catch (err) {
        // Soft fallback to default sample values if preview fails
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };
    fetchPreview();
    return () => { cancelled = true; };
  }, []);

  // ── Helper to extract 2-letter uppercase initials ─────────────────────────
  const getInitials = (name) => {
    if (!name) return "PR";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // ── Send handler ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    setPhase("SENDING");
    try {
      const res = await api.post("/owner/rent-reminders/send-sms", {
        sendToAll: true,
        channel: "SMS",
        idempotencyKey: crypto.randomUUID(),
      });
      setResult(res.data);
      setPhase("RESULT");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to send reminders. Please try again.";
      setResult({
        success: false,
        totalCount: 0,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        results: [],
        errorMessage: msg,
      });
      setPhase("RESULT");
    }
  };

  // ── Close on overlay click (only in CONFIRM / RESULT phases) ─────────────
  const handleOverlayClick = (e) => {
    if (phase !== "SENDING" && e.target === e.currentTarget) onClose();
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderStatusIcon = (status) => {
    switch ((status || "").toUpperCase()) {
      case "SENT":    return "✓";
      case "FAILED":  return "✗";
      case "SKIPPED": return "–";
      default:        return "?";
    }
  };

  const statusClass = (status) => {
    switch ((status || "").toUpperCase()) {
      case "SENT":    return "sent";
      case "FAILED":  return "failed";
      case "SKIPPED": return "skipped";
      default:        return "skipped";
    }
  };

  // ── Phase 1: Confirm Screen ───────────────────────────────────────────────
  const renderConfirm = () => {
    const tenantName = preview?.tenantName || "pratham";
    const amountVal  = preview?.rentAmount
      ? Number(preview.rentAmount).toLocaleString("en-IN")
      : "10,000";
    const pgName     = preview?.propertyName || "StayPG";
    const dueDateVal = preview?.dueDate || "27 August 2026";

    return (
      <>
        {/* 3-Column Summary Strip */}
        <div className="rrm-stats-strip">
          <div className="rrm-stat-col">
            <div className="rrm-stat-col-icon blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="rrm-stat-col-val">{totalCount}</div>
            <div className="rrm-stat-col-lbl">Active Tenants</div>
          </div>

          <div className="rrm-stat-col">
            <div className="rrm-stat-col-icon green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="rrm-stat-col-val heading">Personalized</div>
            <div className="rrm-stat-col-lbl">Each tenant receives their own details</div>
          </div>

          <div className="rrm-stat-col">
            <div className="rrm-stat-col-icon purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div className="rrm-stat-col-val heading">Powered by Fast2SMS DLT</div>
            <div className="rrm-stat-col-lbl">Reliable & secure delivery</div>
          </div>
        </div>

        {/* Message Preview Header */}
        <div className="rrm-preview-header">
          <div className="rrm-preview-title-group">
            <h4>Message Preview</h4>
            <p>This is a sample message from your first tenant.</p>
          </div>
          <div className="rrm-preview-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Preview as SMS</span>
          </div>
        </div>

        {/* Message Preview Card */}
        {previewLoading ? (
          <div className="rrm-preview-loading-box">
            <span className="rrm-spinner-icon" />
            <span>Loading preview…</span>
          </div>
        ) : (
          <div className="rrm-preview-card">
            <div className="rrm-preview-avatar">
              {getInitials(tenantName)}
            </div>
            <div className="rrm-preview-bubble">
              <div className="rrm-preview-bubble-title">Rent Payment Reminder</div>
              <div className="rrm-preview-bubble-body">
                <p>
                  Hi {tenantName}, your rent of Rs. {amountVal} for {pgName} is due on {dueDateVal}.
                </p>
                <p>
                  Please complete your payment on time to keep your rent status up to date.
                </p>
                <p>
                  Thank you!<br />
                  Team PGMate
                </p>
              </div>
              <div className="rrm-preview-bubble-time">10:30 AM</div>
            </div>
          </div>
        )}

        {/* Important to Note Banner */}
        <div className="rrm-important-banner">
          <div className="rrm-important-icon">!</div>
          <div className="rrm-important-text">
            <h5>Important to Note</h5>
            <p>
              Reminders are sent only once per tenant within 24 hours. Tenants with missing or invalid mobile numbers will be skipped automatically.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="rrm-footer">
          <button className="rrm-btn-cancel" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="rrm-btn-send"
            onClick={handleSend}
            type="button"
            id="confirm-send-rent-reminder-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Send Reminder
          </button>
        </div>
      </>
    );
  };

  // ── Phase 2: Sending State ────────────────────────────────────────────────
  const renderSending = () => (
    <div className="rrm-sending-center">
      <div className="rrm-big-spinner" />
      <h4>Sending Reminders…</h4>
      <p>Please wait while personalized reminders are delivered to all active tenants.</p>
    </div>
  );

  // ── Phase 3: Result Summary ───────────────────────────────────────────────
  const renderResult = () => {
    const r = result || {};
    const sentCount    = r.sentCount ?? 0;
    const failedCount  = r.failedCount ?? 0;

    let icon = "🎉";
    let title = "Reminders Sent!";
    let sub = `${sentCount} tenant${sentCount !== 1 ? "s" : ""} received a payment reminder.`;

    if (sentCount === 0 && failedCount > 0) {
      icon = "⚠️";
      title = "Reminders Failed";
      sub = "No reminders were delivered. Please review the reasons below.";
    } else if (sentCount > 0 && failedCount > 0) {
      icon = "⚠️";
      title = "Partially Sent";
      sub = `${sentCount} sent successfully, ${failedCount} failed.`;
    } else if (sentCount === 0 && failedCount === 0) {
      icon = "ℹ️";
      title = "No Reminders Sent";
      sub = r.errorMessage || "All active tenants were skipped (already notified or missing data).";
    }

    const isBalanceIssue = (r.results || []).some(
      (res) => res.reason && (res.reason.toLowerCase().includes("balance") || res.reason.toLowerCase().includes("wallet"))
    ) || (r.errorMessage && (r.errorMessage.toLowerCase().includes("balance") || r.errorMessage.toLowerCase().includes("wallet")));

    const isAuthIssue = (r.results || []).some(
      (res) => res.reason && (res.reason.toLowerCase().includes("authorization") || res.reason.toLowerCase().includes("auth") || res.reason.toLowerCase().includes("key disabled"))
    ) || (r.errorMessage && (r.errorMessage.toLowerCase().includes("authorization") || r.errorMessage.toLowerCase().includes("key disabled")));

    return (
      <>
        <div className="rrm-result-header">
          <div className="rrm-result-icon">{icon}</div>
          <h4>{title}</h4>
          <p>{sub}</p>
        </div>

        {/* API Key authorization alert if returned from Fast2SMS */}
        {isAuthIssue && (
          <div style={{
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "16px",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            color: "#991b1b",
            fontSize: "13px",
            lineHeight: 1.5
          }}>
            <span style={{ fontSize: "18px" }}>🔑</span>
            <div>
              <strong style={{ display: "block", marginBottom: 2 }}>Fast2SMS API Key Disabled</strong>
              Fast2SMS responded: <em>"Invalid Authentication, Authorization Key Disabled"</em>.<br />
              Please log in to <a href="https://www.fast2sms.com" target="_blank" rel="noreferrer" style={{ color: "#b91c1c", textDecoration: "underline", fontWeight: 700 }}>fast2sms.com</a> &gt; <strong>Dev API</strong> to re-enable or generate a new Authorization Key, and update <code>fast2sms.api.key</code>.
            </div>
          </div>
        )}

        {/* Wallet balance alert if returned from provider */}
        {isBalanceIssue && !isAuthIssue && (
          <div style={{
            background: "#fffbeb",
            border: "1px solid #f59e0b",
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "16px",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            color: "#92400e",
            fontSize: "13px",
            lineHeight: 1.5
          }}>
            <span style={{ fontSize: "18px" }}>⚠️</span>
            <div>
              <strong style={{ display: "block", marginBottom: 2 }}>Fast2SMS Wallet Recharge Required</strong>
              Your Fast2SMS account has insufficient balance. Please recharge your wallet at <a href="https://www.fast2sms.com" target="_blank" rel="noreferrer" style={{ color: "#b45309", textDecoration: "underline", fontWeight: 700 }}>fast2sms.com</a> and click Send Reminder again.
            </div>
          </div>
        )}

        {/* Counts */}
        {(r.totalCount > 0) && (
          <div className="rrm-result-stats">
            <div className="rrm-result-stat sent">
              <div className="rs-val">{r.sentCount ?? 0}</div>
              <div className="rs-lbl">Sent</div>
            </div>
            <div className="rrm-result-stat failed">
              <div className="rs-val">{r.failedCount ?? 0}</div>
              <div className="rs-lbl">Failed</div>
            </div>
            <div className="rrm-result-stat skipped">
              <div className="rs-val">{r.skippedCount ?? 0}</div>
              <div className="rs-lbl">Skipped</div>
            </div>
          </div>
        )}

        {/* Per-tenant list */}
        {Array.isArray(r.results) && r.results.length > 0 && (
          <div className="rrm-result-list">
            {r.results.map((tenant, idx) => (
              <div key={tenant.tenantId || idx} className="rrm-result-row">
                <div className={`rrm-result-status ${statusClass(tenant.status)}`}>
                  {renderStatusIcon(tenant.status)}
                </div>
                <div className="rrm-result-name">{tenant.tenantName || "—"}</div>
                {tenant.status !== "SENT" && tenant.reason && (
                  <div className="rrm-result-reason">{tenant.reason}</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="rrm-footer">
          <button
            className="rrm-btn-send"
            onClick={onClose}
            type="button"
            id="close-rent-reminder-result-btn"
          >
            Done
          </button>
        </div>
      </>
    );
  };

  // ── Main Modal Render ─────────────────────────────────────────────────────
  return (
    <div className="rrm-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Send Rent Reminder">
      <div className="rrm-modal">

        {/* Header */}
        <div className="rrm-header">
          <div className="rrm-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="rrm-header-text">
            <h3>Send Rent Reminder</h3>
            <p>Send personalized SMS reminders to all active tenants</p>
          </div>
          {phase !== "SENDING" && (
            <button className="rrm-close-btn" onClick={onClose} aria-label="Close" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Phase content */}
        {phase === "CONFIRM" && renderConfirm()}
        {phase === "SENDING" && renderSending()}
        {phase === "RESULT"  && renderResult()}

      </div>
    </div>
  );
};

export default SendRentReminderModal;
