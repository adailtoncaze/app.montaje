import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Check,
  ChevronDown,
  House,
  Landmark,
  LogOut,
  type LucideIcon,
  MapPin,
  Menu,
  Monitor,
  Moon,
  Sun,
  UsersRound,
  X,
} from 'lucide-react';
import { ROTULO_PAPEL } from '@montaje/core';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ListaMigalhas, type ItemBreadcrumb } from '@/components/page-header';
import { useSessao } from '@/features/auth/store';
import { useTemaStore, type ModoTema } from '@/lib/tema';
import { cn } from '@/lib/utils';

interface ItemNavegacao {
  to: string;
  rotulo: string;
  icone: LucideIcon;
  exato?: boolean;
}

interface GrupoNavegacao {
  rotulo: string;
  itens: ItemNavegacao[];
  /** Grupos de cadastro: restritos ao papel administrador. */
  restrito?: boolean;
}

/**
 * Grupos do menu lateral. Novas funcionalidades entram aqui (basta adicionar um
 * grupo ou item) — a navegação fica pronta para crescer.
 */
const NAVEGACAO: GrupoNavegacao[] = [
  {
    rotulo: 'Painel',
    itens: [
      { to: '/', rotulo: 'Início', icone: House, exato: true },
      { to: '/locais', rotulo: 'Locais de votação', icone: MapPin, exato: false },
    ],
  },
  {
    rotulo: 'Gestão',
    restrito: true,
    itens: [
      { to: '/equipes', rotulo: 'Equipes', icone: UsersRound, exato: false },
      { to: '/cronograma', rotulo: 'Cronograma', icone: CalendarDays, exato: false },
    ],
  },
];

const OPCOES_TEMA: { valor: ModoTema; rotulo: string; icone: LucideIcon }[] = [
  { valor: 'claro', rotulo: 'Claro', icone: Sun },
  { valor: 'escuro', rotulo: 'Escuro', icone: Moon },
  { valor: 'sistema', rotulo: 'Seguir o sistema', icone: Monitor },
];

/** Traduz a rota atual em uma trilha estática (Início › Locais de votação › …). */
function migalhasDaRota(pathname: string): ItemBreadcrumb[] {
  const segmentos = pathname.split('/').filter(Boolean);
  if (segmentos.length === 0) return [];

  const migalhas: ItemBreadcrumb[] = [{ rotulo: 'Início', to: '/' }];

  if (segmentos[0] === 'locais') {
    migalhas.push({ rotulo: 'Locais de votação', to: '/locais' });
    if (segmentos.length >= 2) {
      const caminhoLocal = `/locais/${segmentos[1]}`;
      if (segmentos.length === 2) {
        migalhas.push({ rotulo: 'Detalhe do local' });
      } else {
        migalhas.push({ rotulo: 'Detalhe do local', to: caminhoLocal });
        migalhas.push({ rotulo: 'Seção' });
      }
    }
  } else if (segmentos[0] === 'equipes') {
    migalhas.push({ rotulo: 'Equipes' });
  } else if (segmentos[0] === 'cronograma') {
    migalhas.push({ rotulo: 'Cronograma' });
  }

  return migalhas;
}

/** Observa o tema efetivo no <html> (inclui a preferência do sistema). */
function useTemaEscuro() {
  const tema = useTemaStore((s) => s.tema);
  const [escuro, setEscuro] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );

  useEffect(() => {
    setEscuro(document.documentElement.classList.contains('dark'));
  }, [tema]);

  useEffect(() => {
    if (tema !== 'sistema') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const ouvir = () => setEscuro(document.documentElement.classList.contains('dark'));
    media.addEventListener('change', ouvir);
    return () => media.removeEventListener('change', ouvir);
  }, [tema]);

  return escuro;
}

