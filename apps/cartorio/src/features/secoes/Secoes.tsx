import { Link } from 'react-router-dom';
import { Text, Title2, makeStyles, tokens } from '@fluentui/react-components';
import { ClipboardTaskListLtr24Regular } from '@fluentui/react-icons';
import { EstadoVazio } from '@montaje/ui';

const useClasses = makeStyles({
  pagina: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  rotulo: {
    color: tokens.colorNeutralForeground3,
  },
  voltar: {
    color: tokens.colorBrandForegroundLink,
    textDecorationLine: 'none',
  },
});

export function Secoes() {
  const c = useClasses();
  return (
    <div className={c.pagina}>
      <Title2>Seções</Title2>
      <Text className={c.rotulo}>
        Lista com status das duas etapas, filtros por local/equipe/status/conformidade e
        resumo no topo (RF-C04 a RF-C07).
      </Text>

      <EstadoVazio
        icone={<ClipboardTaskListLtr24Regular />}
        titulo="Próximo épico do painel"
        descricao="O contrato (Sprint 0) e o esqueleto já estão prontos. A lista entra no épico de Acompanhamento."
        acao={
          <Link to="/" className={c.voltar}>
            ← Voltar ao início
          </Link>
        }
      />
    </div>
  );
}
