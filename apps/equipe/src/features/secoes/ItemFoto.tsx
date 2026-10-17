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
import { CameraApp } from '@/features/midia/CameraApp';
import { processarFoto } from '@/features/midia/compressao';
import { obterLocalizacao } from '@/features/midia/geo';
import { useSessao } from '@/features/auth/store';
import { useObjectUrl } from '@/lib/use-object-url';
import { useAvisos } from '@/lib/avisos';

/** Câmera ao vivo só existe em contexto seguro (HTTPS/localhost). */
function temCameraAoVivo(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof window !== 'undefined' &&
    window.isSecureContext
  );
}

const useClasses = makeStyles({
  corpo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  vazio: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalXS,
    width: '100%',
    aspectRatio: '4 / 3',
    borderRadius: tokens.borderRadiusLarge,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    padding: tokens.spacingVerticalM,
  },
  vazioIcone: {
    fontSize: '32px',
    lineHeight: '32px',
  },
  previaWrap: {
    position: 'relative',
  },
  previa: {
    display: 'block',
    width: '100%',
    aspectRatio: '4 / 3',
    objectFit: 'cover',
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  carregando: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    color: '#ffffff',
    fontWeight: tokens.fontWeightSemibold,
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
  precisaCorrecao = false,
}: {
  item: ItemLocal;
  secaoId: string;
  somenteLeitura?: boolean;
  /** O cartório devolveu justamente este item para correção. */
  precisaCorrecao?: boolean;
}) {
  const c = useClasses();
  const avisos = useAvisos();
  const perfil = useSessao((s) => s.perfil);
  const entradaRef = useRef<HTMLInputElement>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [cameraAberta, setCameraAberta] = useState(false);

  const evidencia = useLiveQuery(() => evidenciaDoItem(item.id), [item.id]);
  const previa = useObjectUrl(evidencia?.thumbBlob);

  const temFoto = Boolean(evidencia);

  /** Comprime, grava a foto e anexa a localização (em segundo plano). */
  async function processarESalvar(origem: Blob) {
    setErro(null);
    setProcessando(true);
    try {
      // Comprime a imagem antes de gravar (normaliza tamanho e qualidade).
      const foto = await processarFoto(origem);

      // Grava a foto imediatamente, sem esperar o GPS: a evidência nunca se perde
      // por causa de sinal ruim e a prévia aparece na hora.
      const evidenciaId = await salvarFotoDoItem(item.id, secaoId, {
        blob: foto.blob,
        thumbBlob: foto.thumb,
        capturadaEm: new Date().toISOString(),
        latitude: null,
        longitude: null,
        autorId: perfil?.id ?? null,
      });
      await marcarEmMontagem(secaoId, item.etapa);
      avisos.sucesso('Foto registrada', item.nome);

      // A localização é opcional: buscada em segundo plano e anexada à evidência.
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
      const detalhe =
        causa instanceof Error && causa.message
          ? `Não foi possível salvar a foto (${causa.message}). Tente novamente.`
          : 'Não foi possível salvar a foto. Tente novamente.';
      setErro(detalhe);
      avisos.erro('Falha ao salvar a foto', item.nome);
    } finally {
      setProcessando(false);
    }
  }

  /** Abre a câmera no app; em contexto inseguro/sem suporte, cai para o input de arquivo. */
  function abrirCaptura() {
    if (temCameraAoVivo()) {
      setErro(null);
      setCameraAberta(true);
    } else {
      entradaRef.current?.click();
    }
  }

  async function aoEscolher(evento: ChangeEvent<HTMLInputElement>) {
    const entrada = evento.target;
    const arquivo = entrada.files?.[0];
    if (!arquivo) {
      entrada.value = '';
      return;
    }
    // Limpa o input só depois de ler o arquivo: em alguns navegadores móveis,
    // redefinir o value antes da leitura invalida o File selecionado.
    try {
      await processarESalvar(arquivo);
    } finally {
      entrada.value = '';
    }
  }

  async function aoRemover() {
    setErro(null);
    await removerFotoDoItem(item.id);
    avisos.info('Foto removida', item.nome);
  }

  return (
    <Cartao
      inicio={
        <Medalhao tom={precisaCorrecao ? 'erro' : temFoto ? 'ok' : 'marca'}>
          {item.foto_numero ?? <Camera24Regular />}
        </Medalhao>
      }
      titulo={item.nome}
      descricao="Foto obrigatória"
      acao={
        precisaCorrecao ? (
          <Selo texto="Corrigir" tom="erro" />
        ) : (
          <Selo texto={temFoto ? 'Registrada' : 'Pendente'} tom={temFoto ? 'ok' : 'neutro'} />
        )
      }
    >
      <div className={c.corpo}>
        {precisaCorrecao && (
          <Aviso tom="erro" titulo="Foto devolvida pelo cartório">
            Refaça a foto deste item para atender à correção solicitada.
          </Aviso>
        )}

        {erro && <Aviso tom="erro">{erro}</Aviso>}

        {previa ? (
          <div className={c.previaWrap}>
            <img className={c.previa} src={previa} alt={`Prévia da foto do item: ${item.nome}`} />
            {processando && <div className={c.carregando}>Salvando…</div>}
          </div>
        ) : (
          <div className={c.vazio}>
            <Camera24Regular className={c.vazioIcone} />
            <Text size={200}>Nenhuma foto registrada</Text>
            <Text size={200}>Toque em “Tirar foto” para capturar.</Text>
          </div>
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
              <Text size={200}>Localização não disponível</Text>
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
            onClick={abrirCaptura}
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

      {cameraAberta && (
        <CameraApp
          aoCapturar={(foto) => {
            setCameraAberta(false);
            void processarESalvar(foto);
          }}
          aoFechar={() => setCameraAberta(false)}
          aoUsarArquivo={() => {
            setCameraAberta(false);
            entradaRef.current?.click();
          }}
        />
      )}
    </Cartao>
  );
}
