import { useState } from 'react';

interface CommandesProcessDiagramProps {
  selectedOrderId: number | null;
  onSelectOrder: (orderId: number | null) => void;
}

interface ProcessStep {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

const onlineProcess: ProcessStep[] = [
  { label: "Commande", icon: "fa-shopping-cart", color: "#10b981", bgColor: "rgba(16,185,129,0.15)" },
  { label: "Paiement", icon: "fa-credit-card", color: "#34d399", bgColor: "rgba(52,211,153,0.15)" },
  { label: "Livraison", icon: "fa-truck", color: "#60a5fa", bgColor: "rgba(59,130,246,0.15)" },
  { label: "Validation", icon: "fa-check-circle", color: "#a78bfa", bgColor: "rgba(167,139,250,0.15)" },
  { label: "Devis", icon: "fa-file-invoice-dollar", color: "#f59e0b", bgColor: "rgba(245,158,11,0.15)" },
  { label: "Installation", icon: "fa-tools", color: "#f87171", bgColor: "rgba(248,113,113,0.15)" },
  { label: "SAV gratuit", icon: "fa-headset", color: "#8b5cf6", bgColor: "rgba(139,92,246,0.15)" }
];

const terrainProcess: ProcessStep[] = [
  { label: "RDV", icon: "fa-calendar-alt", color: "#fbbf24", bgColor: "rgba(251,191,36,0.15)" },
  { label: "Visite", icon: "fa-clipboard-check", color: "#34d399", bgColor: "rgba(52,211,153,0.15)" },
  { label: "Validation", icon: "fa-check-circle", color: "#a78bfa", bgColor: "rgba(167,139,250,0.15)" },
  { label: "Commande", icon: "fa-shopping-cart", color: "#10b981", bgColor: "rgba(16,185,129,0.15)" },
  { label: "Devis", icon: "fa-file-invoice-dollar", color: "#f59e0b", bgColor: "rgba(245,158,11,0.15)" },
  { label: "Installation", icon: "fa-tools", color: "#f87171", bgColor: "rgba(248,113,113,0.15)" }
];

export const CommandesProcessDiagram = ({ selectedOrderId, onSelectOrder }: CommandesProcessDiagramProps) => {
  // In a real implementation, we would determine the current step based on the selected order's status
  // For now, we'll simulate based on selection
  const getCurrentStepIndex = (orderId: number | null, process: ProcessStep[]): number => {
    if (!orderId) return -1;
    // This would be based on actual order status in a real implementation
    // For simulation, we'll return a random step or based on some logic
    return Math.min(Math.floor(Math.random() * process.length), process.length - 1);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl p-4" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
        <h4 className="font-semibold text-green-300 mb-2 flex items-center space-x-2 text-sm">
          <i className="fas fa-shopping-cart text-green-400"></i>
          <span>Processus achat en ligne</span>
        </h4>
        <div className="flex flex-wrap gap-1.5 items-center text-xs text-green-300">
          {onlineProcess.map((step, index) => {
            const isCurrentStep = selectedOrderId !== null && index === getCurrentStepIndex(selectedOrderId, onlineProcess);
            const isCompleted = selectedOrderId !== null && index < getCurrentStepIndex(selectedOrderId, onlineProcess);

            if (index % 2 === 1 && index > 0) { // Arrow steps
              return <i className="fas fa-arrow-right text-green-500/50 text-[10px]"></i>;
            }

            return (
              <span
                key={index}
                className={`px-2 py-1 rounded-lg font-medium cursor-pointer hover:scale-105 transition-transform`}
                style={{
                  background: isCurrentStep
                    ? `${step.bgColor}0.3`
                    : isCompleted
                      ? `${step.bgColor}0.2`
                      : `${step.bgColor}0.1`,
                  border: `1px solid ${isCurrentStep ? step.color : 'rgba(52,211,153,0.2)'}`,
                  color: isCurrentStep ? step.color : isCompleted ? '#60a5fa' : 'text-green-300'
                }}
                onClick={() => {
                  // In a real implementation, clicking a step might show more details
                  onSelectOrder(selectedOrderId); // Just maintain selection for now
                }}
              >
                {step.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <h4 className="font-semibold text-blue-300 mb-2 flex items-center space-x-2 text-sm">
          <i className="fas fa-map-marked-alt text-blue-400"></i>
          <span>Processus terrain (RDV)</span>
        </h4>
        <div className="flex flex-wrap gap-1.5 items-center text-xs text-blue-300">
          {terrainProcess.map((step, index) => {
            const isCurrentStep = selectedOrderId !== null && index === getCurrentStepIndex(selectedOrderId, terrainProcess);
            const isCompleted = selectedOrderId !== null && index < getCurrentStepIndex(selectedOrderId, terrainProcess);

            if (index % 2 === 1 && index > 0) { // Arrow steps
              return <i className="fas fa-arrow-right text-blue-500/50 text-[10px]"></i>;
            }

            return (
              <span
                key={index}
                className={`px-2 py-1 rounded-lg font-medium cursor-pointer hover:scale-105 transition-transform`}
                style={{
                  background: isCurrentStep
                    ? `${step.bgColor}0.3`
                    : isCompleted
                      ? `${step.bgColor}0.2`
                      : `${step.bgColor}0.1`,
                  border: `1px solid ${isCurrentStep ? step.color : 'rgba(59,130,246,0.2)'}`,
                  color: isCurrentStep ? step.color : isCompleted ? '#60a5fa' : 'text-blue-300'
                }}
                onClick={() => {
                  // In a real implementation, clicking a step might show more details
                  onSelectOrder(selectedOrderId); // Just maintain selection for now
                }}
              >
                {step.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};