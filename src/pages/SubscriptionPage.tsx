import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check } from 'lucide-react';

const Plan = ({ name, price, features, current, recommended }: any) => (
  <Card className={`relative ${recommended ? 'border-indigo-500 ring-1 ring-indigo-500' : ''}`}>
    {recommended && (
      <div className="absolute top-0 right-0 -mt-3 mr-4 px-3 py-1 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wide rounded-full">
        Recommended
      </div>
    )}
    <CardHeader>
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">${price}</span>
        <span className="text-gray-500">/month</span>
      </div>
    </CardHeader>
    <CardContent>
      <ul className="space-y-3 mb-6">
        {features.map((feature: string) => (
          <li key={feature} className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check className="w-3 h-3" />
            </div>
            {feature}
          </li>
        ))}
      </ul>
      <Button 
        variant={current ? "outline" : "primary"} 
        className="w-full"
        disabled={current}
      >
        {current ? "Current Plan" : "Upgrade"}
      </Button>
    </CardContent>
  </Card>
);

export const SubscriptionPage = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Subscription & Billing</h1>
        <p className="text-gray-500">Manage your plan and billing details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Plan 
          name="Starter" 
          price="0" 
          features={["Up to 5 users", "Basic reporting", "1 month history"]} 
        />
        <Plan 
          name="Pro" 
          price="29" 
          features={["Up to 20 users", "Advanced analytics", "Export to Excel/PDF", "Unlimited history"]} 
          current
          recommended
        />
        <Plan 
          name="Enterprise" 
          price="99" 
          features={["Unlimited users", "Custom integrations", "Dedicated support", "SSO Authentication"]} 
        />
      </div>
    </div>
  );
};
