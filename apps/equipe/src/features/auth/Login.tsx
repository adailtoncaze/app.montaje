import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  zLoginEquipe,
  emailSintetico,
  type LoginEquipe,
  type Perfil,
} from '@montaje/core';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { Building24Regular, Key24Regular, Person24Regular } from '@fluentui/react-icons';
import { Aviso, Botao, Campo, Cartao, Medalhao } from '@montaje/ui';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import { salvarPerfil } from '@/db/repo';
import { useSessao } from './store';

const useClasses = makeStyles({
  pagina: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalXL,
    minHeight: '100%',
    boxSizing: 'border-box',
    padding: tokens.spacingVerticalXXL,
    paddingTop: `calc(${tokens.spacingVerticalXXL} + env(safe-area-inset-top, 0px))`,
    paddingBottom: `calc(${tokens.spacingVerticalXXL} + env(safe-area-inset-bottom, 0px))`,
    background: `radial-gradient(1100px 560px at 50% -12%, ${tokens.colorBrandBackground2}, transparent)`,
  },
  marca: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalS,
    textAlign: 'center',
    maxWidth: '420px',
  },
  tituloMarca: {
    letterSpacing: '-0.02em',
    color: tokens.colorBrandForeground1,
  },
  cartao: {
    width: '100%',
    maxWidth: '400px',
    boxShadow: tokens.shadow16,
    padding: tokens.spacingVerticalXL,
  },
  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  rodape: {
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    maxWidth: '360px',
  },
});

export function Login() {
  const c = useClasses();
  const navigate = useNavigate();
  const definirPerfil = useSessao((s) => s.definirPerfil);
  const [erro, setErro] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginEquipe>({ resolver: zodResolver(zLoginEquipe) });

  async function entrar(dados: LoginEquipe) {
    setErro(null);
    if (!supabaseConfigurado) {
      setErro('Supabase não configurado. Preencha o arquivo .env.local na raiz.');
      return;
    }
    try {
      const client = supabase();
      const { data, error } = await client.auth.signInWithPassword({
        email: emailSintetico(dados.matricula),
        password: dados.codigo,
      });
      if (error) throw error;

      const { data: perfil, error: erroPerfil } = await client
        .from('perfis')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (erroPerfil) throw erroPerfil;

      await salvarPerfil(perfil as Perfil);
      definirPerfil(perfil as Perfil);
      navigate('/locais', { replace: true });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao entrar');
    }
  }

  return (
    <main className={c.pagina}>
      <div className={c.marca}>
        <Medalhao tom="marca" tamanho="grande">
          <Building24Regular />
        </Medalhao>
        <Text className={c.tituloMarca} size={700} weight="bold">
          MontaJE
        </Text>
        <Text size={300}>Montagem das seções eleitorais</Text>
      </div>

      <Cartao className={c.cartao}>
        <form onSubmit={handleSubmit(entrar)} className={c.formulario} noValidate>
          <Controller
            name="matricula"
            control={control}
            render={({ field }) => (
              <Campo
                rotulo="Matrícula"
                placeholder="Sua matrícula"
                autoComplete="username"
                contentBefore={<Person24Regular />}
                erro={errors.matricula?.message}
                value={field.value ?? ''}
                onChange={(_, d) => field.onChange(d.value)}
                onBlur={field.onBlur}
                name={field.name}
              />
            )}
          />

          <Controller
            name="codigo"
            control={control}
            render={({ field }) => (
              <Campo
                rotulo="Código de acesso"
                type="password"
                placeholder="Código fornecido pelo cartório"
                autoComplete="current-password"
                contentBefore={<Key24Regular />}
                erro={errors.codigo?.message}
                value={field.value ?? ''}
                onChange={(_, d) => field.onChange(d.value)}
                onBlur={field.onBlur}
                name={field.name}
              />
            )}
          />

          {erro && (
            <Aviso tom="erro" titulo="Não foi possível entrar">
              {erro}
            </Aviso>
          )}

          <Botao type="submit" larguraTotal carregando={isSubmitting}>
            Entrar
          </Botao>
        </form>
      </Cartao>

      <Text size={200} className={c.rodape}>
        Sem cadastro aberto. O código é fornecido pelo cartório eleitoral.
      </Text>
    </main>
  );
}
