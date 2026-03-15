"use client";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  Mail,
  Users,
  ShoppingCart,
  PackageSearch
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import logo from "../../../../public/assets/images/authLogo.png"
import LogoutModal from "@/components/modals/logout-modal";
import { useState } from "react";
import { toast } from "sonner";

const items = [
  {
    title: "Dashboard Overview",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Product Management",
    url: "/product-management",
    icon: PackageSearch ,
  },
  {
    title: "Order Management",
    url: "/order-management",
    icon: ShoppingCart,
  },
  {
    title: "Customer Management",
    url: "/customer-management",
    icon: Users,
  },
  {
    title: "Category Management",
    url: "/category-management",
    icon: LayoutDashboard,
  },
  {
    title: "Brand Management",
    url: "/brand-management",
    icon: PackageSearch,
  },
  {
    title: "Contact Management",
    url: "/contact-management",
    icon: Mail  ,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },

];

export function DashboardSidebar() {
  const pathName = usePathname();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)


  const handLogout = async () => {
    try {
      toast.success("Logout successful!")
      await signOut({ callbackUrl: "/login" })
    } catch (error) {
      console.error("Logout failed:", error)
      toast.error("Logout failed. Please try again.")
    }
  }

  return (
    <div>
      <Sidebar className="border-none w-[320px]">
      <SidebarContent className="bg-white scrollbar-hide">
        <SidebarGroup className="p-0">
          <div className="flex flex-col justify-between min-h-screen pb-5">
            <div>
              <SidebarGroupLabel className="mt-5 mb-5 h-[80px] flex justify-center">
                <Link href={`/`}>
                  <Image
                    src={logo}
                    alt="logo"
                    width={1000}
                    height={1000}
                    className="h-[48px] w-[89px] object-contain"
                  />
                </Link>
              </SidebarGroupLabel>
              <SidebarGroupContent className="px-4 pt-5">
                <SidebarMenu>
                  {items.map((item) => {
                    const isActive =
                      item.url === "/"
                        ? pathName === "/"
                        : pathName === item.url ||
                          pathName.startsWith(`${item.url}/`);

                    return (
                      <SidebarMenuItem key={item.title}  className=" pb-1">
                        <SidebarMenuButton
                          className={`h-[50px] rounded-none bg-transparent text-xl text-[#565656] hover:bg-primary hover:text-white hover:rounded-[12px] transition-all duration-300 ${
                            isActive &&
                            "bg-primary text-white shadow-[0px_8px_30px_0px_#00000029] font-semibold rounded-[12px]"
                          }`}
                          asChild
                        >
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </div>

            <div>
              <SidebarFooter className="border-t border-gray-300">
                <button onClick={() => setLogoutModalOpen(true)} className="font-medium text-red-500 flex items-center gap-2 pl-2 mt-5">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </SidebarFooter>
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>

    {/* logout modal  */}
    <div>
      {logoutModalOpen && (
        <LogoutModal
          isOpen={logoutModalOpen}
          onClose={() => setLogoutModalOpen(false)}
          onConfirm={handLogout}
        />
      )}
    </div>
    </div>
  );
}
