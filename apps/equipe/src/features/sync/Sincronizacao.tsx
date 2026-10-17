import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowSync24Regular, CloudArrowUp24Regular } from '@fluentui/react-icons';
import { Aviso, Botao, CabecalhoApp, Cartao, EstadoVazio, pontoTablet } from '@montaje/ui';
import { db } from '@/db/schema';
import { sincronizarTudo, type ResultadoSync } from './engine';

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
  acoes: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  lista: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalL,
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
  const comErro = useLiveQuery(() => db.outbox.where('estado').equals('erro').count(), [], 0);

  const [sincronizando, setSincronizando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSync | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function sincronizarAgora() {
    setErro(null);
    setResultado(null);
    setSincronizando(true);
    try {
      const r = await sincronizarTudo();
      setResultado(r);
      if (!r.executou && r.mensagem) setErro(r.mensagem);
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Falha ao sincronizar.');
    } finally {
      setSincronizando(false);
    }
  }

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

        <div className={c.acoes}>
          <Botao
            variante="primario"
            icon={<ArrowSync24Regular />}
            carregando={sincronizando}
            disabled={sincronizando}
            onClick={sincronizarAgora}
          >
            Sincronizar agora
          </Botao>
        </div>

        {erro && (
          <Aviso tom="alerta" titulo="Envio não realizado">
            {erro}
          </Aviso>
        )}

        {resultado?.executou && (
          <Aviso
            tom={resultado.falhas > 0 ? 'alerta' : 'sucesso'}
            titulo={resultado.falhas > 0 ? 'Envio parcial' : 'Envio concluído'}
          >
            <Text size={200}>
              {resultado.enviados} enviado(s) · {resultado.falhas} falha(s) · {resultado.restantes}{' '}
              na fila
            </Text>
            {resultado.atualizadas > 0 && (
              <Text size={200} block>
                {resultado.atualizadas} seção(ões) atualizada(s) pelo cartório.
              </Text>
            )}
          </Aviso>
        )}

        {resultado?.avisoDescida && (
          <Aviso tom="alerta" titulo="Status do cartório">
            {resultado.avisoDescida}
          </Aviso>
        )}

        {comErro > 0 && (
          <Aviso tom="erro" titulo={`${comErro} registro(s) com falha`}>
            O envio será repetido automaticamente. Se persistir, verifique a conexão.
          </Aviso>
        )}

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
