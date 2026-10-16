import { useLiveQuery } from 'dexie-react-hooks';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { CloudArrowUp24Regular } from '@fluentui/react-icons';
import { Aviso, CabecalhoApp, Cartao, EstadoVazio, pontoTablet } from '@montaje/ui';
import { db } from '@/db/schema';

const useClasses = makeStyles({
  pagina: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    [`@media ${pontoTablet}`]: {
      padding: tokens.spacingVerticalL,
      gap: tokens.spacingVerticalL,
    },
  },
  contadores: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
  contador: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalL,
    textAlign: 'center',
  },
  numero: {
    fontSize: '32px',
    lineHeight: '36px',
    fontWeight: tokens.fontWeightBold,
  },
  pendente: {
    color: tokens.colorPaletteYellowForeground1,
  },
  enviado: {
    color: tokens.colorPaletteGreenForeground1,
  },
});

export function Sincronizacao() {
  const c = useClasses();
  const pendentes = useLiveQuery(
    () => db.outbox.where('estado').anyOf('pendente_envio', 'erro').count(),
    [],
    0,
  );
  const enviados = useLiveQuery(
    () => db.outbox.where('estado').equals('enviado').count(),
    [],
    0,
  );

  return (
    <>
      <CabecalhoApp titulo="Envio" subtitulo="Sincronização com o cartório" />

      <div className={c.pagina}>
        <div className={c.contadores}>
          <Cartao clicavel={false} className={c.contador}>
            <Text className={`${c.numero} ${c.pendente}`}>{pendentes}</Text>
            <Text size={200}>Pendentes de envio</Text>
          </Cartao>
          <Cartao clicavel={false} className={c.contador}>
            <Text className={`${c.numero} ${c.enviado}`}>{enviados}</Text>
            <Text size={200}>Enviados</Text>
          </Cartao>
        </div>

        {pendentes === 0 ? (
          <EstadoVazio
            icone={<CloudArrowUp24Regular />}
            titulo="Tudo em dia"
            descricao="Não há itens aguardando envio. Novos registros serão enviados assim que houver sinal."
          />
        ) : (
          <Aviso tom="info" titulo="Envio automático">
            Os registros ficam salvos no aparelho e são enviados sozinhos quando houver
            conexão. Você não precisa fazer nada.
          </Aviso>
        )}

        <Text size={200}>
          Ordem de envio: dados e miniaturas primeiro, fotos completas depois. Em caso de
          falha, o envio é repetido automaticamente sem perda de dados.
        </Text>
      </div>
    </>
  );
}
