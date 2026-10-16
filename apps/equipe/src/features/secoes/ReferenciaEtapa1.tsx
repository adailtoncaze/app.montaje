import { useLiveQuery } from 'dexie-react-hooks';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { Cartao, Selo } from '@montaje/ui';
import { db, type ItemLocal } from '@/db/schema';
import { evidenciaDoItem } from '@/db/repo';
import { useObjectUrl } from '@/lib/use-object-url';

const useClasses = makeStyles({
  grade: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: tokens.spacingHorizontalS,
  },
  figura: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    minWidth: 0,
  },
  imagem: {
    width: '100%',
    aspectRatio: '4 / 3',
    objectFit: 'cover',
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  legenda: {
    color: tokens.colorNeutralForeground3,
    overflowWrap: 'anywhere',
  },
});

/** Uma foto da Etapa 1 usada como referencia (miniatura + nome do item). */
function ReferenciaFoto({ item }: { item: ItemLocal }) {
  const c = useClasses();
  const evidencia = useLiveQuery(() => evidenciaDoItem(item.id), [item.id]);
  const url = useObjectUrl(evidencia?.thumbBlob);

  return (
    <figure className={c.figura}>
      {url ? (
        <img className={c.imagem} src={url} alt={`Referencia: ${item.nome}`} />
      ) : (
        <div className={c.imagem} />
      )}
      <figcaption className={c.legenda}>
        <Text size={200}>{item.nome}</Text>
      </figcaption>
    </figure>
  );
}

/**
 * APP-20 — fotos da Etapa 1 aprovada, mostradas durante a Etapa 2 para comparacao
 * (RF-E32, "referencia aprovada").
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
      descricao="Compare a montagem atual com as fotos aprovadas na Etapa 1."
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
