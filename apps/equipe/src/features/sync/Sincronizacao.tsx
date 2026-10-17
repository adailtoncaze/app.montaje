import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowSync24Regular, CloudArrowUp24Regular } from '@fluentui/react-icons';
import {
  Aviso,
  Botao,
  CabecalhoApp,
  Cartao,
  ConteudoPagina,
  EstadoVazio,
  IndicadorConexao,
  Selo,
  type TomSelo,
} from '@montaje/ui';
import { db, type OutboxItem } from '@/db/schema';
import { sincronizarTudo, type ResultadoSync } from './engine';
import { useAvisos } from '@/lib/avisos';

const ROTULO_TIPO: Record<OutboxItem['tipo'], string> = {
  item: 'Resposta',
  evidencia: 'Foto',
  desvio: 'Desvio',
  sigilo: 'Sigilo',
  status: 'Status da seção',
};

const useClasses = makeStyles({
  contadores: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: tokens.spacingHorizontalS,
  },
  contador: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    textAlign: 'center',
    padding: tokens.spacingVerticalM,
  },
  numero: {
    fontSize: '28px',
    lineHeight: '32px',
    fontWeight: tokens.fontWeightBold,
    fontVariantNumeric: 'tabular-nums',
  },
  pendente: {
    color: tokens.colorPaletteYellowForeground1,
  },
  enviado: {
    color: tokens.colorPaletteGreenForeground1,
  },
  erro: {
    color: tokens.colorPaletteRedForeground1,
  },
  rotulo: {
    color: tokens.colorNeutralForeground3,
  },
  acoes: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  fila: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  linhaFila: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalS,
    borderBottomWidth: tokens.strokeWidthThin,
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
    ':last-child': {
      paddingBottom: 0,
      borderBottomStyle: 'none',
    },
  },
  linhaTexto: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  erroTexto: {
    color: tokens.colorPaletteRedForeground1,
    overflowWrap: 'anywhere',
  },
});

interface LinhaFila {
  id: string;
  rotulo: string;
  estado: OutboxItem['estado'];
  erro?: string;
}

async function rotuloDaEntrada(entrada: OutboxItem): Promise<string> {
  try {
    switch (entrada.tipo) {
      case 'item': {
        const item = await db.itens.get(entrada.refId);
        return item?.nome ?? ROTULO_TIPO.item;
      }
      case 'evidencia': {
        const ev = await db.evidencias.get(entrada.refId);
        if (!ev) return ROTULO_TIPO.evidencia;
        const item = await db.itens.get(ev.item_id);
        return item?.nome ? `${ROTULO_TIPO.evidencia} · ${item.nome}` : ROTULO_TIPO.evidencia;
      }
      case 'desvio': {
        const d = await db.desvios.get(entrada.refId);
        if (!d) return ROTULO_TIPO.desvio;
        const item = await db.itens.get(d.item_id);
        return item?.nome ? `${ROTULO_TIPO.desvio} · ${item.nome}` : ROTULO_TIPO.desvio;
      }
      case 'status': {
        const secao = await db.secoes.get(entrada.refId);
        return secao ? `Seção ${secao.numero}` : ROTULO_TIPO.status;
      }
      default:
        return ROTULO_TIPO.sigilo;
    }
  } catch {
    return ROTULO_TIPO[entrada.tipo];
  }
}

function tomDoEstado(estado: OutboxItem['estado']): TomSelo {
  switch (estado) {
    case 'erro':
      return 'erro';
    case 'enviado':
      return 'ok';
    case 'enviando':
      return 'marca';
    default:
      return 'alerta';
  }
}

function rotuloDoEstado(estado: OutboxItem['estado']): string {
  switch (estado) {
    case 'erro':
      return 'Falhou';
    case 'enviado':
      return 'Enviado';
    case 'enviando':
      return 'Enviando';
    default:
      return 'Na fila';
  }
}

