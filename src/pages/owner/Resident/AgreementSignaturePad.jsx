import { useRef, useState, useEffect } from "react";

/**
 * AgreementSignaturePad
 * Props:
 *  - residentName  : string  – pre-fills the agreement
 *  - pgName        : string
 *  - monthlyRent   : number
 *  - checkinDate   : string
 *  - onSigned      : (dataUrl) => void  – called with PNG data-URL
 *  - onClear       : () => void
 *  - signatureDataUrl : string | null  – existing signature to display
 */
const AgreementSignaturePad = ({
  residentName = "",
  pgName = "",
  monthlyRent = 0,
  checkinDate = "",
  onSigned,
  onClear,
  signatureDataUrl,
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Restore existing signature
  useEffect(() => {
    if (signatureDataUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = signatureDataUrl;
      setHasSigned(true);
    }
  }, [signatureDataUrl]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasSigned(true);
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSigned?.(dataUrl);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    setAgreed(false);
    onClear?.();
  };

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="agreement-pad-wrapper">
      {/* Agreement Text */}
      <div className="agreement-scroll-box">
        <h6 className="agreement-title">PG Rental Agreement</h6>
        <p className="agreement-body">
          This agreement is made on <strong>{today}</strong> between the PG Owner of{" "}
          <strong>{pgName || "[PG Name]"}</strong> and the tenant{" "}
          <strong>{residentName || "[Tenant Name]"}</strong>.
        </p>
        <ol className="agreement-terms">
          <li>The tenant agrees to pay a monthly rent of <strong>₹{Number(monthlyRent || 0).toLocaleString("en-IN")}</strong> by the 5th of every month.</li>
          <li>Check-in date: <strong>{checkinDate || "[Date]"}</strong>. Early checkout requires 15 days prior written notice.</li>
          <li>The tenant shall keep the room and common areas clean and tidy at all times.</li>
          <li>No illegal activities, loud noise after 11 PM, or smoking inside the premises.</li>
          <li>Guests are allowed only in common areas and must leave by 10 PM.</li>
          <li>The deposit will be refunded within 7 days of checkout after deducting any damages or dues.</li>
          <li>The management reserves the right to terminate this agreement with 7 days notice for violation of rules.</li>
          <li>The tenant accepts sole responsibility for their personal belongings.</li>
        </ol>
        <p className="agreement-body mt-2">
          By signing below, the tenant acknowledges that they have read, understood, and agree to all the above terms and conditions.
        </p>
      </div>

      {/* Checkbox consent */}
      <label className="agreement-consent-check">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          style={{ marginRight: 8 }}
        />
        I have read and agree to the above terms and conditions
      </label>

      {/* Signature Canvas */}
      <div className={`signature-area ${!agreed ? "sig-disabled" : ""}`}>
        <p className="sig-label">Tenant Signature <span style={{ color: "#dc2626" }}>*</span></p>
        <div className="sig-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={520}
            height={130}
            className="sig-canvas"
            style={{ touchAction: "none", cursor: agreed ? "crosshair" : "not-allowed" }}
            onMouseDown={agreed ? startDraw : undefined}
            onMouseMove={agreed ? draw : undefined}
            onMouseUp={agreed ? endDraw : undefined}
            onMouseLeave={agreed ? endDraw : undefined}
            onTouchStart={agreed ? startDraw : undefined}
            onTouchMove={agreed ? draw : undefined}
            onTouchEnd={agreed ? endDraw : undefined}
          />
          {!agreed && (
            <div className="sig-overlay">Please accept the terms above to sign</div>
          )}
        </div>
        <div className="sig-footer">
          <span className="sig-hint">Sign above using mouse or touch</span>
          {hasSigned && (
            <button type="button" className="sig-clear-btn" onClick={clearSignature}>
              Clear Signature
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgreementSignaturePad;