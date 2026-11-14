import type { ReactNode } from "react";
import { GridIcon, PieChartIcon, BoxCubeIcon, PlugInIcon, DocsIcon, DollarLineIcon } from "../icons/index";

export type NavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

export function getNavigation(role: string | undefined): NavItem[] {

  switch (role) {
    case "Administrator":
      return [
        {
          icon: <GridIcon />,
          name: "Brands",
          path: "/brands",
        },
        {
          icon: <DocsIcon />,
          name: "Invoice Settings",
          path: "/invoice-store-management",
        },
        {
          icon: <PieChartIcon />,
          name: "Invoice Statistics",
          path: "/invoice-statistics",
        },
        {
          icon: <DocsIcon />,
          name: "Invoices",
          path: "/invoices",
        },
        {
          icon: <PlugInIcon />,
          name: "Updates",
          path: "/updates",
        },
        {
          icon: <PieChartIcon />,
          name: "Loyalty",
          path: "/loyalty",
        },
        {
          icon: <BoxCubeIcon />,
          name: "Special Offers",
          path: "/special-offers",
        },
        {
          icon: <DollarLineIcon />,
          name: "Mã Voucher",
          path: "/vouchers",
        },
      ];

    case "BrandManager":
      return [
        {
          icon: <PieChartIcon />,
          name: "Tổng Quan",
          subItems: [
            { name: "Tổng quan doanh thu", path: "/sales-dashboard" },
            { name: "Mục tiêu KPI (Target)", path: "/sales-dashboard/target-progress" },
            { name: "Doanh thu cửa hàng", path: "/sales-dashboard/top-store-revenues" },
            { name: "So sánh kỳ", path: "/sales-dashboard/comparison" },
            { name: "Báo cáo đơn hàng Block 4h", path: "/sales-dashboard/orders-report" },
            { name: "Báo cáo sản phẩm", path: "/sales-dashboard/products-report" },
            { name: "Tiêu hao vật tư & BOM", path: "/sales-dashboard/material-consumption-report" },
            { name: "Báo cáo lợi nhuận", path: "/sales-dashboard/profit-report" },
            { name: "Báo cáo tình hình lợi nhuận", path: "/sales-dashboard/profit-forecast" },
            { name: "Vận hành cửa hàng", path: "/sales-dashboard/operations-report" },
            { name: "Vận hành theo ngày", path: "/sales-dashboard/daily-operations" },
            { name: "Khách hàng & Marketing", path: "/sales-dashboard/customer-marketing-report" },
            { name: "Bảng 9 tuần", path: "/sales-dashboard/weekly-9weeks" },
            { name: "Doanh thu theo thanh toán", path: "/sales-dashboard/store-payment-methods" },
            { name: "Báo cáo nạp thẻ", path: "/sales-dashboard/top-up-report" },
            { name: "Đánh giá & CSAT", path: "/feedback-reports" },
            { name: "Đơn hàng", path: "/orders" },
          ],
        },
        {
          icon: <BoxCubeIcon />,
          name: "Danh mục & Tiếp thị",
          subItems: [
            { name: "Sản phẩm", path: "/products" },
            { name: "Vật tư (HangHoa)", path: "/product-items" },
            { name: "Cấu hình giá sản phẩm", path: "/product-detail-mappings" },
            { name: "Danh mục", path: "/categories" },
            { name: "Khuyến mãi", path: "/promotions" },
            { name: "Mã Voucher", path: "/vouchers" },
            { name: "Ưu đãi đặc biệt", path: "/special-offers" },
            { name: "Tích Stamp", path: "/stamp-programs" },
            { name: "Đặc quyền thành viên", path: "/loyalty-tiers" },
            { name: "Đổi thưởng bằng điểm", path: "/point-rewards" },
            { name: "Giao diện Mobile", path: "/home-media" },
            { name: "Bài viết thương hiệu", path: "/articles" },
          ],
        },
        {
          icon: <PlugInIcon />,
          name: "Thiết Lập Hệ Thống",
          subItems: [
            { name: "Cửa hàng", path: "/stores" },
            { name: "Mục tiêu KPI", path: "/target-settings" },
            { name: "Cấu hình đánh giá", path: "/feedback-settings" },
            { name: "Phương thức thanh toán", path: "/payment-types" },
            { name: "Kênh bán (Nguồn đơn)", path: "/source-orders" },
            { name: "Danh mục chi phí", path: "/cost-categories" },
          ],
        },
      ];

    case "StoreManager":
      return [
        {
          icon: <GridIcon />,
          name: "POS",
          path: "/pos",
        },
        {
          icon: <PieChartIcon />,
          name: "Tổng Quan",
          subItems: [
            { name: "Tổng quan doanh thu", path: "/store/shift-sales" },
            { name: "Mục tiêu KPI (Target)", path: "/sales-dashboard/target-progress" },
            { name: "So sánh kỳ", path: "/store/sales-dashboard/comparison" },
            { name: "Báo cáo đơn hàng", path: "/store/sales-dashboard/orders-report" },
            { name: "Báo cáo sản phẩm", path: "/store/sales-dashboard/products-report" },
            { name: "Báo cáo lợi nhuận", path: "/store/sales-dashboard/profit-report" },
            { name: "Báo cáo tình hình lợi nhuận", path: "/store/sales-dashboard/profit-forecast" },
            { name: "Vận hành cửa hàng", path: "/store/sales-dashboard/operations-report" },
            { name: "Vận hành theo ngày", path: "/store/sales-dashboard/daily-operations" },
            { name: "Khách hàng & Marketing", path: "/store/sales-dashboard/customer-marketing-report" },
            { name: "Doanh thu cửa hàng", path: "/store/sales-dashboard/top-store-revenues" },
            { name: "Bảng 9 tuần", path: "/store/sales-dashboard/weekly-9weeks" },
            { name: "Doanh thu theo thanh toán", path: "/store/sales-dashboard/store-payment-methods" },
            { name: "Báo cáo nạp thẻ", path: "/store/sales-dashboard/top-up-report" },
            { name: "Đánh giá & CSAT", path: "/feedback-reports" },
          ],
        },
        {
          icon: <PieChartIcon />,
          name: "Đơn hàng",
          path: "/store/orders",
        },
      ];

    default:
      return [];
  }
}

