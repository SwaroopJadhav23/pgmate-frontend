import React from "react";
import OwnerToolsRestricted from "../pages/Tools/OwnerToolsRestricted";

/**
 * Free Tools (menu generator, rent receipt, lease agreement, expense
 * calculator) are marketing/utility pages meant for PG Owners.
 *
 * - Guests (not logged in) can still view them, since they double as
 *   public marketing pages for prospective owners.
 * - A logged-in Tenant/User (role === "USER") is blocked and shown a
 *   friendly "Owners Only" message instead of the tool.
 * - Owners, Managers, and Admins are let through unaffected.
 */
const OwnerToolsGuard = ({children}) => {
  const role = localStorage.getItem("role");

  if (role === "USER") {
    return <OwnerToolsRestricted />;
  }

  return children;
};

export default OwnerToolsGuard;
