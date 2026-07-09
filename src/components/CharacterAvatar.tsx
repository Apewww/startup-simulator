import { Code, PenTool, Star, Wrench } from 'lucide-react';
import type { EmployeeRole } from '../types';

const ROLE_META: Record<EmployeeRole, { color: string; Icon: typeof Code; label: string }> = {
  Developer: { color: '#3B82F6', Icon: Code, label: 'DEV' },
  Designer: { color: '#EC4899', Icon: PenTool, label: 'DSN' },
  Lead_Developer: { color: '#D97706', Icon: Star, label: 'LEAD' },
  SysAdmin: { color: '#22C55E', Icon: Wrench, label: 'SYS' },
};

export function CharacterAvatar({ role, size = 40 }: { role: EmployeeRole; size?: number }) {
  const meta = ROLE_META[role];
  const { color, Icon, label } = meta;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className="shrink-0"
      aria-label={label}
    >
      {/* chair back */}
      <rect x="20" y="16" width="8" height="16" rx="2.5" fill={color} opacity={0.45} />
      {/* body */}
      <path d="M15 38 C15 29 19 25 24 25 C29 25 33 29 33 38 Z" fill={color} opacity={0.95} />
      {/* head */}
      <circle cx="24" cy="17" r="7" fill={color} />
      {/* visor accent */}
      <rect x="19" y="13" width="10" height="4" rx="2" fill="#1A1D24" opacity={0.55} />
      {/* desk */}
      <rect x="9" y="37" width="30" height="6" rx="2" fill="#2C3038" stroke={color} strokeWidth={1} />
      {/* role badge */}
      <circle cx="39" cy="9" r="6" fill="#1A1D24" stroke={color} strokeWidth={1.5} />
      <foreignObject x="34" y="4" width="10" height="10">
        <div className="w-full h-full flex items-center justify-center">
          <Icon className="w-3 h-3" style={{ color }} strokeWidth={2.5} />
        </div>
      </foreignObject>
    </svg>
  );
}

export function roleColor(role: EmployeeRole): string {
  return ROLE_META[role].color;
}

export function roleLabel(role: EmployeeRole): string {
  return ROLE_META[role].label;
}