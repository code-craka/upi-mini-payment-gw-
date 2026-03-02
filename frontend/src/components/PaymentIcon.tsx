import React from 'react';

// A mapping from payment method name to its logo component.
// Since we don't have actual SVGs, we'll create simple placeholders.
const logos: Record<string, React.ReactNode> = {
  "PhonePe": <div className="w-6 h-6 bg-purple-600 rounded-full" />,
  "Paytm": <div className="w-6 h-6 bg-blue-500 rounded-full" />,
  "Google Pay": <div className="w-6 h-6 bg-green-500 rounded-full" />,
  "UPI": <div className="w-6 h-6 bg-gray-400 rounded-full" />,
};

// Default icon if a method is not found in the map.
const DefaultIcon = <div className="w-6 h-6 bg-gray-200 rounded-full" />;

interface PaymentIconProps {
  method: string;
}

const PaymentIcon: React.FC<PaymentIconProps> = ({ method }) => {
  const icon = logos[method] || DefaultIcon;
  return <>{icon}</>;
};

export default PaymentIcon;
