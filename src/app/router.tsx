import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProductDetailPage } from "../pages/ProductDetailPage";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <HomePage />,
    },
    {
      path: "/producto/:slug",
      element: <ProductDetailPage />,
    },
    {
      path: "*",
      element: <NotFoundPage />,
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
