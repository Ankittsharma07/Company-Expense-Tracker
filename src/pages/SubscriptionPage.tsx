import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check } from 'lucide-react';

const Plan = ({ name, price, features, current, recommended }: any) => (
  <Card className={`relative ${recommended ? 'border-teal-500/60 ring-1 ring-teal-500/20' : ''}`}>
    {recommended && (
      <div className="absolute top-0 right-0 -mt-3 mr-4 px-3 py-1 bg-teal-600 text-white text-xs font-bold uppercase tracking-wide rounded-full shadow-[0_10px_20px_rgba(13,148,136,0.3)]">
        Recommended
      </div>
    )}
    <CardHeader>
      <h3 className="text-lg font-semibold text-slate-900 font-display">{name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-slate-900 font-display">${price}</span>
        <span className="text-slate-500">/month</span>
      </div>
    </CardHeader>
    <CardContent>
      <ul className="space-y-3 mb-6">
        {features.map((feature: string) => (
          <li key={feature} className="flex items-center gap-3 text-sm text-slate-600">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50/80 text-emerald-600 flex items-center justify-center">
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
    <div className="max-w-5xl mx-auto space-y-10 py-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900 font-display">Subscription & Billing</h1>
        <p className="text-slate-500">Manage your plan and billing details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
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
