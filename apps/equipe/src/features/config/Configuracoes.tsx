import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  RadioGroup,
  Switch,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowDownload24Regular,
  ArrowUpload24Regular,
  Delete24Regular,
  Desktop24Regular,
  DocumentText24Regular,
  HardDrive24Regular,
  Info24Regular,
  Person24Regular,
  Save24Regular,
  SignOut24Regular,
  WeatherMoon24Regular,
  WeatherSunny24Regular,
} from '@fluentui/react-icons';
import {
  Aviso,
  Botao,
  CabecalhoApp,
  Cartao,
  ConteudoPagina,
  DialogoConfirmacao,
  Medalhao,
  Selo,
  useTema,
  type Tema,
} from '@montaje/ui';
import { useSessao } from '@/features/auth/store';
import { ROTULO_PAPEL } from '@montaje/core';
import { limparTudo } from '@/db/repo';
import {
  estadoDoArmazenamento,
  formatarBytes,
  solicitarArmazenamentoPersistente,
  type EstadoArmazenamento,
} from '@/db/armazenamento';
import {
  exportarBackup,
  resumoDoAparelho,
  restaurarBackup,
  ultimoBackup,
} from '@/db/backup';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import { CartaoInstalar } from '@/features/pwa/CartaoInstalar';
import { useInstalarPWA } from '@/features/pwa/useInstalarPWA';
import { ModelosLayout } from '@/features/layout/ModelosLayout';
import {
  baixarDadosDoDia,
  ultimaSincronizacao,
  type ResultadoDownload,
} from '@/features/sync/download';
import { useAvisos } from '@/lib/avisos';

const useClasses = makeStyles({
  rotulo: {
    color: tokens.colorNeutralForeground3,
  },
  radios: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  radioOpcao: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minHeight: '44px',
  },
  dados: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  acoes: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: tokens.spacingVerticalS,
  },
  lista: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalL,
  },
});

function formatarDataHora(iso: string | null): string {
  if (!iso) return 'nunca';
  return new Date(iso).toLocaleString('pt-BR');
}

