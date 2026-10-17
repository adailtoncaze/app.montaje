import { useEffect, useRef, useState } from 'react';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { Camera24Regular, Dismiss24Regular, FolderOpen24Regular } from '@fluentui/react-icons';
import { Aviso, Botao } from '@montaje/ui';

/**
 * APP-11 — camera dentro do app.
 *
 * No Android, capturar pelo `<input type="file" capture>` abre o app de camera do
 * sistema; para liberar RAM, o Android mata a aba do PWA e, ao voltar, o app reinicia
 * do zero ("devido a insuficiencia de memoria...") — a foto se perde. Usando
 * `getUserMedia` a captura acontece na propria pagina, sem troca de app.
 */

/** Limite do maior lado ao capturar; o pipeline de compressao normaliza depois. */
const LADO_MAX_CAPTURA = 1280;

const useClasses = makeStyles({
  fundo: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    boxSizing: 'border-box',
    paddingTop: `calc(${tokens.spacingVerticalM} + env(safe-area-inset-top, 0px))`,
    paddingBottom: `calc(${tokens.spacingVerticalM} + env(safe-area-inset-bottom, 0px))`,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackgroundStatic,
    color: tokens.colorNeutralForegroundStaticInverted,
  },
  topo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    minHeight: '48px',
  },
  titulo: {
    color: tokens.colorNeutralForegroundStaticInverted,
    fontWeight: tokens.fontWeightSemibold,
  },
  fechar: {
    minWidth: '48px',
    minHeight: '48px',
    padding: 0,
    color: tokens.colorNeutralForegroundStaticInverted,
    ':hover': {
      color: tokens.colorNeutralForegroundStaticInverted,
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
    },
    ':hover:active': {
      color: tokens.colorNeutralForegroundStaticInverted,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
  area: {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 0,
  },
  videoWrap: {
    position: 'relative',
    width: '100%',
    maxWidth: '720px',
  },
  video: {
    display: 'block',
    width: '100%',
    maxHeight: '70vh',
    objectFit: 'contain',
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackgroundStatic,
  },
  guia: {
    position: 'absolute',
    inset: '6%',
    borderRadius: tokens.borderRadiusLarge,
    border: `2px dashed ${tokens.colorNeutralForegroundStaticInverted}`,
    opacity: 0.45,
    pointerEvents: 'none',
  },
  erro: {
    maxWidth: '520px',
  },
  rodape: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
  },
  dica: {
    color: tokens.colorNeutralForegroundStaticInverted,
    textAlign: 'center',
    maxWidth: '48ch',
    opacity: 0.85,
  },
  acoes: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalL,
    flexWrap: 'wrap',
  },
  disparo: {
    width: '76px',
    height: '76px',
    minWidth: '76px',
    minHeight: '76px',
    padding: 0,
    borderRadius: '50%',
    boxShadow: `0 0 0 4px rgba(255, 255, 255, 0.35)`,
  },
  secundario: {
    color: tokens.colorNeutralForegroundStaticInverted,
    ':hover': {
      color: tokens.colorNeutralForegroundStaticInverted,
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
    },
    ':hover:active': {
      color: tokens.colorNeutralForegroundStaticInverted,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
});

function mensagemDeErro(causa: unknown): string {
  const nome = causa instanceof DOMException ? causa.name : '';
  if (nome === 'NotAllowedError' || nome === 'SecurityError') {
    return 'Acesso à câmera negado. Permita o uso da câmera nas configurações do navegador ou use uma foto da galeria.';
  }
  if (nome === 'NotFoundError' || nome === 'OverconstrainedError') {
    return 'Nenhuma câmera encontrada neste aparelho. Use uma foto da galeria.';
  }
  if (nome === 'NotReadableError') {
    return 'A câmera está em uso por outro aplicativo. Feche-o e tente de novo.';
  }
  return 'Não foi possível abrir a câmera. Use uma foto da galeria.';
}

export function CameraApp({
  aoCapturar,
  aoFechar,
  aoUsarArquivo,
}: {
  aoCapturar: (foto: Blob) => void;
  aoFechar: () => void;
  aoUsarArquivo: () => void;
}) {
  const c = useClasses();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pronta, setPronta] = useState(false);
  const [capturando, setCapturando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setErro(null);
    setPronta(false);

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        if (!cancelado) setPronta(true);
      } catch (causa) {
        if (!cancelado) setErro(mensagemDeErro(causa));
      }
    })();

    return () => {
      cancelado = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  function capturar() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    setCapturando(true);
    const escala = Math.min(1, LADO_MAX_CAPTURA / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * escala);
    canvas.height = Math.round(video.videoHeight * escala);
    const contexto = canvas.getContext('2d');
    if (!contexto) {
      setCapturando(false);
      setErro('Não foi possível capturar a imagem.');
      return;
    }
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        canvas.width = 0;
        canvas.height = 0;
        setCapturando(false);
        if (blob) {
          aoCapturar(blob);
        } else {
          setErro('Não foi possível capturar a imagem. Tente novamente.');
        }
      },
      'image/jpeg',
      0.85,
    );
  }

  return (
    <div className={c.fundo} role="dialog" aria-modal="true" aria-label="Câmera">
      <div className={c.topo}>
        <Text className={c.titulo} size={400}>
          Câmera
        </Text>
        <Botao
          variante="sutil"
          className={c.fechar}
          icon={<Dismiss24Regular />}
          onClick={aoFechar}
          aria-label="Fechar câmera"
        />
      </div>

      {erro ? (
        <div className={c.area}>
          <div className={c.erro}>
            <Aviso tom="erro" titulo="Câmera indisponível">
              {erro}
            </Aviso>
          </div>
        </div>
      ) : (
        <div className={c.area}>
          <div className={c.videoWrap}>
            <video
              ref={videoRef}
              className={c.video}
              playsInline
              muted
              autoPlay
              aria-label="Pré-visualização da câmera"
            />
            <div className={c.guia} aria-hidden />
          </div>
        </div>
      )}

      <div className={c.rodape}>
        {!erro && (
          <Text className={c.dica} size={200}>
            Não fotografe pessoas — enquadre apenas o ambiente da seção.
          </Text>
        )}

        <div className={c.acoes}>
          {!erro && (
            <Botao
              variante="primario"
              className={c.disparo}
              icon={<Camera24Regular />}
              carregando={capturando}
              disabled={!pronta}
              onClick={capturar}
              aria-label="Capturar foto"
            />
          )}
          <Botao
            variante="sutil"
            className={c.secundario}
            icon={<FolderOpen24Regular />}
            onClick={aoUsarArquivo}
          >
            Usar da galeria
          </Botao>
          <Botao
            variante="sutil"
            className={c.secundario}
            icon={<Dismiss24Regular />}
            onClick={aoFechar}
          >
            Cancelar
          </Botao>
        </div>
      </div>
    </div>
  );
}
