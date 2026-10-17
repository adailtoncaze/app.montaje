import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { sigiloConforme } from '@montaje/core';
import { Aviso, Selo, pontoTablet } from '@montaje/ui';
import { type ItemLocal } from '@/db/schema';
import { ItemConfirmacao } from './ItemConfirmacao';

/**
 * APP-21 — bloco de verificacao do sigilo do voto (Etapa 2).
 * As perguntas sao eliminatórias: qualquer "Nao" torna a secao nao conforme e exige
 * registro de desvio (regra 1 do PRD).
 */
const useClasses = makeStyles({
  bloco: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  cabecalho: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
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
    <section className={c.bloco} aria-label="Sigilo do voto">
      <div className={c.cabecalho}>
        <Text weight="semibold" size={400}>
          Sigilo do voto
        </Text>
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
