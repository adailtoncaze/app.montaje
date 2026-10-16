import { useState } from 'react';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  Dismiss24Regular,
  PhoneDesktop24Regular,
} from '@fluentui/react-icons';
import { Botao } from '@montaje/ui';
import { useInstalarPWA } from './useInstalarPWA';

const CHAVE_DISPENSA = 'montaje:instalar-dispensado';

function lerDispensado(): boolean {
  try {
    return localStorage.getItem(CHAVE_DISPENSA) === '1';
  } catch {
    return false;
  }
}

function gravarDispensado(): void {
  try {
    localStorage.setItem(CHAVE_DISPENSA, '1');
  } catch {
    /* armazenamento indisponível — ignora */
  }
}

const useClasses = makeStyles({
  faixa: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusXLarge,
    border: `1px solid ${tokens.colorBrandStroke2}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  esquerda: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    minWidth: 0,
    color: tokens.colorBrandForeground2,
  },
  texto: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  dica: {
    color: tokens.colorNeutralForeground3,
  },
  acoes: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
});

/** Faixa de convite para instalar a PWA, exibida enquanto o prompt nativo estiver disponível. */
export function FaixaInstalar() {
  const c = useClasses();
  const { instalado, podeInstalar, instalar } = useInstalarPWA();
  const [dispensado, setDispensado] = useState(lerDispensado);
  const [ocupado, setOcupado] = useState(false);

  if (instalado || !podeInstalar || dispensado) return null;

  async function instalarAgora() {
    setOcupado(true);
    try {
      await instalar();
    } finally {
      setOcupado(false);
    }
  }

  function dispensar() {
    gravarDispensado();
    setDispensado(true);
  }

  return (
    <div className={c.faixa}>
      <div className={c.esquerda}>
        <PhoneDesktop24Regular />
        <div className={c.texto}>
          <Text weight="semibold">Instale o app neste aparelho</Text>
          <Text size={200} className={c.dica}>
            Abre em tela cheia e fica na tela inicial, sem precisar do navegador.
          </Text>
        </div>
      </div>
      <div className={c.acoes}>
        <Botao onClick={instalarAgora} carregando={ocupado} icon={<ArrowDownload24Regular />}>
          Instalar
        </Botao>
        <Botao
          variante="sutil"
          onClick={dispensar}
          icon={<Dismiss24Regular />}
          aria-label="Agora não"
        >
          Agora não
        </Botao>
      </div>
    </div>
  );
}
