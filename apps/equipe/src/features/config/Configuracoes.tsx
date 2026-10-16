import { useEffect, useState } from 'react';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  Delete24Regular,
  Person24Regular,
  SignOut24Regular,
} from '@fluentui/react-icons';
import { Aviso, Botao, CabecalhoApp, Cartao, Selo, pontoTablet } from '@montaje/ui';
import { useSessao } from '@/features/auth/store';
import { ROTULO_PAPEL } from '@montaje/core';
import { limparTudo } from '@/db/repo';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import { CartaoInstalar } from '@/features/pwa/CartaoInstalar';
import {
  baixarDadosDoDia,
  ultimaSincronizacao,
  type ResultadoDownload,
} from '@/features/sync/download';

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
  perfil: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  linha: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  rotulo: {
    color: tokens.colorNeutralForeground3,
  },
  acoes: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: tokens.spacingVerticalS,
    [`@media ${pontoTablet}`]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: tokens.spacingHorizontalM,
    },
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
  const perfil = useSessao((s) => s.perfil);
  const definirPerfil = useSessao((s) => s.definirPerfil);

  const [baixando, setBaixando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoDownload | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ultima, setUltima] = useState<string | null>(null);

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
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao baixar os dados.');
    } finally {
      setBaixando(false);
    }
  }

  async function sair() {
    if (supabaseConfigurado) {
      await supabase().auth.signOut();
    }
    definirPerfil(null);
  }

  async function limpar() {
    if (confirm('Apagar todos os dados locais? Itens ainda não enviados serão perdidos.')) {
      await limparTudo();
      definirPerfil(null);
    }
  }

  return (
    <>
      <CabecalhoApp titulo="Ajustes" subtitulo="Conta e dados do aparelho" />

      <div className={c.pagina}>
        <Cartao>
          <div className={c.perfil}>
            <div className={c.linha}>
              <span className={c.linha} style={{ gap: tokens.spacingHorizontalS }}>
                <Person24Regular />
                <Text weight="semibold">{perfil?.nome ?? '—'}</Text>
              </span>
              {perfil && <Selo texto={ROTULO_PAPEL[perfil.papel]} tom="marca" />}
            </div>
            <Text size={200} className={c.rotulo}>
              Matrícula {perfil?.matricula ?? '—'}
            </Text>
            <Text size={200} className={c.rotulo}>
              Última sincronização: {formatarDataHora(ultima)}
            </Text>
          </div>
        </Cartao>

        <Botao onClick={baixar} carregando={baixando} icon={<ArrowDownload24Regular />}>
          Baixar dados do dia
        </Botao>

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

        <CartaoInstalar />

        <div className={c.acoes}>
          <Botao variante="perigo" onClick={limpar} icon={<Delete24Regular />}>
            Apagar dados locais
          </Botao>

          <Botao variante="secundario" onClick={sair} icon={<SignOut24Regular />}>
            Sair
          </Botao>
        </div>
      </div>
    </>
  );
}
