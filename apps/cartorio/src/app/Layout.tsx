import { NavLink, Outlet } from 'react-router-dom';
import { Text, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import {
  ClipboardTaskListLtr24Regular,
  Home24Regular,
  SignOut24Regular,
} from '@fluentui/react-icons';
import { Botao, CabecalhoApp } from '@montaje/ui';
import { useSessao } from '@/features/auth/store';

const useClasses = makeStyles({
  shell: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottomWidth: tokens.strokeWidthThin,
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
    overflowX: 'auto',
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    textDecorationLine: 'none',
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
  },
  ativo: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontWeight: tokens.fontWeightSemibold,
  },
  espaco: {
    marginLeft: 'auto',
  },
  usuario: {
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
  },
  conteudo: {
    flexGrow: 1,
    width: '100%',
    maxWidth: '1100px',
    marginLeft: 'auto',
    marginRight: 'auto',
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
});

export function Layout() {
  const c = useClasses();
  const perfil = useSessao((s) => s.perfil);
  const definirPerfil = useSessao((s) => s.definirPerfil);

  return (
    <div className={c.shell}>
      <CabecalhoApp titulo="MontaJE · Cartório" subtitulo="Painel de validação" />

      <nav className={c.nav} aria-label="Navegação do painel">
        <NavLink
          to="/"
          end
          className={({ isActive }) => mergeClasses(c.link, isActive && c.ativo)}
        >
          <Home24Regular />
          Início
        </NavLink>
        <NavLink
          to="/secoes"
          className={({ isActive }) => mergeClasses(c.link, isActive && c.ativo)}
        >
          <ClipboardTaskListLtr24Regular />
          Seções
        </NavLink>

        <span className={c.espaco} />
        {perfil && (
          <Text size={200} className={c.usuario}>
            {perfil.nome}
          </Text>
        )}
        <Botao
          variante="sutil"
          icon={<SignOut24Regular />}
          onClick={() => definirPerfil(null)}
        >
          Sair
        </Botao>
      </nav>

      <main className={c.conteudo}>
        <Outlet />
      </main>
    </div>
  );
}
