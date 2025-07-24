"use client";
/*
 * Documentation:
 * Default Page Layout — https://app.subframe.com/b5a91bfb9cba/library?component=Default+Page+Layout_a57b1c43-310a-493f-b807-8cc88e2452cf
 * Sidebar Collapsible — https://app.subframe.com/b5a91bfb9cba/library?component=Sidebar+Collapsible_e732d4fd-dae8-4053-bb88-7c02acab53f9
 * Avatar — https://app.subframe.com/b5a91bfb9cba/library?component=Avatar_bec25ae6-5010-4485-b46b-cf79e3943ab2
 * Dropdown Menu — https://app.subframe.com/b5a91bfb9cba/library?component=Dropdown+Menu_99951515-459b-4286-919e-a89e7549b43b
 */

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as SubframeUtils from "../utils";
import { SidebarCollapsible } from "../components/SidebarCollapsible";
import { FeatherHome } from "@subframe/core";
import { FeatherLibraryBig } from "@subframe/core";
import { FeatherSearch } from "@subframe/core";
import { FeatherBot } from "@subframe/core";
import { Avatar } from "../components/Avatar";
import { FeatherChevronsUpDown } from "@subframe/core";
import { DropdownMenu } from "../components/DropdownMenu";
import { FeatherUserPlus } from "@subframe/core";
import { FeatherSettings } from "@subframe/core";
import { FeatherLogOut } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { useAuth } from "../../components/auth/AuthContext";
import { AuthModal } from "../../components/auth/AuthModal";
import { Button } from "../components/Button";

interface DefaultPageLayoutRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

const DefaultPageLayoutRoot = React.forwardRef((
  { children, className, ...otherProps }: DefaultPageLayoutRootProps,
  ref: React.ForwardedRef<HTMLElement>
) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleSignOut = async () => {
    await signOut();
  };

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };
  return (
    <div
      className={SubframeUtils.twClassNames(
        "flex h-screen w-full items-start",
        className
      )}
      ref={ref as any}
      {...otherProps}
    >
      <SidebarCollapsible
        header={
          <img
            className="h-6 flex-none object-cover"
            src="https://res.cloudinary.com/subframe/image/upload/v1711417507/shared/y2rsnhq3mex4auk54aye.png"
          />
        }
        footer={
          React.createElement(({ onDropdownOpenChange }: { onDropdownOpenChange?: (open: boolean) => void }) => (
            <SubframeCore.DropdownMenu.Root
              onOpenChange={(open) => {
                onDropdownOpenChange?.(open);
              }}
            >
              <SubframeCore.DropdownMenu.Trigger asChild={true}>
                <div className="flex w-full items-center gap-4 cursor-pointer">
                  <div className="flex flex-1 items-center gap-4">
                    <div
                      className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (user) {
                          navigate("/profile");
                        }
                      }}
                    >
                      <Avatar image={user ? (profile?.avatar_url || undefined) : undefined}>
                        {user 
                          ? (profile?.full_name?.[0] || profile?.username?.[0] || user.email?.[0] || 'U')
                          : 'G'
                        }
                      </Avatar>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-caption-bold font-caption-bold text-default-font">
                        {user 
                          ? (profile?.full_name || profile?.username || 'User')
                          : 'Guest'
                        }
                      </span>
                      <span className="text-caption font-caption text-subtext-color">
                        {user 
                          ? (profile?.username || user.email)
                          : 'Not signed in'
                        }
                      </span>
                    </div>
                  </div>
                  <FeatherChevronsUpDown className="text-body font-body text-default-font" />
                </div>
              </SubframeCore.DropdownMenu.Trigger>
              <SubframeCore.DropdownMenu.Portal>
                <SubframeCore.DropdownMenu.Content
                  side="right"
                  align="end"
                  sideOffset={8}
                  className="z-[200]"
                  asChild={true}
                >
                  <DropdownMenu className="z-[200] shadow-xl">
                    {user ? (
                      <>
                        <DropdownMenu.DropdownItem 
                          icon={<FeatherUserPlus />}
                          onClick={() => console.log("Invite team clicked")}
                        >
                          Invite team
                        </DropdownMenu.DropdownItem>
                        <DropdownMenu.DropdownItem 
                          icon={<FeatherSettings />}
                          onClick={() => console.log("Settings clicked")}
                        >
                          Settings
                        </DropdownMenu.DropdownItem>
                        <div className="flex h-px w-full flex-none flex-col items-center gap-2 bg-neutral-200" />
                        <DropdownMenu.DropdownItem 
                          icon={<FeatherLogOut />}
                          onClick={handleSignOut}
                        >
                          Sign out
                        </DropdownMenu.DropdownItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenu.DropdownItem 
                          icon={<FeatherLogOut />}
                          onClick={() => openAuthModal('signin')}
                        >
                          Sign in
                        </DropdownMenu.DropdownItem>
                        <DropdownMenu.DropdownItem 
                          icon={<FeatherUserPlus />}
                          onClick={() => openAuthModal('signup')}
                        >
                          Sign up
                        </DropdownMenu.DropdownItem>
                      </>
                    )}
                  </DropdownMenu>
                </SubframeCore.DropdownMenu.Content>
              </SubframeCore.DropdownMenu.Portal>
            </SubframeCore.DropdownMenu.Root>
          ))
        }
      >
        <SidebarCollapsible.NavItem 
          icon={<FeatherHome />} 
          selected={location.pathname === "/"}
          onClick={() => navigate("/")}
        >
          Create
        </SidebarCollapsible.NavItem>
        <SidebarCollapsible.NavItem 
          icon={<FeatherLibraryBig />}
          selected={location.pathname === "/saved"}
          onClick={() => navigate("/saved")}
        >
          Saved
        </SidebarCollapsible.NavItem>
        <SidebarCollapsible.NavItem 
          icon={<FeatherSearch />}
          selected={location.pathname === "/explore"}
          onClick={() => navigate("/explore")}
        >
          Explore
        </SidebarCollapsible.NavItem>
        <SidebarCollapsible.NavItem icon={<FeatherBot />}>
          Robot Analysis
        </SidebarCollapsible.NavItem>
      </SidebarCollapsible>
      {children ? (
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch overflow-y-auto bg-default-background">
          {children}
        </div>
      ) : null}
      
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
});

export const DefaultPageLayout = DefaultPageLayoutRoot as React.ForwardRefExoticComponent<
  DefaultPageLayoutRootProps & React.RefAttributes<HTMLElement>
>;
