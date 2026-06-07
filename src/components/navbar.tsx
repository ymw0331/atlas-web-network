'use client';
import React, { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { ChevronDownIcon, ServerStackIcon, LinkIcon, Cog6ToothIcon, DocumentTextIcon, ClipboardDocumentListIcon, ClockIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { NavbarLogoBrand, ThemeToggle, NavbarUserMenu } from "atlas-shared-web/components";
import { useAuth } from "atlas-shared-web";

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const settingsItems = [
    {
      label: "Configs",
      href: "/configs",
      description: "Manage system configurations",
      icon: <Cog6ToothIcon className="w-6 h-6 min-w-6 text-gray-500" />,
    },
    {
      label: "Terms & Conditions",
      href: "/terms",
      description: "Manage terms and conditions",
      icon: <DocumentTextIcon className="w-6 h-6 min-w-6 text-purple-500" />,
    },
  ];

  const coLocationItems = [
    {
      label: "Co-Location",
      href: "/co-location",
      description: "Manage co-location request",
      icon: <ClipboardDocumentListIcon className="w-6 h-6 min-w-6 text-primary" />,
    },
    {
      label: "Racks",
      href: "/racks",
      description: "Manage rack assignments",
      icon: <ServerStackIcon className="w-6 h-6 min-w-6 text-blue-500" />,
    },
    {
      label: "Cross-Connects",
      href: "/cross-connects",
      description: "Manage rack-to-rack connections",
      icon: <LinkIcon className="w-6 h-6 min-w-6 text-green-500" />,
    },
    {
      label: "Time Services",
      href: "/time-services",
      description: "Manage time service subscriptions",
      icon: <ClockIcon className="w-6 h-6 min-w-6 text-orange-500" />,
    },
    {
      label: "Internet Services",
      href: "/internet-services",
      description: "Manage internet service subscriptions",
      icon: <GlobeAltIcon className="w-6 h-6 min-w-6 text-cyan-500" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return router.pathname === "/";
    }
    return router.pathname.startsWith(href);
  };

  const isCoLocationActive = () => {
    return router.pathname.startsWith("/co-location") || router.pathname.startsWith("/racks") || router.pathname.startsWith("/cross-connects") || router.pathname.startsWith("/time-services") || router.pathname.startsWith("/internet-services");
  };

  const isSettingsActive = () => {
    return router.pathname.startsWith("/configs") || router.pathname.startsWith("/terms");
  };

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen} maxWidth="full" isBordered={true} shouldHideOnScroll={true} classNames={{ wrapper: "px-4" }}>
      <NavbarContent>
        {user && (
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden"
          />
        )}
        <NavbarBrand>
          <NavbarLogoBrand />
        </NavbarBrand>
      </NavbarContent>

      {/* Global Navigation Items */}
      {user && (
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem isActive={isActive("/")}>
            <Button
              variant="light"
              className={`p-0 px-2 min-w-fit bg-transparent data-[hover=true]:bg-transparent data-[hover=true]:text-primary text-base transition-colors ${isActive("/") ? "text-primary font-semibold" : ""}`}
              onPress={() => router.push("/")}
            >
              Dashboard
            </Button>
          </NavbarItem>
          <Dropdown>
            <NavbarItem isActive={isCoLocationActive()}>
              <DropdownTrigger>
                <Button
                  variant="light"
                  className={`p-0 px-2 min-w-fit bg-transparent data-[hover=true]:bg-transparent data-[hover=true]:text-primary text-base transition-colors ${isCoLocationActive() ? "text-primary font-semibold" : ""}`}
                  endContent={<ChevronDownIcon className="w-4 h-4" />}
                >
                  Co-Location
                </Button>
              </DropdownTrigger>
            </NavbarItem>
            <DropdownMenu
              aria-label="Co-Location submenu"
              onAction={(key) => router.push(key as string)}
              className="w-80"
            >
              {coLocationItems.map((item) => (
                <DropdownItem
                  key={item.href}
                  description={item.description}
                  startContent={item.icon}
                  classNames={{
                    base: `gap-4 ${isActive(item.href) ? "text-primary font-semibold" : ""}`,
                  }}
                >
                  {item.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <NavbarItem isActive={isSettingsActive()}>
              <DropdownTrigger>
                <Button
                  variant="light"
                  className={`p-0 px-2 min-w-fit bg-transparent data-[hover=true]:bg-transparent data-[hover=true]:text-primary text-base transition-colors ${isSettingsActive() ? "text-primary font-semibold" : ""}`}
                  endContent={<ChevronDownIcon className="w-4 h-4" />}
                >
                  Settings
                </Button>
              </DropdownTrigger>
            </NavbarItem>
            <DropdownMenu
              aria-label="Settings submenu"
              onAction={(key) => router.push(key as string)}
              className="w-80"
            >
              {settingsItems.map((item) => (
                <DropdownItem
                  key={item.href}
                  description={item.description}
                  startContent={item.icon}
                  classNames={{
                    base: `gap-4 ${isActive(item.href) ? "text-primary font-semibold" : ""}`,
                  }}
                >
                  {item.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>
      )}

      <NavbarContent justify="end" className="gap-2">
        <NavbarItem>
          <ThemeToggle />
        </NavbarItem>
        <NavbarItem>
          <NavbarUserMenu user={user} />
        </NavbarItem>
      </NavbarContent>

      {user && (
        <NavbarMenu>
          <NavbarMenuItem isActive={isActive("/")}>
            <Link
              as={NextLink}
              color={isActive("/") ? "primary" : "foreground"}
              className={`w-full ${isActive("/") ? "font-semibold" : ""}`}
              href="/"
              size="lg"
            >
              Dashboard
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <span className="text-sm text-gray-500 font-semibold">Co-Location</span>
          </NavbarMenuItem>
          {coLocationItems.map((item, index) => (
            <NavbarMenuItem key={`${item.label}-${index}`} isActive={isActive(item.href)}>
              <Link
                as={NextLink}
                color={isActive(item.href) ? "primary" : "foreground"}
                className={`w-full pl-4 ${isActive(item.href) ? "font-semibold" : ""}`}
                href={item.href}
                size="lg"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem>
            <span className="text-sm text-gray-500 font-semibold">Settings</span>
          </NavbarMenuItem>
          {settingsItems.map((item, index) => (
            <NavbarMenuItem key={`${item.label}-${index}`} isActive={isActive(item.href)}>
              <Link
                as={NextLink}
                color={isActive(item.href) ? "primary" : "foreground"}
                className={`w-full pl-4 ${isActive(item.href) ? "font-semibold" : ""}`}
                href={item.href}
                size="lg"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
      )}
    </Navbar>
  );
}
