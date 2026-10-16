import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { zLoginEquipe, emailSintetico, type LoginEquipe, type Perfil } from '@montaje/core';
import { Text, Title1, makeStyles, tokens } from '@fluentui/react-components';
import { Campo, Aviso, Botao } from '@montaje/ui';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import { salvarPerfil } from '@/db/repo';
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
  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
    maxWidth: '380px',
  },
  marca: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXS,
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
        <Title1>Montagem das seções</Title1>
        <Text size={300}>Entre com a matrícula e o código do cartório</Text>
      </div>

      <form onSubmit={handleSubmit(entrar)} className={c.formulario} noValidate>
        <Controller
          name="matricula"
          control={control}
          render={({ field }) => (
            <Campo
              rotulo="Matrícula"
              placeholder="Sua matrícula"
              autoComplete="username"
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

        <Botao type="submit" carregando={isSubmitting}>
          Entrar
        </Botao>
      </form>

      <Text size={200} align="center">
        Sem cadastro aberto. O código é fornecido pelo cartório eleitoral.
      </Text>
    </main>
  );
}
