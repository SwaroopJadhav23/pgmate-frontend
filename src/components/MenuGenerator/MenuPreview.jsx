import React from "react";
import MenuPreviewOption1 from "./MenuPreviewOption1";
import MenuPreviewOption2 from "./MenuPreviewOption2";

const MenuPreview = (props) => {
  const { theme, id = "printable-menu-area", ...restProps } = props;

  return (
    <div className="a4-menu-wrapper">
      <div id={id} className="a4-menu-container">
        {theme === "option1" ? (
          <MenuPreviewOption1 {...restProps} />
        ) : (
          <MenuPreviewOption2 {...restProps} />
        )}
      </div>
    </div>
  );
};

export default MenuPreview;
