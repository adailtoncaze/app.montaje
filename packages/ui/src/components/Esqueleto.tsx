import {
  Skeleton,
  SkeletonItem,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components';

const useClasses = makeStyles({
  cartao: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusXLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  linhas: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    flexGrow: 1,
    minWidth: 0,
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
});

export interface EsqueletoProps {
  /** Largura do item (qualquer valor CSS). Padrão: `100%`. */
  largura?: string;
  /** Altura do item (qualquer valor CSS). Padrão: `16px`. */
  altura?: string;
  /** Formato circular (avatares, medalhões). */
  circular?: boolean;
  className?: string;
}

/** Bloco de carregamento baseado em `Skeleton`/`SkeletonItem` do Fluent. */
export function Esqueleto({
  largura = '100%',
  altura = '16px',
  circular = false,
  className,
}: EsqueletoProps) {
  return (
    <Skeleton className={className} appearance="translucent">
      <SkeletonItem
        shape={circular ? 'circle' : 'rectangle'}
        style={{ width: largura, height: altura }}
      />
    </Skeleton>
  );
}

export interface EsqueletoCartaoProps {
  className?: string;
}

/** Placeholder de cartão de lista (medalhão + duas linhas). */
export function EsqueletoCartao({ className }: EsqueletoCartaoProps) {
  const c = useClasses();
  return (
    <div className={mergeClasses(c.cartao, className)}>
      <Esqueleto largura="44px" altura="44px" circular />
      <div className={c.linhas}>
        <Esqueleto largura="55%" altura="18px" />
        <Esqueleto largura="85%" altura="14px" />
      </div>
    </div>
  );
}

export interface EsqueletoListaProps {
  /** Quantidade de itens exibidos. Padrão: 4. */
  itens?: number;
  className?: string;
}

/** Lista de placeholders para estados de carregamento. */
export function EsqueletoLista({ itens = 4, className }: EsqueletoListaProps) {
  const c = useClasses();
  const total = Math.max(0, Math.floor(itens));
  return (
    <div className={mergeClasses(c.lista, className)} aria-hidden="true">
      {Array.from({ length: total }, (_valor, indice) => (
        <EsqueletoCartao key={indice} />
      ))}
    </div>
  );
}
