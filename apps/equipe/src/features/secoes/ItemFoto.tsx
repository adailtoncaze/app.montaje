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
import { type ItemLocal } from '@/db/schema';
import {
  atualizarGeolocalizacaoDaEvidencia,
  evidenciaDoItem,
  marcarEmMontagem,
  removerFotoDoItem,
  salvarFotoDoItem,
} from '@/db/repo';
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

  const evidencia = useLiveQuery(() => evidenciaDoItem(item.id), [item.id]);
  const previa = useObjectUrl(evidencia?.thumbBlob);

  const temFoto = Boolean(evidencia);

  async function aoEscolher(evento: ChangeEvent<HTMLInputElement>) {
    const entrada = evento.target;
    const arquivo = entrada.files?.[0];
    if (!arquivo) {
      entrada.value = '';
      return;
    }

    setErro(null);
    setProcessando(true);
    try {
      // A compressao so e carregada quando o usuario tira a primeira foto.
      const { processarFoto } = await import('@/features/midia/compressao');
      const foto = await processarFoto(arquivo);

      // Grava a foto imediatamente, sem esperar o GPS: a evidencia nunca se perde
      // por causa de sinal ruim e a previa aparece na hora.
      const evidenciaId = await salvarFotoDoItem(item.id, secaoId, {
        blob: foto.blob,
        thumbBlob: foto.thumb,
        capturadaEm: new Date().toISOString(),
        latitude: null,
        longitude: null,
        autorId: perfil?.id ?? null,
      });
      await marcarEmMontagem(secaoId, item.etapa);

      // A localizacao e opcional: buscada em segundo plano e anexada a evidencia.
      void obterLocalizacao()
        .then((coordenada) => {
          if (coordenada) {
            return atualizarGeolocalizacaoDaEvidencia(evidenciaId, coordenada);
          }
          return undefined;
        })
        .catch(() => undefined);
    } catch (causa) {
      console.error('[ItemFoto] falha ao processar/salvar a foto', causa);
      setErro(
        causa instanceof Error && causa.message
          ? `Nao foi possivel salvar a foto (${causa.message}). Tente novamente.`
          : 'Nao foi possivel salvar a foto. Tente novamente.',
      );
    } finally {
      // Limpa o input so depois de ler o arquivo: em alguns navegadores moveis,
      // redefinir o value antes da leitura invalida o File selecionado.
      entrada.value = '';
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
