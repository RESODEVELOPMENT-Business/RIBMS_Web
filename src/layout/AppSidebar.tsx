"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  PieChartIcon,
  BoxCubeIcon,
  PlugInIcon,
} from "../icons/index";
import { useAuthStore } from "@/store/authStore";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { user } = useAuthStore();

  const getNavItems = (): NavItem[] => {
    const role = user?.role;

    switch (role) {
      case "Administrator":
        return [
          {
            icon: <GridIcon />,
            name: "Brands",
            path: "/brands",
          },
        ];

      case "BrandManager":
        return [
          {
            icon: <PieChartIcon />,
            name: "Tổng Quan",
            subItems: [
              { name: "Tổng quan doanh thu", path: "/sales-dashboard" },
              { name: "Doanh thu cửa hàng", path: "/sales-dashboard/top-store-revenues" },
              { name: "Doanh thu theo thanh toán", path: "/sales-dashboard/store-payment-methods" },
              { name: "Đơn hàng", path: "/orders" },
            ],
          },
          {
            icon: <BoxCubeIcon />,
            name: "Danh mục & Tiếp thị",
            subItems: [
              { name: "Sản phẩm", path: "/products" },
              { name: "Danh mục", path: "/categories" },
              { name: "Khuyến mãi", path: "/promotions" },
            ],
          },
          {
            icon: <PlugInIcon />,
            name: "Thiết Lập Hệ Thống",
            subItems: [
              { name: "Cửa hàng", path: "/stores" },
              { name: "Phương thức thanh toán", path: "/payment-types" },
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
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={` ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main"].forEach((menuType) => {
      const items = navItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-6 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link 
          href="/" 
          className="flex items-center gap-3 transition-transform duration-300 hover:scale-102 active:scale-98 select-none"
          aria-label="RIBMS Home"
        >
          {isExpanded || isHovered || isMobileOpen ? (
            // Full Premium Logo (RIBMS)
            <svg width="150" height="40" viewBox="0 0 150 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-10">
              <defs>
                <linearGradient id="logo-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#465FFF" />
                  <stop offset="100%" stopColor="#7A5AF8" />
                </linearGradient>
                <linearGradient id="logo-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#36BFFA" />
                  <stop offset="100%" stopColor="#465FFF" />
                </linearGradient>
                <filter id="logo-glow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#465FFF" floodOpacity="0.2" />
                </filter>
              </defs>

              {/* R Brandmark */}
              <g filter="url(#logo-glow)">
                {/* Back vertical pillar */}
                <rect x="6" y="6" width="6.5" height="28" rx="3.25" fill="url(#logo-grad-1)" />
                {/* Flowing brand loop */}
                <path d="M12.5 9.5C12.5 7.567 14.067 6 16 6H23C27.4183 6 31 9.58172 31 14C31 18.4183 27.4183 22 23 22H12.5V9.5Z" fill="url(#logo-grad-2)" fillOpacity="0.95" />
                {/* Dynamic arrow extension representing metrics / growth */}
                <path d="M18.5 20.5L26.5 31.5C27.3 32.5 28.7 32.5 29.5 31.5L30.2 30.5C31 29.5 30.8 28 29.8 27.2L22 21H18.5V20.5Z" fill="url(#logo-grad-1)" />
                {/* Integrated smart bead linking core domains */}
                <circle cx="20.5" cy="20.5" r="3" fill="#36BFFA" />
              </g>

              {/* Sophisticated typography with gradient styling */}
              <text x="44" y="27" fontFamily="Outfit, sans-serif" fontSize="21" fontWeight="800" letterSpacing="1.2" className="fill-gray-900 dark:fill-white font-outfit">
                RIBMS
              </text>
            </svg>
          ) : (
            // Collapsed Premium Logo (R)
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
              <defs>
                <linearGradient id="logo-grad-1-col" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#465FFF" />
                  <stop offset="100%" stopColor="#7A5AF8" />
                </linearGradient>
                <linearGradient id="logo-grad-2-col" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#36BFFA" />
                  <stop offset="100%" stopColor="#465FFF" />
                </linearGradient>
                <filter id="logo-glow-col" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#465FFF" floodOpacity="0.2" />
                </filter>
              </defs>

              <g filter="url(#logo-glow-col)">
                {/* Back vertical pillar */}
                <rect x="8" y="6" width="6.5" height="28" rx="3.25" fill="url(#logo-grad-1-col)" />
                {/* Flowing brand loop */}
                <path d="M14.5 9.5C14.5 7.567 16.067 6 18 6H25C29.4183 6 33 9.58172 33 14C33 18.4183 29.4183 22 25 22H14.5V9.5Z" fill="url(#logo-grad-2-col)" fillOpacity="0.95" />
                {/* Dynamic leg/arrow */}
                <path d="M20.5 20.5L28.5 31.5C29.3 32.5 30.7 32.5 31.5 31.5L32.2 30.5C33 29.5 32.8 28 31.8 27.2L24 21H20.5V20.5Z" fill="url(#logo-grad-1-col)" />
                {/* Connection point */}
                <circle cx="22.5" cy="20.5" r="3" fill="#36BFFA" />
              </g>
            </svg>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
