"use client";
import React, { useState } from "react";
import ChangePasswordPage from "../change-password/page";
import PersonalInfoPage from "../personal-information/page";
import ProfilePicture from "./profile-picture";

const SettingsTabs = () => {
  const [isActive, setIsActive] = useState("personal-information");
  return (
    <div>
      {/* sub-pages */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pt-8">
          <button
            className={`md:col-span-1 w-full h-[48px] text-base text-primary rounded-[6px] leading-[120%] font-semibold border border-primary py-3 px-7 ${
              isActive === "personal-information" &&
              "bg-primary text-white rounded-[6px] py-3 px-7"
            }`}
            onClick={() => setIsActive("personal-information")}
          >
            Personal Information
          </button>
          <button
            className={`md:col-span-1 w-full h-[48px] text-base text-primary rounded-[6px] leading-[120%] font-semibold border border-primary py-3 px-7 ${
              isActive === "change-password" &&
              "bg-primary text-white rounded-[6px] py-3 px-7"
            }`}
            onClick={() => setIsActive("change-password")}
          >
            Change Password
          </button>
        </div>

        <div className="px-6 pt-6">
          <ProfilePicture />
        </div>

        <div className="mt-6">
          {isActive === "personal-information" && (
            <div className="px-6">
              <PersonalInfoPage />
            </div>
          )}

          {isActive === "change-password" && (
            <div className="px-6">
              <ChangePasswordPage />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsTabs;
