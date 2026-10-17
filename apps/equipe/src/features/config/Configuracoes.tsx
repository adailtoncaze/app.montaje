import { useEffect, useState } from 'react';
import {
  Radio,
  RadioGroup,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  Delete24Regular,
  Desktop24Regular,
  Info24Regular,
  Person24Regular,
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
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import { CartaoInstalar } from '@/features/pwa/CartaoInstalar';
import { useInstalarPWA } from '@/features/pwa/useInstalarPWA';
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
    minHeight: '32px',
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
  const perfil = useSessao((s) => s.perfil);
  const definirPerfil = useSessao((s) => s.definirPerfil);
  const { tema, definirTema } = useTema();
  const { instalado } = useInstalarPWA();

  const [baixando, setBaixando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoDownload | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ultima, setUltima] = useState<string | null>(null);
  const [confirmarLimpar, setConfirmarLimpar] = useState(false);
  const [limpando, setLimpando] = useState(false);
  const [confirmarSair, setConfirmarSair] = useState(false);

  useEffect(() => {
    void ultimaSincronizacao().then(setUltima);
  }, []);

  async function baixar() {
    setErro(null);
    setResultado(null);
    setBaixando(true);
    try {
      const r = await baixarDadosDoDia();
      setResultado(r);
      setUltima(await ultimaSincronizacao());
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
    </>
  );
}