export function Sincronizacao() {
  const c = useClasses();
  const avisos = useAvisos();

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
  const ultima = useLiveQuery(
    async () => (await db.meta.get('ultima_sincronizacao'))?.valor as string | undefined,
    [],
  );

  const fila = useLiveQuery<LinhaFila[], LinhaFila[]>(
    async () => {
      const entradas = await db.outbox
        .where('estado')
        .anyOf('pendente_envio', 'erro')
        .toArray();
      entradas.sort((a, b) => a.criadoEm - b.criadoEm);
      return Promise.all(
        entradas.slice(0, 20).map(async (entrada) => ({
          id: entrada.id,
          rotulo: await rotuloDaEntrada(entrada),
          estado: entrada.estado,
          erro: entrada.ultimoErro,
        })),
      );
    },
    [],
    [],
  );

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
      if (!r.executou) {
        if (r.mensagem) {
          setErro(r.mensagem);
          avisos.alerta('Envio não realizado', r.mensagem);
        }
        return;
      }
      if (r.falhas > 0) {
        avisos.alerta(
          'Envio parcial',
          `${r.enviados} enviado(s) · ${r.falhas} falha(s) · ${r.restantes} na fila.`,
        );
      } else {
        avisos.sucesso(
          'Envio concluído',
          `${r.enviados} registro(s) enviado(s) com sucesso.`,
        );
      }
      if (r.avisoDescida) avisos.alerta('Status do cartório', r.avisoDescida);
    } catch (causa) {
      const mensagem = causa instanceof Error ? causa.message : 'Falha ao sincronizar.';
      setErro(mensagem);
      avisos.erro('Falha ao sincronizar', mensagem);
    } finally {
      setSincronizando(false);
    }
  }

  const ultimaTexto = ultima
    ? new Date(ultima).toLocaleString('pt-BR')
    : 'ainda não sincronizado';

  return (
    <>
      <CabecalhoApp
        titulo="Envio"
        subtitulo="Sincronização com o cartório"
        fim={<IndicadorConexao />}
      />

      <ConteudoPagina>
        <div className={c.contadores}>
          <Cartao className={c.contador}>
            <Text className={`${c.numero} ${c.pendente}`}>{pendentes}</Text>
            <Text size={200} className={c.rotulo}>
              Na fila
            </Text>
          </Cartao>
          <Cartao className={c.contador}>
            <Text className={`${c.numero} ${c.enviado}`}>{enviados}</Text>
            <Text size={200} className={c.rotulo}>
              Enviados
            </Text>
          </Cartao>
          <Cartao className={c.contador}>
            <Text className={`${c.numero} ${comErro > 0 ? c.erro : ''}`}>{comErro}</Text>
            <Text size={200} className={c.rotulo}>
              Com falha
            </Text>
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

        <Text size={200} className={c.rotulo}>
          Última sincronização: {ultimaTexto}
        </Text>

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
        ) : fila.length > 0 ? (
          <Cartao
            titulo="Itens na fila"
            descricao="Serão enviados automaticamente, dados e miniaturas primeiro."
          >
            <div className={c.fila}>
              {fila.map((linha) => (
                <div key={linha.id} className={c.linhaFila}>
                  <div className={c.linhaTexto}>
                    <Text size={300} weight="semibold">
                      {linha.rotulo}
                    </Text>
                    {linha.erro && (
                      <Text size={200} className={c.erroTexto}>
                        {linha.erro}
                      </Text>
                    )}
                  </div>
                  <Selo texto={rotuloDoEstado(linha.estado)} tom={tomDoEstado(linha.estado)} />
                </div>
              ))}
            </div>
          </Cartao>
        ) : (
          <Aviso tom="info" titulo="Envio automático">
            Os registros ficam salvos no aparelho e são enviados sozinhos quando houver
            conexão. Você não precisa fazer nada.
          </Aviso>
        )}

        <Text size={200} className={c.rotulo}>
          Ordem de envio: dados e miniaturas primeiro, fotos completas depois. Em caso de
          falha, o envio é repetido automaticamente sem perda de dados.
        </Text>
      </ConteudoPagina>
    </>
  );
}
