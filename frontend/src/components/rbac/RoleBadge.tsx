import { RoleBadgeProps } from "../../types/types";

const roleConfig = {
  superadmin: {
    label: "Super Admin",
    bgColor: "bg-gradient-to-r from-red-500 to-pink-500",
    textColor: "text-white",
    borderColor: "border-red-500/30",
    icon: "🛡️"
  },
  merchant: {
    label: "Merchant",
    bgColor: "bg-gradient-to-r from-blue-500 to-indigo-500",
    textColor: "text-white",
    borderColor: "border-blue-500/30",
    icon: "🏪"
  },
  user: {
    label: "User",
    bgColor: "bg-gradient-to-r from-green-500 to-emerald-500",
    textColor: "text-white",
    borderColor: "border-green-500/30",
    icon: "👤"
  }
};

const sizeConfig = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base"
};

export default function RoleBadge({
  role,
  size = "md",
  variant = "solid"
}: RoleBadgeProps) {
  const config = roleConfig[role];
  const sizeClasses = sizeConfig[size];

  if (variant === "outline") {
    return (
      <span className={`
        inline-flex items-center space-x-1 rounded-full border-2
        ${config.borderColor} bg-transparent text-slate-300 font-medium ${sizeClasses}
      `}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  }

  if (variant === "subtle") {
    return (
      <span className={`
        inline-flex items-center space-x-1 rounded-full
        bg-white/10 backdrop-blur-sm text-slate-300 font-medium ${sizeClasses}
      `}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <span className={`
      inline-flex items-center space-x-1 rounded-full
      ${config.bgColor} ${config.textColor} font-semibold shadow-lg ${sizeClasses}
    `}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}