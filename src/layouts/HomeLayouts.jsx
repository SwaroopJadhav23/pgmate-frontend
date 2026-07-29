import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

const HomeLayout = ({ children, noFooterMargin }) => {
  return (
    <>
      <Navbar />
      <main style={{ margin: 0, padding: 0 }}>{children}</main>
      <Footer noMargin={noFooterMargin} />
    </>
  );
};

export default HomeLayout;