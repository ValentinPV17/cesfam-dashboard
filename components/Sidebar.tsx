'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard', icon: '⊞' },
  { href: '/movimientos', label: 'Movimientos', icon: '≡' },
  { href: '/estadisticas', label: 'Estadísticas', icon: '▦' },
  { href: '/informe', label: 'Generar Informe', icon: '⎙' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 bg-[#1e3a5f] min-h-screen flex flex-col py-5 px-3">
      <div className="px-2 mb-7">
        <p className="text-blue-300 text-xs font-medium uppercase tracking-widest">CESFAM</p>
        <p className="text-white text-sm font-medium mt-0.5">Control de Vehículos</p>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-blue-500 text-white font-medium'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pt-4 border-t border-white/10">
        <p className="text-blue-300 text-xs">Actualización cada 30s</p>
        <p className="text-blue-400 text-xs mt-0.5">AppSheet → Google Sheets</p>
      </div>
    </aside>
  );
}
