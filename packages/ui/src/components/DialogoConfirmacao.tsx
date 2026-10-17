import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
} from '@fluentui/react-components';
import type { ReactNode } from 'react';
import { Botao, type VarianteBotao } from './Botao';

export interface DialogoConfirmacaoProps {
  /** Controla a visibilidade do diálogo. */
  aberto: boolean;
  /** Fechar/cancelar o diálogo. */
  aoFechar: () => void;
  titulo: string;
  descricao?: ReactNode;
  rotuloConfirmar?: string;
  rotuloCancelar?: string;
  /** `perigo` para ações destrutivas (exclusões). */
  tom?: 'primario' | 'perigo';
  carregando?: boolean;
  aoConfirmar: () => void;
}

/**
 * Diálogo de confirmação para substituir `window.confirm`.
 * Ex.: logout e exclusão de dados locais.
 */
export function DialogoConfirmacao({
  aberto,
  aoFechar,
  titulo,
  descricao,
  rotuloConfirmar = 'Confirmar',
  rotuloCancelar = 'Cancelar',
  tom = 'primario',
  carregando = false,
  aoConfirmar,
}: DialogoConfirmacaoProps) {
  const variante: VarianteBotao = tom === 'perigo' ? 'perigo' : 'primario';
  return (
    <Dialog
      open={aberto}
      modalType="modal"
      onOpenChange={(_evento, dados) => {
        if (!dados.open) aoFechar();
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{titulo}</DialogTitle>
          {descricao && <DialogContent>{descricao}</DialogContent>}
          <DialogActions>
            <Botao variante="secundario" onClick={aoFechar} disabled={carregando}>
              {rotuloCancelar}
            </Botao>
            <Botao variante={variante} onClick={aoConfirmar} carregando={carregando}>
              {rotuloConfirmar}
            </Botao>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
