import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useNavigate } from 'react-router-dom';
import { CircleAlert, Landmark, LoaderCircle } from 'lucide-react';
import { emailSintetico, zLoginCartorio, type LoginCartorio, type Perfil } from '@montaje/core';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import { useSessao } from './store';

export function Login() {
  const navigate = useNavigate();
  const perfilAtual = useSessao((s) => s.perfil);
  const definirPerfil = useSessao((s) => s.definirPerfil);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginCartorio>({ resolver: zodResolver(zLoginCartorio) });

  if (perfilAtual) return <Navigate to="/" replace />;

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
      navigate('/', { replace: true });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao entrar');
    }
  }

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Landmark className="size-6" />
          </span>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-primary">MontaJE</span>
            <h1 className="text-lg font-semibold text-foreground">Painel do Cartório</h1>
            <p className="text-sm text-muted-foreground">Validação das seções</p>
          </div>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit(entrar)} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-2">
                <Label htmlFor="identificador">E-mail ou matrícula</Label>
                <Input
                  id="identificador"
                  autoComplete="username"
                  placeholder="validador@cartorio.local"
                  aria-invalid={Boolean(errors.identificador)}
                  {...register('identificador')}
                />
                {errors.identificador && (
                  <p className="text-xs text-danger">{errors.identificador.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.senha)}
                  {...register('senha')}
                />
                {errors.senha && <p className="text-xs text-danger">{errors.senha.message}</p>}
              </div>

              {erro && (
                <Alert variant="destructive">
                  <AlertIcon>
                    <CircleAlert />
                  </AlertIcon>
                  <div className="flex flex-col gap-1">
                    <AlertTitle>Não foi possível entrar</AlertTitle>
                    <AlertDescription>{erro}</AlertDescription>
                  </div>
                </Alert>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <LoaderCircle className="animate-spin" />}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