/** Menu do usuário com seleção de tema e saída — compartilhado pela barra e pelo rodapé. */
function MenuUsuario({
  align = 'end',
  children,
}: {
  align?: 'start' | 'end';
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const perfil = useSessao((s) => s.perfil);
  const definirPerfil = useSessao((s) => s.definirPerfil);
  const tema = useTemaStore((s) => s.tema);
  const definirTema = useTemaStore((s) => s.definirTema);

  function sair() {
    definirPerfil(null);
    navigate('/login', { replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-60">
        {perfil && (
          <>
            <DropdownMenuLabel>
              <span className="block truncate text-sm font-semibold text-foreground">
                {perfil.nome}
              </span>
              <span className="block truncate">{ROTULO_PAPEL[perfil.papel]}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel>Aparência</DropdownMenuLabel>
        {OPCOES_TEMA.map(({ valor, rotulo, icone: Icone }) => (
          <DropdownMenuItem key={valor} onSelect={() => definirTema(valor)}>
            <Icone />
            <span className="flex-1">{rotulo}</span>
            {tema === valor && <Check className="text-primary" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={sair}>
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Conteúdo da barra lateral (usado no desktop e na gaveta do mobile). */
function ConteudoLateral({ onFechar }: { onFechar?: () => void }) {
  const perfil = useSessao((s) => s.perfil);

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-pressed text-primary-foreground shadow-teams-2">
          <Landmark className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
            MontaJE
          </span>
          <span className="truncate text-[11px] font-medium text-muted-foreground">Cartório</span>
        </span>
        {onFechar && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            aria-label="Fechar menu"
            onClick={onFechar}
          >
            <X />
          </Button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-3" aria-label="Navegação principal">
        {NAVEGACAO.filter(
          (grupo) => !grupo.restrito || perfil?.papel === 'administrador',
        ).map((grupo) => (
          <div key={grupo.rotulo} className="flex flex-col gap-1">
            <span className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {grupo.rotulo}
            </span>
            {grupo.itens.map(({ to, rotulo, icone: Icone, exato }) => (
              <NavLink
                key={to}
                to={to}
                end={exato}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground',
                    isActive &&
                      "bg-primary-subtle text-primary-subtle-foreground hover:bg-primary-subtle hover:text-primary-subtle-foreground before:absolute before:left-1 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary before:content-['']",
                  )
                }
              >
                <Icone className="size-4 shrink-0" />
                <span className="truncate">{rotulo}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {perfil && (
        <div className="shrink-0 border-t border-border p-3">
          <MenuUsuario align="start">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-2.5 text-left shadow-sm transition-colors duration-150 hover:bg-accent"
              aria-label={`Menu do usuário — ${perfil.nome}`}
            >
              <Avatar nome={perfil.nome} tamanho="sm" />
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
          </MenuUsuario>
        </div>
      )}
    </>
  );
}

export function Layout() {
  const location = useLocation();
  const definirTema = useTemaStore((s) => s.definirTema);
  const escuro = useTemaEscuro();
  const [menuAberto, setMenuAberto] = useState(false);

  const migalhas = useMemo(() => migalhasDaRota(location.pathname), [location.pathname]);

  // Fecha a gaveta no mobile ao trocar de rota.
  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  function alternarTema() {
    definirTema(escuro ? 'claro' : 'escuro');
  }

  const rotuloTema = escuro ? 'Ativar tema claro' : 'Ativar tema escuro';

  return (
    <div className="flex min-h-full">
      {menuAberto && (
        <div
          className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm lg:hidden"
          aria-hidden
          onClick={() => setMenuAberto(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-border bg-sidebar transition-transform duration-200 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0',
          menuAberto ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <ConteudoLateral onFechar={() => setMenuAberto(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra móvel: menu (gaveta) + marca + tema */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            onClick={() => setMenuAberto(true)}
          >
            <Menu />
          </Button>
          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Landmark className="size-4" />
            </span>
            <span className="truncate">MontaJE · Cartório</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            aria-label={rotuloTema}
            onClick={alternarTema}
          >
            {escuro ? <Sun /> : <Moon />}
          </Button>
        </header>

        {/* Barra superior (desktop): apenas o caminho da tela atual. */}
        <header className="sticky top-0 z-30 hidden h-16 shrink-0 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur lg:flex xl:px-8">
          <div className="flex min-w-0 items-center">
            <ListaMigalhas itens={migalhas} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
