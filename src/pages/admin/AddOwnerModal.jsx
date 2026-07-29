import AdminOwnerCreate from "../admin/AdminOwnerCreate";

const AddOwnerModal = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div
        className="modal-box add-owner-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-custom">
          <h4>Add New Owner</h4>

          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <AdminOwnerCreate />
      </div>
    </div>
  );
};

export default AddOwnerModal;
