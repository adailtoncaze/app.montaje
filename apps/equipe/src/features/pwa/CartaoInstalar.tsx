import { useState } from 'react';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowDownload24Regular,
  CheckmarkCircle24Regular,
  Copy24Regular,
  PhoneDesktop24Regular,
  QrCode24Regular,
  ShareIos24Regular,
} from '@fluentui/react-icons';
import { Aviso, Botao, Cartao, Medalhao, Selo } from '@montaje/ui';
import { useAvisos } from '@/lib/avisos';
import { useInstalarPWA } from './useInstalarPWA';

const useClasses = makeStyles({
  conteudo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    alignItems: 'flex-start',
  },
  dica: {
    color: tokens.colorNeutralForeground3,
  },
  linha: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    whiteSpace: 'nowrap',
  },
  qrWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalS,
    width: '100%',
  },
  qrQuadro: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: '#FFFFFF',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  qrTexto: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    flexGrow: 1,
    minWidth: '200px',
  },
  link: {
    color: tokens.colorBrandForeground2,
    wordBreak: 'break-all',
  },
});

/** URL pública do app (raiz), para o QR code e para compartilhar. */
function urlDoApp(): string {
  if (typeof window === 'undefined') return '';
  const base = import.meta.env.BASE_URL || '/';
  return new URL(base, window.location.origin).toString();
}

/** Cartão de instalação da PWA, usado em Ajustes. Cobre desktop, Android e iOS. */
export function CartaoInstalar() {
  const c = useClasses();
  const avisos = useAvisos();
  const { instalado, podeInstalar, precisaCompartilhar, plataforma, instalar } =
    useInstalarPWA();
  const [ocupado, setOcupado] = useState(false);
  const [recusou, setRecusou] = useState(false);
  const [mostrarQr, setMostrarQr] = useState(false);

  const urlApp = urlDoApp();

  async function aoInstalar() {
    setOcupado(true);
    setRecusou(false);
    try {
      const r = await instalar();
      if (r === 'recusado') {
        setRecusou(true);
      } else if (r === 'aceito') {
        avisos.sucesso('Instalando…', 'O app abrirá em tela cheia na sequência.');
      } else {
        avisos.alerta('Instalação indisponível', 'Use o menu do navegador para instalar.');
      }
    } finally {
      setOcupado(false);
    }
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(urlApp);
      avisos.sucesso('Link copiado', 'Envie para quem vai instalar o app.');
    } catch {
      avisos.erro('Não foi possível copiar', 'Anote o link exibido na tela.');
    }
  }

  return (
    <Cartao
      inicio={
        <Medalhao tom={instalado ? 'ok' : 'marca'}>
          {instalado ? <CheckmarkCircle24Regular /> : <PhoneDesktop24Regular />}
        </Medalhao>
      }
      titulo="Aplicativo"
      descricao="Instale o MontaJE para abrir em tela cheia, com ícone próprio e atalho rápido."
      acao={instalado ? <Selo texto="Instalado" tom="ok" /> : undefined}
    >
      <div className={c.conteudo}>
        {instalado ? (
          <Text size={200}>Este aparelho já está usando o MontaJE instalado.</Text>
        ) : podeInstalar ? (
          <>
            <Botao onClick={aoInstalar} carregando={ocupado} icon={<ArrowDownload24Regular />}>
              Instalar o app
            </Botao>
            {recusou && (
              <Text size={200} className={c.dica}>
                Sem problema — você pode instalar depois tocando no mesmo botão.
              </Text>
            )}
          </>
        ) : precisaCompartilhar ? (
          <Aviso tom="info" titulo="Instalar no iPhone / iPad">
            <span>
              Abra no <b>Safari</b>, toque em{' '}
              <span className={c.linha}>
                Compartilhar <ShareIos24Regular />
              </span>{' '}
              e escolha <b>Adicionar à Tela de Início</b>.
            </span>
          </Aviso>
        ) : (
          <Aviso tom="info" titulo="Como instalar">
            <span>
              Abra o menu do navegador (⋮) e escolha <b>Instalar app</b> ou{' '}
              <b>Adicionar à tela inicial</b>. No <b>Chrome</b> ou <b>Edge</b> (computador ou
              Android) o botão de instalação também aparece sozinho na barra de endereço.
              {plataforma === 'desktop' && ' Em alguns casos, é preciso usar o menu.'}
            </span>
          </Aviso>
        )}

        {/* APP-29: QR code para instalar em outros aparelhos (ex.: a equipe em campo). */}
        <Botao
          variante="sutil"
          onClick={() => setMostrarQr((v) => !v)}
          icon={<QrCode24Regular />}
        >
          {mostrarQr ? 'Ocultar QR code' : 'Instalar em outro aparelho'}
        </Botao>

        {mostrarQr && (
          <div className={c.qrWrap}>
            <div className={c.qrQuadro}>
              <QRCodeSVG
                value={urlApp}
                size={188}
                level="M"
                marginSize={2}
                bgColor="#FFFFFF"
                fgColor="#000000"
                title="Código para abrir o MontaJE neste aparelho"
              />
            </div>
            <div className={c.qrTexto}>
              <Text size={200} weight="semibold">
                Aponte a câmera para instalar em outro aparelho
              </Text>
              <Text size={200} className={c.dica}>
                Abra o link no celular e instale pelo navegador. O app abre em tela cheia e fica
                na tela inicial.
              </Text>
              <Text size={200} className={c.link}>
                {urlApp}
              </Text>
              <Botao variante="secundario" onClick={copiarLink} icon={<Copy24Regular />}>
                Copiar link
              </Botao>
            </div>
          </div>
        )}
      </div>
    </Cartao>
  );
}
