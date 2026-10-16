import { NavLink, Outlet } from 'react-router-dom';
import {
  CloudArrowUp24Regular,
  Location24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';
import { Text, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { pontoAmplo, pontoTablet } from '@montaje/ui';
import type { ReactNode } from 'react';

const useClasses = makeStyles({
  app: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: '100%',
    width: '100%',
    maxWidth: '720px',
    marginLeft: 'auto',
    marginRight: 'auto',
    backgroundColor: tokens.colorNeutralBackground3,
    [`@media ${pontoTablet}`]: {
      maxWidth: '1024px',
      boxShadow: tokens.shadow2,
    },
    [`@media ${pontoAmplo}`]: {
      maxWidth: '1240px',
    },
  },
  conteudo: {
    flexGrow: 1,
    paddingBottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
  },
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    maxWidth: '720px',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    backgroundColor: tokens.colorNeutralBackground1,
    borderTopWidth: tokens.strokeWidthThin,
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    boxShadow: tokens.shadow8,
    [`@media ${pontoTablet}`]: {
      maxWidth: '1024px',
      borderTopLeftRadius: tokens.borderRadiusXLarge,
      borderTopRightRadius: tokens.borderRadiusXLarge,
    },
    [`@media ${pontoAmplo}`]: {
      maxWidth: '1240px',
    },
  },
  item: {
    display: 'flex',
    flexGrow: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    textDecorationLine: 'none',
    color: tokens.colorNeutralForeground2,
    transitionProperty: 'color, background-color',
    transitionDuration: '120ms',
    ':hover': { backgroundColor: tokens.colorSubtleBackgroundHover },
  },
  ativo: {
    color: tokens.colorBrandForeground2,
    fontWeight: tokens.fontWeightSemibold,
  },
});

function ItemNav({
  para,
  rotulo,
  icone,
}: {
  para: string;
  rotulo: string;
  icone: ReactNode;
}) {
  const c = useClasses();
  return (
    <NavLink
      to={para}
      className={({ isActive }) => mergeClasses(c.item, isActive && c.ativo)}
    >
      {icone}
      <Text size={200}>{rotulo}</Text>
    </NavLink>
  );
}

export function AppShell() {
  const c = useClasses();
  return (
    <div className={c.app}>
      <main className={c.conteudo}>
        <Outlet />
      </main>

      <nav className={c.nav} aria-label="Navegação principal">
        <ItemNav para="/locais" rotulo="Locais" icone={<Location24Regular />} />
        <ItemNav para="/sincronizacao" rotulo="Envio" icone={<CloudArrowUp24Regular />} />
        <ItemNav para="/config" rotulo="Ajustes" icone={<Settings24Regular />} />
      </nav>
    </div>
  );
}
