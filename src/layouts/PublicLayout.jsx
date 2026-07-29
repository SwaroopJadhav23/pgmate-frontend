import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

const PublicLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <div className="page-shell">
        {children}
      </div>
      <Footer />
    </>
  );
};

export default PublicLayout;
