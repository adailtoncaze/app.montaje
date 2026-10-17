import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  House,
  Landmark,
  LogOut,
  MapPin,
  User as UserIcon,
} from 'lucide-react';
import { ROTULO_PAPEL } from '@montaje/core';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSessao } from '@/features/auth/store';
import { cn } from '@/lib/utils';

const NAVEGACAO = [
  { to: '/', rotulo: 'Início', icone: House, exato: true },
  { to: '/locais', rotulo: 'Locais de votação', icone: MapPin, exato: false },
] as const;

export function Layout() {
  const navigate = useNavigate();
  const perfil = useSessao((s) => s.perfil);
  const definirPerfil = useSessao((s) => s.definirPerfil);

  function sair() {
    definirPerfil(null);
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Landmark className="size-4" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-bold text-foreground">MontaJE</span>
              <span className="text-[11px] text-muted-foreground">Cartório</span>
            </span>
          </Link>

          <nav className="ml-1 flex items-center gap-1 overflow-x-auto">
            {NAVEGACAO.map((item) => {
              const Icone = item.icone;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exato}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                      isActive &&
                        'bg-primary-subtle text-primary-subtle-foreground hover:bg-primary-subtle hover:text-primary-subtle-foreground',
                    )
                  }
                >
                  <Icone className="size-4" />
                  <span className="hidden sm:inline">{item.rotulo}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {perfil && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <UserIcon />
                    <span className="hidden max-w-[10rem] truncate sm:inline">{perfil.nome}</span>
                    <ChevronDown className="opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    <span className="block font-semibold text-foreground">{perfil.nome}</span>
                    <span className="block">{ROTULO_PAPEL[perfil.papel]}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={sair}>
                    <LogOut />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
