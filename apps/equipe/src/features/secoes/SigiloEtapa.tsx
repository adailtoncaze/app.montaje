import { Text, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { ShieldCheckmark24Regular, Warning24Regular } from '@fluentui/react-icons';
import { sigiloConforme } from '@montaje/core';
import { Aviso, Selo, pontoTablet } from '@montaje/ui';
import { type ItemLocal } from '@/db/schema';
import { ItemConfirmacao } from './ItemConfirmacao';

/**
 * APP-21 — bloco de verificação do sigilo do voto (Etapa 2).
 * As perguntas são eliminatórias: qualquer "Não" torna a seção não conforme e exige
 * registro de desvio (regra 1 do PRD).
 */
const useClasses = makeStyles({
  bloco: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusXLarge,
    border: '1px solid transparent',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
  },
  ok: {
    border: `1px solid ${tokens.colorBrandStroke2}`,
  },
  erro: {
    border: `1px solid ${tokens.colorPaletteRedBorder2}`,
  },
  cabecalho: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  cabecalhoTexto: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginRight: 'auto',
  },
  icone: {
    color: tokens.colorBrandForeground1,
    display: 'flex',
  },
  iconeErro: {
    color: tokens.colorPaletteRedForeground1,
  },
  lista: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: tokens.spacingVerticalM,
    [`@media ${pontoTablet}`]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: tokens.spacingHorizontalL,
    },
  },
});

export function SigiloEtapa({
  itens,
  secaoId,
  somenteLeitura = false,
}: {
  itens: ItemLocal[];
  secaoId: string;
  somenteLeitura?: boolean;
}) {
  const c = useClasses();
  if (itens.length === 0) return null;

  const conforme = sigiloConforme(itens.map((i) => ({ critica: true, resposta: i.resposta })));

  return (
    <section
      className={mergeClasses(c.bloco, conforme ? c.ok : c.erro)}
      aria-label="Sigilo do voto"
    >
      <div className={c.cabecalho}>
        <span className={mergeClasses(c.cabecalhoTexto, c.icone, !conforme && c.iconeErro)}>
          {conforme ? <ShieldCheckmark24Regular /> : <Warning24Regular />}
          <Text weight="semibold" size={400}>
            Sigilo do voto
          </Text>
        </span>
        <Selo
          texto={conforme ? 'Preservado' : 'Comprometido'}
          tom={conforme ? 'ok' : 'erro'}
        />
      </div>

      <Aviso tom={conforme ? 'info' : 'erro'} titulo="Perguntas eliminatórias (regra 1)">
        {conforme
          ? 'Qualquer resposta "Não" a estas perguntas torna a seção não conforme e exige o registro de um desvio.'
          : 'A seção está não conforme pelo sigilo do voto. Registre o desvio para liberar o envio da etapa.'}
      </Aviso>

      <div className={c.lista}>
        {itens.map((item) => (
          <ItemConfirmacao
            key={item.id}
            item={item}
            secaoId={secaoId}
            somenteLeitura={somenteLeitura}
          />
        ))}
      </div>
    </section>
  );
}
