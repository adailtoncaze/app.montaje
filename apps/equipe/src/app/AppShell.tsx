import { NavLink, Outlet } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  CloudArrowUp24Regular,
  Location24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';
import { Badge, Text, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { pontoAmplo, pontoTablet } from '@montaje/ui';
import type { ReactNode } from 'react';
import { useSyncEngine } from '@/features/sync/useSyncEngine';
import { db } from '@/db/schema';

const LARGURA_BASE = '720px';
const LARGURA_TABLET = '1024px';
const LARGURA_AMPLA = '1240px';

const useClasses = makeStyles({
  app: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: '100%',
    width: '100%',
    maxWidth: LARGURA_BASE,
    marginLeft: 'auto',
    marginRight: 'auto',
    backgroundColor: tokens.colorNeutralBackground2,
    [`@media ${pontoTablet}`]: {
      maxWidth: LARGURA_TABLET,
      boxShadow: tokens.shadow8,
    },
    [`@media ${pontoAmplo}`]: {
      maxWidth: LARGURA_AMPLA,
    },
  },
  conteudo: {
    flexGrow: 1,
    paddingBottom: `calc(88px + env(safe-area-inset-bottom, 0px))`,
  },
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'stretch',
    maxWidth: LARGURA_BASE,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    backgroundColor: tokens.colorNeutralBackground1,
    borderTopWidth: tokens.strokeWidthThin,
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    boxShadow: tokens.shadow8,
    [`@media ${pontoTablet}`]: {
      maxWidth: LARGURA_TABLET,
      borderTopLeftRadius: tokens.borderRadiusLarge,
      borderTopRightRadius: tokens.borderRadiusLarge,
      paddingLeft: tokens.spacingHorizontalM,
      paddingRight: tokens.spacingHorizontalM,
    },
    [`@media ${pontoAmplo}`]: {
      maxWidth: LARGURA_AMPLA,
    },
  },
  item: {
    display: 'flex',
    flexGrow: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    minHeight: '56px',
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    textDecorationLine: 'none',
    color: tokens.colorNeutralForeground2,
    transitionProperty: 'color',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    ':hover': { color: tokens.colorNeutralForeground1 },
    ':focus-visible': {
      outlineWidth: '2px',
      outlineStyle: 'solid',
      outlineColor: tokens.colorStrokeFocus2,
      outlineOffset: '-2px',
      borderRadius: tokens.borderRadiusLarge,
    },
  },
  ativo: {
    color: tokens.colorBrandForeground2,
  },
  pilula: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '56px',
    height: '32px',
    borderRadius: tokens.borderRadiusCircular,
    transitionProperty: 'background-color',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
  },
  pilulaAtiva: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  iconeWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-10px',
  },
});

function ItemNav({
  para,
  rotulo,
  icone,
  contagem,
}: {
  para: string;
  rotulo: string;
  icone: ReactNode;
  contagem?: number;
}) {
  const c = useClasses();
  return (
    <NavLink
      to={para}
      className={({ isActive }) => mergeClasses(c.item, isActive && c.ativo)}
    >
      {({ isActive }) => (
        <>
          <span className={mergeClasses(c.pilula, isActive && c.pilulaAtiva)}>
            <span className={c.iconeWrap}>
              {icone}
              {contagem != null && contagem > 0 && (
                <Badge className={c.badge} appearance="filled" color="brand" size="small">
                  {contagem > 9 ? '9+' : contagem}
                </Badge>
              )}
            </span>
          </span>
          <Text size={200} weight={isActive ? 'semibold' : 'regular'}>
            {rotulo}
          </Text>
        </>
      )}
    </NavLink>
  );
}

export function AppShell() {
  const c = useClasses();
  // APP-24: envio automático enquanto o app estiver aberto (monta uma vez por sessão).
  useSyncEngine();

  // Contagem apenas leitura da fila de envio, para o badge da navegação.
  const pendentes = useLiveQuery(
    () => db.outbox.where('estado').anyOf('pendente_envio', 'erro').count(),
    [],
    0,
  );

  return (
    <div className={c.app}>
      <main className={c.conteudo}>
        <Outlet />
      </main>

      <nav className={c.nav} aria-label="Navegação principal">
        <ItemNav para="/locais" rotulo="Locais" icone={<Location24Regular />} />
        <ItemNav
          para="/sincronizacao"
          rotulo="Envio"
          icone={<CloudArrowUp24Regular />}
          contagem={pendentes}
        />
        <ItemNav para="/config" rotulo="Ajustes" icone={<Settings24Regular />} />
      </nav>
    </div>
  );
}
