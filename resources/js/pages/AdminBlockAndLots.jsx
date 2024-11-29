import BlockAndLotTable  from '../components/BlockAndLotTable';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from '../components/Breadcrumbs';
import { getBreadcrumbs } from '../helpers/breadcrumbsHelper';
import { useLocation } from "react-router-dom";

const AdminBlockAndLots = () => {

    const location = useLocation(); 
    const crumbs = getBreadcrumbs(location);  

    return (
        <div className="min-h-screen relative overflow-x-auto bg-[#FAFAFA] p-4">
            <ToastContainer />
                    {/* BreadCrumbs Section */}
          <div className="bg-white rounded-md mb-2">
            <Breadcrumbs crumbs={crumbs} />
          </div>

            <div>
                <h1 className="text-4xl font-bold mb-6">Block and Lots</h1>
                <BlockAndLotTable />
            </div>
        </div>
    );
};

export default AdminBlockAndLots;
