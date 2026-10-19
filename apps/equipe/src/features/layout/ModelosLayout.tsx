import { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Image24Regular, ZoomIn24Regular } from '@fluentui/react-icons';
import { Botao, Cartao, Medalhao, Selo, pontoTablet } from '@montaje/ui';

/**
 * APP-29 (apoio) — modelos de montagem da seção eleitoral.
 *
 * São imagens de referência embutidas no app (pasta `public/`), pensadas para
 * consulta rápida em campo. Como entram no cache do service worker, funcionam
 * sem internet. O rótulo de cada modelo vive aqui; para trocar uma imagem basta
 * substituir o arquivo em `public/` mantendo o mesmo nome.
 */
export interface ModeloLayout {
  arquivo: string;
  titulo: string;
  descricao: string;
}

export const MODELOS_LAYOUT: ModeloLayout[] = [
  {
    arquivo: 'modelo_montagem_secao_eleitoral_editado.png',
    titulo: 'Modelo padrão',
    descricao: 'Disposição de referência da seção eleitoral.',
  },
  {
    arquivo: 'modelo_montagem_secao_eleitoral_invertido.png',
    titulo: 'Modelo invertido',
    descricao: 'Mesma montagem espelhada, para espaços com a entrada do outro lado.',
  },
  {
    arquivo: 'modelo_montagem_secao_eleitoral_mesarios_atras_secretario.png',
    titulo: 'Mesários atrás do secretário',
    descricao: 'Mesários posicionados atrás da mesa do secretário.',
  },
];

/** URL pública de uma imagem do `public/`, respeitando o BASE_URL do build. */
function urlDoModelo(arquivo: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${arquivo}`;
}

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
    position: 'relative',
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
    objectFit: 'contain',
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground3,
    transitionProperty: 'transform, box-shadow',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: tokens.shadow8,
    },
  },
  ampliar: {
    position: 'absolute',
    right: tokens.spacingHorizontalXS,
    bottom: tokens.spacingVerticalXS,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground2,
    boxShadow: tokens.shadow4,
  },
  legenda: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  descricao: {
    color: tokens.colorNeutralForeground3,
    overflowWrap: 'anywhere',
  },
  nota: {
    color: tokens.colorNeutralForeground3,
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
    maxHeight: '75vh',
    objectFit: 'contain',
    borderRadius: tokens.borderRadiusLarge,
  },
});

/** Um modelo consultável: miniatura + ampliação em tela cheia. */
function ModeloFigura({ modelo }: { modelo: ModeloLayout }) {
  const c = useClasses();
  const [aberto, setAberto] = useState(false);
  const url = urlDoModelo(modelo.arquivo);

  return (
    <figure className={c.figura}>
      <button
        type="button"
        className={c.miniatura}
        onClick={() => setAberto(true)}
        aria-label={`Ampliar modelo: ${modelo.titulo}`}
      >
        <img className={c.imagem} src={url} alt={`Modelo: ${modelo.titulo}`} loading="lazy" />
        <span className={c.ampliar} aria-hidden>
          <ZoomIn24Regular />
        </span>
      </button>
      <figcaption className={c.legenda}>
        <Text size={200} weight="semibold">
          {modelo.titulo}
        </Text>
        <Text size={200} className={c.descricao}>
          {modelo.descricao}
        </Text>
      </figcaption>

      <Dialog
        open={aberto}
        onOpenChange={(_evento, dados) => {
          if (!dados.open) setAberto(false);
        }}
      >
        <DialogSurface className={c.dialogo}>
          <DialogBody>
            <DialogTitle>{modelo.titulo}</DialogTitle>
            <DialogContent className={c.dialogoConteudo}>
              <img className={c.imagemCheia} src={url} alt={`Modelo: ${modelo.titulo}`} />
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
 * Cartão de consulta dos modelos de montagem. Fica em Ajustes para a equipe
 * conferir a disposição da seção a qualquer momento, inclusive offline.
 */
export function ModelosLayout() {
  const c = useClasses();

  return (
    <Cartao
      inicio={
        <Medalhao tom="marca">
          <Image24Regular />
        </Medalhao>
      }
      titulo="Modelos de montagem"
      descricao="Toque em um modelo para ampliar e conferir a disposição da seção."
      acao={<Selo texto={`${MODELOS_LAYOUT.length} modelos`} tom="marca" />}
    >
      <div className={c.grade}>
        {MODELOS_LAYOUT.map((modelo) => (
          <ModeloFigura key={modelo.arquivo} modelo={modelo} />
        ))}
      </div>
      <Text size={200} className={c.nota}>
        Imagens de referência guardadas no aparelho — funcionam sem internet.
      </Text>
    </Cartao>
  );
}