export function Configuracoes() {
  const c = useClasses();
  const avisos = useAvisos();
  const navigate = useNavigate();
  const perfil = useSessao((s) => s.perfil);
  const definirPerfil = useSessao((s) => s.definirPerfil);
  const { tema, definirTema, modoSol, definirModoSol } = useTema();
  const { instalado } = useInstalarPWA();

  const [baixando, setBaixando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoDownload | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ultima, setUltima] = useState<string | null>(null);
  const [confirmarLimpar, setConfirmarLimpar] = useState(false);
  const [limpando, setLimpando] = useState(false);
  const [confirmarSair, setConfirmarSair] = useState(false);

  // APP-27 — persistência e backup local.
  const [armazenamento, setArmazenamento] = useState<EstadoArmazenamento | null>(null);
  const [ultimoBackupEm, setUltimoBackupEm] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [arquivoRestaurar, setArquivoRestaurar] = useState<File | null>(null);
  const [erroBackup, setErroBackup] = useState<string | null>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);
  const resumo = useLiveQuery(() => resumoDoAparelho(), [], undefined);

  useEffect(() => {
    void ultimaSincronizacao().then(setUltima);
  }, []);

  useEffect(() => {
    void (async () => {
      // Pede armazenamento persistente e lê o estado para exibir em Ajustes.
      await solicitarArmazenamentoPersistente();
      setArmazenamento(await estadoDoArmazenamento());
      setUltimoBackupEm(await ultimoBackup());
    })();
  }, []);

  async function baixar() {
    setErro(null);
    setResultado(null);
    setBaixando(true);
    // Gesto do usuário: boa hora para pedir armazenamento persistente.
    void solicitarArmazenamentoPersistente();
    try {
      const r = await baixarDadosDoDia();
      setResultado(r);
      setUltima(await ultimaSincronizacao());
      setArmazenamento(await estadoDoArmazenamento());
      if (r.incompleto) {
        avisos.alerta(
          'Download incompleto',
          `${r.locais} local(is) · ${r.secoes} seção(ões) · ${r.itens} itens.`,
        );
      } else {
        avisos.sucesso(
          'Dados baixados',
          `${r.locais} local(is) · ${r.secoes} seção(ões) · ${r.itens} itens.`,
        );
      }
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : 'Falha ao baixar os dados.';
      setErro(mensagem);
      avisos.erro('Não foi possível baixar', mensagem);
    } finally {
      setBaixando(false);
    }
  }

  async function sair() {
    try {
      if (supabaseConfigurado) {
        await supabase().auth.signOut();
      }
    } finally {
      definirPerfil(null);
    }
  }

  async function limpar() {
    setLimpando(true);
    try {
      await limparTudo();
      definirPerfil(null);
      avisos.sucesso('Dados apagados', 'Todos os dados locais foram removidos.');
    } catch {
      avisos.erro('Não foi possível apagar', 'Tente novamente.');
    } finally {
      setLimpando(false);
      setConfirmarLimpar(false);
    }
  }

  async function salvarBackup() {
    setErroBackup(null);
    setExportando(true);
    try {
      const r = await exportarBackup();
      setUltimoBackupEm(await ultimoBackup());
      avisos.sucesso(
        'Backup salvo',
        `${r.fotos} foto(s) · ${formatarBytes(r.bytes)}. Guarde o arquivo em local seguro.`,
      );
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : 'Não foi possível gerar o backup.';
      setErroBackup(mensagem);
      avisos.erro('Falha no backup', mensagem);
    } finally {
      setExportando(false);
    }
  }

  function escolherArquivo() {
    setErroBackup(null);
    inputArquivo.current?.click();
  }

  function aoEscolherArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ''; // permite escolher o mesmo arquivo novamente
    if (arquivo) setArquivoRestaurar(arquivo);
  }

  async function restaurar() {
    if (!arquivoRestaurar) return;
    setErroBackup(null);
    setRestaurando(true);
    try {
      const r = await restaurarBackup(arquivoRestaurar);
      setUltimoBackupEm(await ultimoBackup());
      setUltima(await ultimaSincronizacao());
      avisos.sucesso('Backup restaurado', `${r.secoes} seção(ões) · ${r.fotos} foto(s).`);
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : 'Não foi possível restaurar o backup.';
      setErroBackup(mensagem);
      avisos.erro('Falha ao restaurar', mensagem);
    } finally {
      setRestaurando(false);
      setArquivoRestaurar(null);
    }
  }

  return (
    <>
      <CabecalhoApp titulo="Ajustes" subtitulo="Conta e dados do aparelho" />

      <ConteudoPagina>
        <Cartao
          inicio={
            <Medalhao tom="marca">
              <Person24Regular />
            </Medalhao>
          }
          titulo={perfil?.nome ?? 'Não autenticado'}
          descricao={`Matrícula ${perfil?.matricula ?? '—'}`}
          acao={perfil ? <Selo texto={ROTULO_PAPEL[perfil.papel]} tom="marca" /> : undefined}
        >
          <Text size={200} className={c.rotulo}>
            Última sincronização: {formatarDataHora(ultima)}
          </Text>
        </Cartao>

        <Cartao
          titulo="Aparência"
          descricao="Escolha como o app deve aparecer neste aparelho."
        >
          <RadioGroup
            className={c.radios}
            value={tema}
            onChange={(_evento, dados) => definirTema(dados.value as Tema)}
          >
            <Radio
              value="claro"
              label={
                <span className={c.radioOpcao}>
                  <WeatherSunny24Regular /> Claro
                </span>
              }
            />
            <Radio
              value="escuro"
              label={
                <span className={c.radioOpcao}>
                  <WeatherMoon24Regular /> Escuro
                </span>
              }
            />
            <Radio
              value="sistema"
              label={
                <span className={c.radioOpcao}>
                  <Desktop24Regular /> Seguir o sistema
                </span>
              }
            />
          </RadioGroup>
        </Cartao>

        <Cartao
          inicio={
            <Medalhao tom={modoSol ? 'ok' : 'neutro'}>
              <WeatherSunny24Regular />
            </Medalhao>
          }
          titulo="Uso sob o sol"
          descricao="Aumenta o contraste e o destaque dos contornos para ler a tela na rua."
        >
          <div className={c.dados}>
            <Switch
              checked={modoSol}
              onChange={(_evento, dados) => definirModoSol(dados.checked)}
              label={modoSol ? 'Modo sol ligado' : 'Modo sol desligado'}
            />
            <Text size={200} className={c.rotulo}>
              Fundo branco e textos/bordas mais escuros — pensado para ambientes muito claros.
            </Text>
          </div>
        </Cartao>

        <ModelosLayout />

        <Cartao
          inicio={
            <Medalhao tom="marca">
              <DocumentText24Regular />
            </Medalhao>
          }
          titulo="Manual da equipe"
          descricao="Guia rápido de campo: antes de sair, montagem, fotos e envio."
          clicavel
          onClick={() => navigate('/manual')}
        />

        <Cartao titulo="Dados no aparelho">
          <div className={c.dados}>
            <Botao
              onClick={baixar}
              carregando={baixando}
              icon={<ArrowDownload24Regular />}
              larguraTotal
            >
              Baixar dados do dia
            </Botao>
            <Text size={200} className={c.rotulo}>
              Baixe o cronograma, seções e itens antes de sair para campo, enquanto houver
              internet.
            </Text>

            {erro && (
              <Aviso tom="erro" titulo="Não foi possível baixar">
                {erro}
              </Aviso>
            )}

            {resultado && (
              <Aviso
                tom={resultado.incompleto ? 'alerta' : 'sucesso'}
                titulo={resultado.incompleto ? 'Download incompleto' : 'Dados baixados'}
              >
                <Text size={200}>
                  {resultado.locais} local(is) · {resultado.secoes} seção(ões) ·{' '}
                  {resultado.itens} itens
                </Text>
                {resultado.avisos.length > 0 && (
                  <ul className={c.lista}>
                    {resultado.avisos.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                )}
              </Aviso>
            )}
          </div>
        </Cartao>

        <Cartao
          inicio={
            <Medalhao tom={armazenamento?.persistido ? 'ok' : 'neutro'}>
              <HardDrive24Regular />
            </Medalhao>
          }
          titulo="Backup e armazenamento"
          descricao="Protege o checklist e as fotos que ainda não subiram."
        >
          <div className={c.dados}>
            <Text size={200} className={c.rotulo}>
              {armazenamento?.persistido
                ? 'Armazenamento protegido: o navegador não descarta estes dados automaticamente.'
                : 'Armazenamento comum: sob falta de espaço o navegador pode apagar dados não enviados.'}
            </Text>
            <Text size={200} className={c.rotulo}>
              No aparelho: {resumo?.secoes ?? 0} seção(ões) · {resumo?.itens ?? 0} item(ns) ·{' '}
              {resumo?.fotos ?? 0} foto(s)
              {armazenamento?.usoBytes != null
                ? ` · ${formatarBytes(armazenamento.usoBytes)} em uso`
                : ''}
              {resumo && resumo.pendentes > 0 ? ` · ${resumo.pendentes} pendente(s)` : ''}
            </Text>
            <Text size={200} className={c.rotulo}>
              Último backup: {formatarDataHora(ultimoBackupEm)}
            </Text>

            {erroBackup && (
              <Aviso tom="erro" titulo="Falha no backup">
                {erroBackup}
              </Aviso>
            )}

            <Botao
              onClick={salvarBackup}
              carregando={exportando}
              icon={<Save24Regular />}
              larguraTotal
            >
              Salvar backup no aparelho
            </Botao>
            <Botao
              variante="secundario"
              onClick={escolherArquivo}
              icon={<ArrowUpload24Regular />}
              larguraTotal
            >
              Restaurar backup
            </Botao>
            <Text size={200} className={c.rotulo}>
              O backup é um arquivo .json com tudo o que está no aparelho, incluindo as fotos.
              Guarde-o em local seguro (nuvem ou e-mail) antes de sair para o campo.
            </Text>
            <input
              ref={inputArquivo}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={aoEscolherArquivo}
            />
          </div>
        </Cartao>

        <CartaoInstalar />

        <Cartao
          inicio={
            <Medalhao tom="neutro">
              <Info24Regular />
            </Medalhao>
          }
          titulo="MontaJE — Montagem de Seções"
          descricao={`Versão ${__VERSAO_APP__}`}
        >
          <Text size={200} className={c.rotulo}>
            {instalado
              ? 'Aplicativo instalado (tela cheia).'
              : 'Aberto no navegador. Instale para usar em tela cheia.'}
          </Text>
        </Cartao>

        <div className={c.acoes}>
          <Botao
            variante="secundario"
            onClick={() => setConfirmarSair(true)}
            icon={<SignOut24Regular />}
            larguraTotal
          >
            Sair da conta
          </Botao>

          <Botao
            variante="perigo"
            onClick={() => setConfirmarLimpar(true)}
            icon={<Delete24Regular />}
            larguraTotal
          >
            Apagar dados locais
          </Botao>
        </div>
      </ConteudoPagina>

      <DialogoConfirmacao
        aberto={confirmarSair}
        aoFechar={() => setConfirmarSair(false)}
        titulo="Sair da conta?"
        descricao="Você precisará entrar novamente com a matrícula e o código do cartório."
        rotuloConfirmar="Sair"
        aoConfirmar={sair}
      />

      <DialogoConfirmacao
        aberto={confirmarLimpar}
        aoFechar={() => setConfirmarLimpar(false)}
        titulo="Apagar todos os dados locais?"
        descricao="Itens ainda não enviados serão perdidos. Esta ação não pode ser desfeita."
        rotuloConfirmar="Apagar dados"
        tom="perigo"
        carregando={limpando}
        aoConfirmar={limpar}
      />

      <DialogoConfirmacao
        aberto={arquivoRestaurar !== null}
        aoFechar={() => setArquivoRestaurar(null)}
        titulo="Restaurar este backup?"
        descricao="Os dados atuais do aparelho serão substituídos pelo conteúdo do arquivo. Envios ainda pendentes no arquivo voltam para a fila."
        rotuloConfirmar="Restaurar"
        tom="perigo"
        carregando={restaurando}
        aoConfirmar={restaurar}
      />
    </>
  );
}
