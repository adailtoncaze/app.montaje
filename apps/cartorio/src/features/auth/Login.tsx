import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { zLoginCartorio, emailSintetico, type LoginCartorio, type Perfil } from '@montaje/core';
import { Text, Title1, makeStyles, tokens } from '@fluentui/react-components';
import { Aviso, Botao, Campo } from '@montaje/ui';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import { useSessao } from './store';

const useClasses = makeStyles({
  pagina: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacingVerticalL,
    minHeight: '100%',
    padding: tokens.spacingVerticalXXL,
  },
  marca: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXS,
  },
  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
    maxWidth: '380px',
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
  } = useForm<LoginCartorio>({ resolver: zodResolver(zLoginCartorio) });

  async function entrar(dados: LoginCartorio) {
    setErro(null);
    if (!supabaseConfigurado) {
      setErro('Supabase não configurado. Preencha o arquivo .env.');
      return;
    }
    try {
      const client = supabase();
      const email = dados.identificador.includes('@')
        ? dados.identificador
        : emailSintetico(dados.identificador);

      const { data, error } = await client.auth.signInWithPassword({
        email,
        password: dados.senha,
      });
      if (error) throw error;

      const { data: perfil, error: erroPerfil } = await client
        .from('perfis')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (erroPerfil) throw erroPerfil;

      if (perfil.papel === 'equipe') {
        throw new Error('Este acesso é do painel do cartório.');
      }

      definirPerfil(perfil as Perfil);
      navigate('/secoes', { replace: true });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao entrar');
    }
  }

  return (
    <main className={c.pagina}>
      <div className={c.marca}>
        <Text size={600} weight="bold" style={{ color: tokens.colorBrandForeground1 }}>
          MontaJE
        </Text>
        <Title1>Cartório</Title1>
        <Text size={300}>Painel de validação das seções</Text>
      </div>

      <form onSubmit={handleSubmit(entrar)} className={c.formulario} noValidate>
        <Controller
          name="identificador"
          control={control}
          render={({ field }) => (
            <Campo
              rotulo="E-mail ou matrícula"
              placeholder="validador@cartorio.local"
              autoComplete="username"
              erro={errors.identificador?.message}
              value={field.value ?? ''}
              onChange={(_, d) => field.onChange(d.value)}
              onBlur={field.onBlur}
              name={field.name}
            />
          )}
        />

        <Controller
          name="senha"
          control={control}
          render={({ field }) => (
            <Campo
              rotulo="Senha"
              type="password"
              autoComplete="current-password"
              erro={errors.senha?.message}
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

        <Botao type="submit" carregando={isSubmitting}>
          Entrar
        </Botao>
      </form>
    </main>
  );
}
