import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  House,
  Landmark,
  LogOut,
  MapPin,
  Menu,
  User as UserIcon,
  X,
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

/**
 * Itens do menu lateral. Novas funcionalidades entram aqui (basta adicionar
 * um grupo ou item) — a navegação fica pronta para crescer.
 */
const NAVEGACAO = [
  { to: '/', rotulo: 'Início', icone: House, exato: true },
  { to: '/locais', rotulo: 'Locais de votação', icone: MapPin, exato: false },
] as const;

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const perfil = useSessao((s) => s.perfil);
  const definirPerfil = useSessao((s) => s.definirPerfil);
  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha a gaveta no mobile ao trocar de rota.
  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  function sair() {
    definirPerfil(null);
    navigate('/login', { replace: true });
  }

  const barraLateral = (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Landmark className="size-4" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-sm font-bold text-foreground">MontaJE</span>
          <span className="text-[11px] text-muted-foreground">Cartório</span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
        >
          <X />
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <span className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Painel
        </span>
        {NAVEGACAO.map(({ to, rotulo, icone: Icone, exato }) => (
          <NavLink
            key={to}
            to={to}
            end={exato}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                isActive &&
                  'bg-primary-subtle text-primary-subtle-foreground hover:bg-primary-subtle hover:text-primary-subtle-foreground',
              )
            }
          >
            <Icone className="size-4 shrink-0" />
            <span className="truncate">{rotulo}</span>
          </NavLink>
        ))}
      </nav>

      {perfil && (
        <div className="shrink-0 border-t border-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary-subtle-foreground">
                  <UserIcon className="size-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {perfil.nome}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {ROTULO_PAPEL[perfil.papel]}
                  </span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[13rem]">
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
        </div>
      )}
    </>
  );

  return (
    <div className="flex min-h-full">
      {menuAberto && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden
          onClick={() => setMenuAberto(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-card transition-transform duration-200 lg:sticky lg:h-screen lg:translate-x-0',
          menuAberto ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {barraLateral}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            onClick={() => setMenuAberto(true)}
          >
            <Menu />
          </Button>
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <Landmark className="size-4 text-primary" />
            MontaJE · Cartório
          </span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
