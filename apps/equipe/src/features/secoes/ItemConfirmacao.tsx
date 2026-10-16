import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import {
  Field,
  Select,
  Text,
  Textarea,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Checkmark24Regular, Dismiss24Regular } from '@fluentui/react-icons';
import { ROTULO_MOTIVO, type MotivoDesvio } from '@montaje/core';
import { Botao, Cartao, Selo } from '@montaje/ui';
import { db, type ItemLocal } from '@/db/schema';
import { marcarEmMontagem, removerDesvio, responderItem, salvarDesvio } from '@/db/repo';

const MOTIVOS: MotivoDesvio[] = [
  'espaco_insuficiente',
  'estrutura_local',
  'mobiliario',
  'outro',
];

const useClasses = makeStyles({
  corpo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  acoes: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  observacao: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  desvio: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  nota: {
    color: tokens.colorNeutralForeground3,
  },
  naoConforme: {
    color: tokens.colorPaletteRedForeground1,
  },
});

export function ItemConfirmacao({
  item,
  secaoId,
  somenteLeitura = false,
}: {
  item: ItemLocal;
  secaoId: string;
  somenteLeitura?: boolean;
}) {
  const c = useClasses();
  const [salvando, setSalvando] = useState(false);
  const [mostrarObservacao, setMostrarObservacao] = useState(Boolean(item.observacao));
  const [texto, setTexto] = useState(item.observacao ?? '');

  const [formDesvioAberto, setFormDesvioAberto] = useState(false);
  const [motivo, setMotivo] = useState<MotivoDesvio | ''>('');
  const [obsDesvio, setObsDesvio] = useState('');
  const [erroDesvio, setErroDesvio] = useState<string | null>(null);
  const [salvandoDesvio, setSalvandoDesvio] = useState(false);

  const desvio = useLiveQuery(
    () => db.desvios.where('item_id').equals(item.id).first(),
    [item.id],
  );

  const resposta = item.resposta;

  async function salvar(valor: boolean | null) {
    setSalvando(true);
    try {
      await responderItem(item.id, valor, texto.trim());
      await marcarEmMontagem(secaoId, item.etapa);
      // Se o item voltou a ser conforme, o desvio deixa de fazer sentido.
      if (valor === true) await removerDesvio(item.id);
    } finally {
      setSalvando(false);
    }
  }

  function abrirFormDesvio() {
    setMotivo(desvio?.motivo ?? '');
    setObsDesvio(desvio?.observacao ?? '');
    setErroDesvio(null);
    setFormDesvioAberto(true);
  }

  async function confirmarDesvio() {
    if (!motivo) {
      setErroDesvio('Selecione o motivo do desvio.');
      return;
    }
    if (motivo === 'outro' && obsDesvio.trim().length === 0) {
      setErroDesvio('Descreva o motivo quando escolher "Outro".');
      return;
    }
    setErroDesvio(null);
    setSalvandoDesvio(true);
    try {
      await salvarDesvio(item.id, motivo, obsDesvio.trim() || null);
      setFormDesvioAberto(false);
    } finally {
      setSalvandoDesvio(false);
    }
  }

  async function apagarDesvio() {
    await removerDesvio(item.id);
    setFormDesvioAberto(false);
  }

  return (
    <Cartao
      titulo={item.nome}
      acao={
        <Selo
          texto={resposta === true ? 'Sim' : resposta === false ? 'Nao' : 'Pendente'}
          tom={resposta === true ? 'ok' : resposta === false ? 'erro' : 'neutro'}
        />
      }
    >
      <div className={c.corpo}>
        <div className={c.acoes}>
          <Botao
            variante={resposta === true ? 'primario' : 'secundario'}
            icon={<Checkmark24Regular />}
            carregando={salvando}
            disabled={somenteLeitura}
            onClick={() => salvar(true)}
            aria-label="Responder sim"
          >
            Sim
          </Botao>
          <Botao
            variante={resposta === false ? 'perigo' : 'secundario'}
            icon={<Dismiss24Regular />}
            carregando={salvando}
            disabled={somenteLeitura}
            onClick={() => salvar(false)}
            aria-label="Responder nao"
          >
            Nao
          </Botao>
          <Botao
            variante="sutil"
            disabled={salvando || somenteLeitura}
            onClick={() => setMostrarObservacao((v) => !v)}
          >
            {mostrarObservacao
              ? 'Ocultar observacao'
              : item.observacao
                ? 'Editar observacao'
                : 'Observacao'}
          </Botao>
        </div>

        {resposta === false && (
          <Text size={200} className={c.naoConforme}>
            Item marcado como nao conforme.
          </Text>
        )}

        {mostrarObservacao && (
          <div className={c.observacao}>
            <Textarea
              value={texto}
              onChange={(_, dados) => setTexto(dados.value)}
              placeholder="Observacao (opcional)"
              resize="vertical"
              rows={2}
              readOnly={somenteLeitura}
            />
            <div className={c.acoes}>
              <Botao
                variante="sutil"
                carregando={salvando}
                disabled={somenteLeitura}
                onClick={() => salvar(resposta)}
              >
                Salvar observacao
              </Botao>
            </div>
          </div>
        )}

        {resposta === false && (desvio || !somenteLeitura) && (
          <div className={c.desvio}>
            <Text size={200} weight="semibold">
              Desvio (RF-E20/E21)
            </Text>

            {formDesvioAberto ? (
              <>
                <Field
                  label="Motivo"
                  required
                  validationMessage={erroDesvio ?? undefined}
                  validationState={erroDesvio ? 'error' : 'none'}
                >
                  <Select
                    value={motivo}
                    disabled={somenteLeitura}
                    onChange={(_, dados) => setMotivo(dados.value as MotivoDesvio)}
                  >
                    <option value="">Selecione…</option>
                    {MOTIVOS.map((m) => (
                      <option key={m} value={m}>
                        {ROTULO_MOTIVO[m]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Textarea
                  value={obsDesvio}
                  onChange={(_, dados) => setObsDesvio(dados.value)}
                  placeholder={
                    motivo === 'outro'
                      ? 'Descreva o desvio (obrigatorio)'
                      : 'Observacao (opcional)'
                  }
                  resize="vertical"
                  rows={2}
                  disabled={somenteLeitura}
                />
                <div className={c.acoes}>
                  <Botao
                    carregando={salvandoDesvio}
                    disabled={somenteLeitura}
                    onClick={confirmarDesvio}
                  >
                    Salvar desvio
                  </Botao>
                  <Botao
                    variante="sutil"
                    disabled={salvandoDesvio}
                    onClick={() => setFormDesvioAberto(false)}
                  >
                    Cancelar
                  </Botao>
                </div>
              </>
            ) : desvio ? (
              <>
                <Text size={200}>{ROTULO_MOTIVO[desvio.motivo]}</Text>
                {desvio.observacao && (
                  <Text size={200} className={c.nota}>
                    {desvio.observacao}
                  </Text>
                )}
                <div className={c.acoes}>
                  <Botao variante="sutil" disabled={somenteLeitura} onClick={abrirFormDesvio}>
                    Editar desvio
                  </Botao>
                  <Botao variante="sutil" disabled={somenteLeitura} onClick={apagarDesvio}>
                    Remover desvio
                  </Botao>
                </div>
              </>
            ) : (
              <>
                <Text size={200} className={c.nota}>
                  Informe o motivo do desvio para o cartório.
                </Text>
                <div className={c.acoes}>
                  <Botao variante="secundario" disabled={somenteLeitura} onClick={abrirFormDesvio}>
                    Registrar desvio
                  </Botao>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Cartao>
  );
}
