import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Spinner,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Image24Regular } from '@fluentui/react-icons';
import { Botao, Cartao, Selo, pontoTablet } from '@montaje/ui';
import { db, type ItemLocal } from '@/db/schema';
import { evidenciaDoItem } from '@/db/repo';
import { useObjectUrl } from '@/lib/use-object-url';

const useClasses = makeStyles({
  grade: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: tokens.spacingHorizontalS,
    [`@media ${pontoTablet}`]: {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: tokens.spacingHorizontalM,
    },
  },
  figura: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    minWidth: 0,
    margin: 0,
  },
  miniatura: {
    display: 'block',
    padding: 0,
    border: 'none',
    background: 'none',
    cursor: 'zoom-in',
    minHeight: '44px',
    borderRadius: tokens.borderRadiusLarge,
    ':focus-visible': {
      outlineWidth: '2px',
      outlineStyle: 'solid',
      outlineColor: tokens.colorStrokeFocus2,
      outlineOffset: '2px',
    },
  },
  imagem: {
    display: 'block',
    width: '100%',
    aspectRatio: '4 / 3',
    objectFit: 'cover',
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground3,
    transitionProperty: 'transform, box-shadow',
    transitionDuration: tokens.durationNormal,
    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: tokens.shadow8,
    },
  },
  imagemVazia: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    aspectRatio: '4 / 3',
    borderRadius: tokens.borderRadiusLarge,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground4,
  },
  legenda: {
    color: tokens.colorNeutralForeground3,
    overflowWrap: 'anywhere',
  },
  dialogo: {
    maxWidth: '720px',
    width: '100%',
  },
  dialogoConteudo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
  },
  imagemCheia: {
    display: 'block',
    width: '100%',
    maxHeight: '70vh',
    objectFit: 'contain',
    borderRadius: tokens.borderRadiusLarge,
  },
});

/** Uma foto da Etapa 1 usada como referência (miniatura + lightbox). */
function ReferenciaFoto({ item }: { item: ItemLocal }) {
  const c = useClasses();
  const [aberto, setAberto] = useState(false);
  const evidencia = useLiveQuery(() => evidenciaDoItem(item.id), [item.id]);
  const mini = useObjectUrl(evidencia?.thumbBlob);
  // Só cria a URL em tamanho cheio enquanto o lightbox estiver aberto.
  const cheia = useObjectUrl(aberto ? evidencia?.blob ?? evidencia?.thumbBlob ?? null : null);

  return (
    <figure className={c.figura}>
      <button
        type="button"
        className={c.miniatura}
        onClick={() => setAberto(true)}
        aria-label={`Ampliar foto: ${item.nome}`}
      >
        {mini ? (
          <img className={c.imagem} src={mini} alt={`Referência: ${item.nome}`} />
        ) : (
          <span className={c.imagemVazia}>
            <Image24Regular />
          </span>
        )}
      </button>
      <figcaption className={c.legenda}>
        <Text size={200}>{item.nome}</Text>
      </figcaption>

      <Dialog
        open={aberto}
        onOpenChange={(_evento, dados) => {
          if (!dados.open) setAberto(false);
        }}
      >
        <DialogSurface className={c.dialogo}>
          <DialogBody>
            <DialogTitle>{item.nome}</DialogTitle>
            <DialogContent className={c.dialogoConteudo}>
              {cheia ? (
                <img className={c.imagemCheia} src={cheia} alt={item.nome} />
              ) : (
                <Spinner label="Carregando foto…" />
              )}
            </DialogContent>
            <DialogActions>
              <Botao variante="secundario" onClick={() => setAberto(false)}>
                Fechar
              </Botao>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </figure>
  );
}

/**
 * APP-20 — fotos da Etapa 1 aprovada, mostradas durante a Etapa 2 para comparação
 * (RF-E32, "referência aprovada").
 */
export function ReferenciaEtapa1({ secaoId }: { secaoId: string }) {
  const c = useClasses();
  const fotos = useLiveQuery(
    () =>
      db.itens
        .where('secao_id')
        .equals(secaoId)
        .and((i) => i.etapa === 1 && i.tipo === 'foto')
        .toArray(),
    [secaoId],
    [],
  );

  const ordenadas = [...fotos].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  return (
    <Cartao
      titulo="Referência da Etapa 1"
      descricao="Toque em uma foto para ampliar e comparar com a montagem atual."
      acao={<Selo texto={`${ordenadas.length} fotos`} tom="marca" />}
    >
      {ordenadas.length === 0 ? (
        <Text size={200} className={c.legenda}>
          Nenhuma foto da Etapa 1 disponível neste aparelho.
        </Text>
      ) : (
        <div className={c.grade}>
          {ordenadas.map((item) => (
            <ReferenciaFoto key={item.id} item={item} />
          ))}
        </div>
      )}
    </Cartao>
  );
}
