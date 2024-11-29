import PaymentTable  from '../components/PaymentTable';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from '../components/Breadcrumbs';
import { getBreadcrumbs } from '../helpers/breadcrumbsHelper';
import { useLocation } from "react-router-dom";


const AdminPaymentApproved = () => {

    const location = useLocation(); 
    const crumbs = getBreadcrumbs(location);  

    return (
        <div className="p-4">
            <ToastContainer />

                        {/* BreadCrumbs Section */}
          <div className="bg-white rounded-md mb-6">
            <Breadcrumbs crumbs={crumbs} />
          </div>

            <div>
                <h1 className="text-4xl font-bold ml-4">Approved Payments</h1>
                <PaymentTable type="approved" />
            </div>
        </div>
    );
};

export default AdminPaymentApproved;
