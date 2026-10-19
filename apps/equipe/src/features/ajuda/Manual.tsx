import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';
import { MANUAL_EQUIPE_CAMPO, segmentosNegrito, type BlocoManual } from '@montaje/core';
import { Aviso, CabecalhoApp, Cartao, ConteudoPagina } from '@montaje/ui';

const useClasses = makeStyles({
  lista: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  tabela: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  linha: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  situacao: {
    color: tokens.colorNeutralForeground2,
  },
});

/** Texto do manual, com os trechos `**negrito**` em destaque. */
function TextoMarcado({ texto }: { texto: string }) {
  return (
    <Text size={300}>
      {segmentosNegrito(texto).map((segmento, indice) =>
        segmento.negrito ? (
          <strong key={indice}>{segmento.texto}</strong>
        ) : (
          <span key={indice}>{segmento.texto}</span>
        ),
      )}
    </Text>
  );
}

function Bloco({ bloco }: { bloco: BlocoManual }) {
  const c = useClasses();

  switch (bloco.tipo) {
    case 'paragrafo':
      return <TextoMarcado texto={bloco.texto} />;

    case 'destaque':
      return (
        <Aviso tom="alerta">
          <TextoMarcado texto={bloco.texto} />
        </Aviso>
      );

    case 'lista': {
      const Lista = bloco.ordenada ? 'ol' : 'ul';
      return (
        <Lista className={c.lista}>
          {bloco.itens.map((item) => (
            <li key={item}>
              <TextoMarcado texto={item} />
            </li>
          ))}
        </Lista>
      );
    }

    case 'tabela':
      return (
        <div className={c.tabela}>
          {bloco.linhas.map((linha) => (
            <div key={linha.situacao} className={c.linha}>
              <Text size={300} weight="semibold" className={c.situacao}>
                {linha.situacao}
              </Text>
              <TextoMarcado texto={linha.acao} />
            </div>
          ))}
        </div>
      );
  }
}

/** Manual da equipe de campo disponível dentro do app, para consulta offline. */
export function Manual() {
  const navigate = useNavigate();

  return (
    <>
      <CabecalhoApp
        titulo="Manual da equipe"
        subtitulo="Guia de campo"
        aoVoltar={() => navigate('/config')}
      />

      <ConteudoPagina>
        <Aviso tom="info">{MANUAL_EQUIPE_CAMPO.resumo}</Aviso>

        {MANUAL_EQUIPE_CAMPO.secoes.map((secao) => (
          <Cartao key={secao.id} titulo={secao.titulo}>
            {secao.blocos.map((bloco, indice) => (
              <Bloco key={indice} bloco={bloco} />
            ))}
          </Cartao>
        ))}
      </ConteudoPagina>
    </>
  );
}
