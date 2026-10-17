import { useState } from 'react';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  CheckmarkCircle24Regular,
  PhoneDesktop24Regular,
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
});

/** Cartão de instalação da PWA, usado em Ajustes. Cobre desktop, Android e iOS. */
export function CartaoInstalar() {
  const c = useClasses();
  const avisos = useAvisos();
  const { instalado, podeInstalar, precisaCompartilhar, plataforma, instalar } =
    useInstalarPWA();
  const [ocupado, setOcupado] = useState(false);
  const [recusou, setRecusou] = useState(false);

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
      </div>
    </Cartao>
  );
}
