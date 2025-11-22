import { createRoot } from "react-dom/client";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import loader from "./lib/loader";
import ErrorPage from "./pages/ErrorPage";
import HomePage from "./pages/HomePage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import ProductsPage from "./pages/ProductsPage";

const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    element: <MainLayout />,
    loader: loader,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: "/home",
        element: <HomePage />,
      },
      {
        path: "/customers",
        element: <CustomersPage />,
      },
      {
        path: "/customers/:id",
        element: <CustomerDetailPage />,
      },
      {
        path: "/products",
        element: <ProductsPage />,
      },
    ],
  },
]);

const root = createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);
