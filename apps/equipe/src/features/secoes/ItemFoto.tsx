import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState, type ChangeEvent } from 'react';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import {
  ArrowClockwise24Regular,
  Camera24Regular,
  Delete24Regular,
  Location24Regular,
} from '@fluentui/react-icons';
import { Aviso, Botao, Cartao, Medalhao, Selo } from '@montaje/ui';
import { db, type ItemLocal } from '@/db/schema';
import { marcarEmMontagem, removerFotoDoItem, salvarFotoDoItem } from '@/db/repo';
import { obterLocalizacao } from '@/features/midia/geo';
import { useSessao } from '@/features/auth/store';
import { useObjectUrl } from '@/lib/use-object-url';

const useClasses = makeStyles({
  corpo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  previa: {
    width: '100%',
    aspectRatio: '4 / 3',
    objectFit: 'cover',
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  info: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
    color: tokens.colorNeutralForeground3,
  },
  acoes: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  oculto: {
    display: 'none',
  },
});

function formatarQuando(iso: string | null): string {
  if (!iso) return '';
  const data = new Date(iso);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ItemFoto({
  item,
  secaoId,
  somenteLeitura = false,
}: {
  item: ItemLocal;
  secaoId: string;
  somenteLeitura?: boolean;
}) {
  const c = useClasses();
  const perfil = useSessao((s) => s.perfil);
  const entradaRef = useRef<HTMLInputElement>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const evidencia = useLiveQuery(
    () => db.evidencias.where('item_id').equals(item.id).first(),
    [item.id],
  );
  const previa = useObjectUrl(evidencia?.thumbBlob);

  const temFoto = Boolean(evidencia);

  async function aoEscolher(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ''; // permite escolher de novo o mesmo arquivo
    if (!arquivo) return;

    setErro(null);
    setProcessando(true);
    try {
      // A compressao so e carregada quando o usuario tira a primeira foto.
      const { processarFoto } = await import('@/features/midia/compressao');
      // Compressao e localizacao correm em paralelo; o GPS e opcional.
      const [foto, coordenada] = await Promise.all([processarFoto(arquivo), obterLocalizacao()]);
      await salvarFotoDoItem(item.id, secaoId, {
        blob: foto.blob,
        thumbBlob: foto.thumb,
        capturadaEm: new Date().toISOString(),
        latitude: coordenada?.latitude ?? null,
        longitude: coordenada?.longitude ?? null,
        autorId: perfil?.id ?? null,
      });
      await marcarEmMontagem(secaoId, item.etapa);
    } catch {
      setErro('Nao foi possivel processar a foto. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  }

  async function aoRemover() {
    setErro(null);
    await removerFotoDoItem(item.id);
  }

  return (
    <Cartao
      inicio={
        <Medalhao tom={temFoto ? 'ok' : 'marca'}>{item.foto_numero ?? <Camera24Regular />}</Medalhao>
      }
      titulo={item.nome}
      descricao="Foto obrigatoria"
      acao={
        <Selo
          texto={temFoto ? 'Registrada' : 'Pendente'}
          tom={temFoto ? 'ok' : 'neutro'}
        />
      }
    >
      <div className={c.corpo}>
        {erro && <Aviso tom="erro">{erro}</Aviso>}

        {previa && (
          <img className={c.previa} src={previa} alt={`Previa da foto do item: ${item.nome}`} />
        )}

        {evidencia && (
          <div className={c.info}>
            <Text size={200}>{formatarQuando(evidencia.capturada_em)}</Text>
            {evidencia.latitude != null && evidencia.longitude != null ? (
              <>
                <Location24Regular />
                <Text size={200}>
                  {evidencia.latitude.toFixed(5)}, {evidencia.longitude.toFixed(5)}
                </Text>
              </>
            ) : (
              <Text size={200}>Localizacao nao disponivel</Text>
            )}
          </div>
        )}

        <input
          ref={entradaRef}
          className={c.oculto}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={aoEscolher}
          tabIndex={-1}
          aria-hidden
        />

        <div className={c.acoes}>
          <Botao
            variante={temFoto ? 'secundario' : 'primario'}
            carregando={processando}
            disabled={somenteLeitura}
            icon={temFoto ? <ArrowClockwise24Regular /> : <Camera24Regular />}
            onClick={() => entradaRef.current?.click()}
          >
            {temFoto ? 'Refazer' : 'Tirar foto'}
          </Botao>

          {temFoto && (
            <Botao
              variante="sutil"
              icon={<Delete24Regular />}
              onClick={aoRemover}
              disabled={processando || somenteLeitura}
            >
              Remover
            </Botao>
          )}
        </div>
      </div>
    </Cartao>
  );
}
